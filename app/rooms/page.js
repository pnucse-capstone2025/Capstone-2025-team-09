"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { socket } from "../../lib/socket";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { app }               from "@/lib/firebase";  
import { getDatabase, ref, get, set } from "firebase/database";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState("전체");
  const db = getDatabase(app);          
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userJob, setUserJob] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);   
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);

  useEffect(() => {
    setCurrentUser(localStorage.getItem("nickname"));
  }, []);
  useEffect(()=> {
    const fetchJob = async () => {
      const snapshot = await get(ref(db, `users/${currentUser}/job`));
      setUserJob(snapshot.val());
    }
    fetchJob();
  }, [currentUser]);

  useEffect(() => {
    socket.emit("get-rooms");
    socket.on("rooms-updated", (updatedRooms) => {
      console.log("rooms-updated:", updatedRooms);
      setRooms(updatedRooms);
    });

    return () => {
      socket.off("rooms-updated");
    };
  }, []);

  const getStatus = (room) => (room.count >= 2 ? "상담 중" : "대기 중");

  const logOut = () => {
    toast.info("로그아웃 되었습니다");
    localStorage.setItem("nickname", null);
    router.push("/signpage");
  }

  const tryJoinRoom = (room) => {
    if (getStatus(room) === "상담 중") return;
    const nickname = localStorage.getItem("nickname") || "익명";
    const inputPw = prompt(`${room.roomName} 방 비밀번호를 입력하세요:`);
    if (!inputPw) return;

    console.log("emit join-room", { roomId: room.id, pw: inputPw });

    socket.off("invalid-password");
    socket.off("join-success");

    socket.on("invalid-password", () => {
      console.log("invalid-password received");
      alert("비밀번호가 틀렸습니다.");
    });

    socket.on("join-success", ({ roomId }) => {
      console.log("join-success received", roomId);
      router.push(`/room/${roomId}`);
    });

    socket.emit("join-room", { roomId: room.id, password: inputPw, nickname });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      background: "#121212",
      color: "#eee",
      padding: "20px",
      position: "relative"
    }}>
      <ToastContainer position="top-center" />
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",   
          marginBottom: "20px",
          position: "relative"        
        }}
      >
        <h2 style={{ fontSize: "2rem", margin: 0 }}>상담 방 게시판 (실시간)</h2>
        <button
          onClick={toggleDrawer}
          aria-label="메뉴 열기"
          style={{
            position: "absolute",
            right: 0,                  
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.8rem",
            color: "#eee"
          }}
        >
          ☰
        </button>
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        {["전체", "대기 중", "상담 중"].map(tag => (
          <button key={tag} onClick={() => setFilter(tag)}
            style={{
              padding: "8px 16px",
              background: filter === tag ? "#22c55e" : "#1e1e1e",
              color: "#eee",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}>
            {tag}
          </button>
        ))}
      </div>
      {userJob == "사용자" && <button onClick={() =>{router.push("/create")}}
        style={{
          padding: "10px 20px",
          background: "#1e1e1e",
          color: "#eee",
          border: "none",
          borderRadius: "8px",
          marginBottom: "30px",
          cursor: "pointer"
        }}>
        방 만들기
      </button>}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px"
      }}>
        {rooms.filter(room => filter === "전체" || getStatus(room) === filter)
          .map(room => (
            <div key={room.id} onClick={() => {
              if(userJob == "전문가")
                tryJoinRoom(room);
              else
                toast.error("전문가만이 방에 참가할 수 있습니다");
            }}
              style={{
                background: getStatus(room) === "상담 중" ? "#2c2c2c" : "#1e1e1e",
                borderRadius: "10px",
                padding: "20px",
                cursor: getStatus(room) === "상담 중" ? "not-allowed" : "pointer",
                color: "#eee"
              }}>
              <div style={{ fontSize: "1.2rem", marginBottom: "8px" }}>방 이름: {room.roomName}</div>
              <div style={{ fontSize: "0.9rem", color: "#bbb", marginBottom: "6px" }}>
                게시글: {room.postContent}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#bbb", marginBottom: "6px" }}>
                현재 인원: {room.count} / 2
              </div>
              <div style={{
                marginTop: "10px",
                display: "inline-block",
                padding: "2px 6px",
                background: getStatus(room) === "상담 중" ? "#ff4444" : "#22c55e",
                borderRadius: "6px",
                fontSize: "0.8rem",
                whiteSpace: "pre-line",
                wordBreak: "keep-all",
                textAlign: "center"
              }}>{getStatus(room)}</div>
            </div>
          ))}
      </div>
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "240px",
          height: "100%",
          background: "#1e1e1e",
          color: "#eee",
          boxShadow: "-2px 0 6px rgba(0,0,0,.6)",
          padding: "16px",
          overflowY: "auto",

          /* 슬라이드 애니메이션 */
          transform: isDrawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform .3s ease-in-out",
          zIndex: 100
        }}
      >
        <button
          onClick={toggleDrawer}
          aria-label="닫기"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.5rem",
            color: "#eee",
            marginBottom: "12px"
          }}
        >
          ✕
        </button>
          <h3 style={{margin:"0 0 12px"}}>안녕하세요 {currentUser}님!</h3>
          <button style={drawerBtnStyle} onClick={() => router.push('/showrecording')}>
            녹화 영상 확인
          </button>
          <button style={drawerBtnStyle} onClick={() => router.push('/showreview')}>
            리뷰 확인
          </button>
          
          <button onClick={() => logOut()}style={btnStyle}>로그아웃</button>
      </aside>
    </div>
  );
}

const btnStyle = {
  padding: "8px 16px", background: "#b54545ff", color: "#eee", border: "none", position:"top-center",
  borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.4)", cursor: "pointer", transition: "0.3s"
};

const drawerBtnStyle = {
  width:"100%",
  padding:"10px",
  marginBottom:"8px",
  textAlign:"left",
  background:"#2b2b2b",
  color:"#eee",
  border:"none",
  borderRadius:"6px",
  cursor:"pointer"
};
