"use client";
import { useState }           from "react";
import { useRouter }          from "next/navigation";
import { getDatabase, ref, get, set } from "firebase/database";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { app }               from "@/lib/firebase";   
import bcrypt                 from "bcryptjs";

export default function Auth() {
  const db      = getDatabase(app);          
  const router  = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [job,      setJob]      = useState("사용자");

  /* ---------- 회원가입 ---------- */
  const handleSignup = async () => {
    if (!nickname || !password || !confirm) return toast.error("모든 항목을 반드시 기입해주세요");
    if (password !== confirm)               return toast.error("비밀번호가 일치하지 않습니다");

    const userRef = ref(db, `users/${nickname}`);
    const snap    = await get(userRef);
    if (snap.exists())                      return toast.error("이미 존재하는 닉네임입니다");

    const hashed = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    await set(userRef, { password: hashed, job })
      .then(() => {
        toast.success("회원가입 완료! 로그인 해 주세요");
        setIsLogin(true);
        setPassword(""); setConfirm("");
      })
      .catch(err => alert("저장 오류: "+err.code));   
  };

  /* ---------- 로그인 ---------- */
  const handleLogin = async () => {
    if (!nickname || !password) return toast.error("닉네임/비밀번호를 입력해주세요");

    const userRef = ref(db, `users/${nickname}`);
    const snap    = await get(userRef);
    if (!snap.exists())         return toast.error("존재하지 않는 닉네임입니다");

    const user = snap.val();
    if (!bcrypt.compareSync(password, user.password))
      return toast.error("비밀번호가 일치하지 않습니다");
    localStorage.setItem("nickname", nickname); // 로그인 이후 닉네임 저장 처리
    router.push("/rooms");
  };

 
  const inputStyle = {
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #555",
    background: "#1e1e1e",
    color: "#eee",
  };
  const btnStyle = {
    padding: "12px 24px",
    fontSize: "1rem",
    background: "#1e1e1e",
    color: "#eee",
    border: "none",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
    cursor: "pointer",
  };


  return (
    <div style={{
      minHeight: "100vh",
      background: "#121212",
      color: "#eee",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "20px"
    }}>
      <ToastContainer position="top-center" />
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>🚀 ARsol</h1>

   
      <input
        placeholder="닉네임 입력"
        value={nickname}
        onChange={e => setNickname(e.target.value)}
        style={inputStyle}
      />

 
      {isLogin && (
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
      )}


      {!isLogin && (
        <>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            style={inputStyle}
          />
          <select
            value={job}
            onChange={e => setJob(e.target.value)}
            style={inputStyle}
          >
            <option value="전문가">전문가</option>
            <option value="사용자">사용자</option>
          </select>
        </>
      )}


      {isLogin ? (
        <button onClick={handleLogin} style={btnStyle}>로그인</button>
      ) : (
        <button onClick={handleSignup} style={btnStyle}>회원가입</button>
      )}


      {isLogin ? (
        <button
          onClick={() => { setIsLogin(false); setPassword(""); }}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
        >
          회원가입 하기
        </button>
      ) : (
        <button
          onClick={() => { setIsLogin(true); setPassword(""); setConfirm(""); }}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
        >
          로그인으로 돌아가기
        </button>
      )}     
    </div>
    
  );
}
