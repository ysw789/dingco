"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LobbyPage() {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!nickname.trim()) return;
    router.push(`/game?nickname=${encodeURIComponent(nickname.trim())}`);
  };

  return (
    <div
      className="flex h-screen overflow-hidden items-center justify-center relative"
      style={{ backgroundColor: "#0e0e0f", color: "#ffffff" }}
    >
      {/* 배경 글로우 */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ backgroundColor: "rgba(143,245,255,0.04)", filter: "blur(120px)" }}
      />

      <div className="flex flex-col items-center gap-10 z-10 w-full max-w-lg px-6">
        {/* 타이틀 */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "#8ff5ff", boxShadow: "0 0 8px #8ff5ff" }}
            />
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}
            >
              Live Session
            </span>
          </div>
          <h1
            className="text-5xl font-bold tracking-tight"
            style={{
              color: "#ffffff",
              fontFamily: "var(--font-space-grotesk)",
              textShadow: "0 0 40px rgba(143,245,255,0.2)",
            }}
          >
            말 안 듣는
          </h1>
          <h1
            className="text-5xl font-bold tracking-tight"
            style={{
              color: "#8ff5ff",
              fontFamily: "var(--font-space-grotesk)",
              textShadow: "0 0 40px rgba(143,245,255,0.4)",
            }}
          >
            AI IDE
          </h1>
          <p
            className="text-sm mt-4 leading-relaxed"
            style={{ color: "#767576", fontFamily: "var(--font-inter)" }}
          >
            음성으로 요청하면 AI가 정반대로 구현합니다.
            <br />
            1분 안에 가장 예쁜 페이지를 만드세요.
          </p>
        </div>

        {/* 룰 카드 */}
        <div
          className="w-full p-5 space-y-3"
          style={{
            backgroundColor: "#131314",
            border: "1px solid rgba(72,72,73,0.2)",
            borderRadius: "12px",
          }}
        >
          {[
            { icon: "mic", text: "음성으로만 지시할 수 있습니다" },
            { icon: "swap_horiz", text: "AI가 반대로 구현합니다" },
            { icon: "timer", text: "제한 시간은 1분입니다" },
            { icon: "how_to_vote", text: "참가자 투표로 순위가 결정됩니다" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span
                className="material-symbols-outlined text-[18px] shrink-0"
                style={{ color: "#8ff5ff" }}
              >
                {icon}
              </span>
              <span
                className="text-xs"
                style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* 닉네임 입력 */}
        <div className="w-full space-y-3">
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            className="w-full bg-transparent outline-none text-sm px-4 py-3"
            style={{
              color: "#ffffff",
              fontFamily: "var(--font-inter)",
              border: "1px solid rgba(72,72,73,0.3)",
              borderRadius: "8px",
              backgroundColor: "#131314",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(143,245,255,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(72,72,73,0.3)")}
          />
          <button
            onClick={handleStart}
            disabled={!nickname.trim()}
            className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#8ff5ff",
              color: "#005d63",
              fontFamily: "var(--font-space-grotesk)",
              borderRadius: "8px",
              boxShadow: "0 0 30px rgba(143,245,255,0.2)",
            }}
          >
            게임 시작
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/gallery")}
              className="flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90"
              style={{
                color: "#8ff5ff",
                fontFamily: "var(--font-space-grotesk)",
                border: "1px solid rgba(143,245,255,0.2)",
                borderRadius: "8px",
                backgroundColor: "rgba(143,245,255,0.05)",
              }}
            >
              갤러리 보기
            </button>
            <button
              onClick={() => router.push("/ranking")}
              className="flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90"
              style={{
                color: "#adaaab",
                fontFamily: "var(--font-space-grotesk)",
                border: "1px solid rgba(72,72,73,0.2)",
                borderRadius: "8px",
              }}
            >
              랭킹 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
