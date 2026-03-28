"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MOCK_CODE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      background: #ff6b6b;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 40px;
      font-family: 'Comic Sans MS', cursive;
    }
    .btn {
      background: lime;
      color: purple;
      font-size: 48px;
      border: 8px dashed orange;
      padding: 30px 60px;
      cursor: pointer;
      transform: rotate(15deg);
      margin-top: 40px;
    }
    h1 {
      color: yellow;
      font-size: 72px;
      text-shadow: 4px 4px 0px black;
    }
  </style>
</head>
<body>
  <h1>절대 누르지 마세요</h1>
  <button class="btn">누르지 마세요</button>
</body>
</html>`;

const MOCK_TRANSCRIPT = "버튼을 왼쪽에 파란색 작은 버튼으로 만들어줘";

function GameContent() {
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "익명";
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [code, setCode] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleMicClick = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
    if (isProcessing) return;
    setIsRecording((r) => {
      if (!r) {
        // 녹음 시작 → 2초 후 mock transcript + processing
        setTimeout(() => {
          setIsRecording(false);
          setTranscript(MOCK_TRANSCRIPT);
          setIsProcessing(true);
          setTimeout(() => {
            setIsProcessing(false);
            setCode(MOCK_CODE);
          }, 2500);
        }, 2000);
      }
      return !r;
    });
  };

  const timerColor =
    timeLeft <= 10 ? "#ff4d4d" : timeLeft <= 30 ? "#ffb84d" : "#8ff5ff";

  const timerGlow =
    timeLeft <= 10
      ? "0 0 30px rgba(255,77,77,0.5)"
      : timeLeft <= 30
      ? "0 0 30px rgba(255,184,77,0.3)"
      : "0 0 30px rgba(143,245,255,0.3)";

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  if (isSubmitted) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "#0e0e0f" }}
      >
        <div className="text-center space-y-6">
          <span
            className="material-symbols-outlined text-6xl block"
            style={{ color: "#8ff5ff" }}
          >
            check_circle
          </span>
          <h2
            className="text-3xl font-bold"
            style={{ color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}
          >
            제출 완료!
          </h2>
          <p style={{ color: "#767576", fontFamily: "var(--font-inter)" }}>
            갤러리에서 투표가 시작됩니다.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/gallery")}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase"
              style={{
                backgroundColor: "#8ff5ff",
                color: "#005d63",
                fontFamily: "var(--font-space-grotesk)",
                borderRadius: "8px",
              }}
            >
              갤러리 보기
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 text-sm font-bold tracking-widest uppercase"
              style={{
                color: "#adaaab",
                fontFamily: "var(--font-space-grotesk)",
                border: "1px solid rgba(72,72,73,0.3)",
                borderRadius: "8px",
              }}
            >
              다시 하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: "#0e0e0f", color: "#ffffff" }}
    >
      {/* 상단 헤더 */}
      <header
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{
          backgroundColor: "#131314",
          borderBottom: "1px solid rgba(72,72,73,0.15)",
        }}
      >
        {/* 닉네임 */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "rgba(143,245,255,0.1)",
              border: "1px solid rgba(143,245,255,0.2)",
            }}
          >
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ color: "#8ff5ff" }}
            >
              person
            </span>
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}
          >
            {nickname}
          </span>
        </div>

        {/* 타이머 */}
        <div className="flex flex-col items-center">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{
              color: timerColor,
              fontFamily: "var(--font-space-grotesk)",
              textShadow: timerGlow,
              transition: "color 0.5s, text-shadow 0.5s",
            }}
          >
            {mins}:{secs}
          </span>
          {!isRunning && timeLeft === 60 && (
            <span
              className="text-[9px] tracking-widest uppercase"
              style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}
            >
              마이크 버튼으로 시작
            </span>
          )}
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={() => setIsSubmitted(true)}
          disabled={!code}
          className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#8ff5ff",
            color: "#005d63",
            fontFamily: "var(--font-space-grotesk)",
            borderRadius: "6px",
          }}
        >
          <span className="material-symbols-outlined text-[16px]">upload</span>
          제출
        </button>
      </header>

      {/* 메인 2분할 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 코드 에디터 */}
        <div
          className="flex flex-col w-1/2 h-full"
          style={{ borderRight: "1px solid rgba(72,72,73,0.15)" }}
        >
          {/* 에디터 탭 바 */}
          <div
            className="flex items-center gap-0 px-4 h-9 shrink-0"
            style={{
              backgroundColor: "#131314",
              borderBottom: "1px solid rgba(72,72,73,0.15)",
            }}
          >
            <div
              className="flex items-center gap-2 px-3 h-full"
              style={{
                borderBottom: "2px solid #8ff5ff",
              }}
            >
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ color: "#8ff5ff" }}
              >
                html
              </span>
              <span
                className="text-[11px]"
                style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}
              >
                index.html
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div
                className="px-2 py-0.5 text-[9px] tracking-widest uppercase"
                style={{
                  color: "#484849",
                  border: "1px solid rgba(72,72,73,0.2)",
                  borderRadius: "4px",
                  fontFamily: "var(--font-space-grotesk)",
                }}
              >
                Read Only
              </div>
            </div>
          </div>

          {/* 코드 영역 */}
          <div className="flex-1 overflow-auto" style={{ backgroundColor: "#0a0a0b" }}>
            {code ? (
              <pre
                className="p-4 text-xs leading-6 h-full"
                style={{
                  color: "#adaaab",
                  fontFamily: "var(--font-geist-mono)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {code.split("\n").map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span
                      className="select-none w-8 text-right shrink-0"
                      style={{ color: "#484849" }}
                    >
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                  <span
                    className="material-symbols-outlined text-4xl block"
                    style={{ color: "#262627" }}
                  >
                    code
                  </span>
                  <p
                    className="text-xs"
                    style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
                  >
                    AI가 코드를 생성하면 여기에 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* STT 영역 */}
          <div
            className="shrink-0 px-4 py-3 flex items-center gap-3"
            style={{
              backgroundColor: "#131314",
              borderTop: "1px solid rgba(72,72,73,0.15)",
              minHeight: 56,
            }}
          >
            {/* 마이크 버튼 */}
            <button
              onClick={handleMicClick}
              disabled={timeLeft === 0 || isProcessing}
              className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all disabled:opacity-40"
              style={{
                backgroundColor: isRecording
                  ? "rgba(255,77,77,0.15)"
                  : "rgba(143,245,255,0.1)",
                border: isRecording
                  ? "1px solid rgba(255,77,77,0.4)"
                  : "1px solid rgba(143,245,255,0.3)",
                boxShadow: isRecording ? "0 0 15px rgba(255,77,77,0.3)" : "none",
              }}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isRecording ? "animate-pulse" : ""}`}
                style={{ color: isRecording ? "#ff4d4d" : "#8ff5ff" }}
              >
                {isRecording ? "stop_circle" : "mic"}
              </span>
            </button>

            {/* 트랜스크립트 */}
            <div className="flex-1">
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "#8ff5ff", boxShadow: "0 0 4px #8ff5ff" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "#8ff5ff", fontFamily: "var(--font-inter)" }}
                  >
                    AI가 반대로 구현 중...
                  </span>
                </div>
              ) : transcript ? (
                <p
                  className="text-xs line-clamp-2"
                  style={{ color: "#767576", fontFamily: "var(--font-inter)" }}
                >
                  &quot;{transcript}&quot;
                </p>
              ) : (
                <p
                  className="text-xs"
                  style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
                >
                  {isRecording ? "말씀하세요..." : "마이크 버튼을 눌러 지시하세요"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex flex-col w-1/2 h-full">
          {/* 미리보기 탭 바 */}
          <div
            className="flex items-center gap-2 px-4 h-9 shrink-0"
            style={{
              backgroundColor: "#131314",
              borderBottom: "1px solid rgba(72,72,73,0.15)",
            }}
          >
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ color: "#767576" }}
            >
              preview
            </span>
            <span
              className="text-[11px]"
              style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}
            >
              Preview
            </span>
          </div>

          {/* iframe 미리보기 */}
          <div className="flex-1 overflow-hidden">
            {code ? (
              <iframe
                srcDoc={code}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="preview"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center"
                style={{ backgroundColor: "#0d0d0e" }}
              >
                <div className="text-center space-y-3">
                  <span
                    className="material-symbols-outlined text-4xl block"
                    style={{ color: "#262627" }}
                  >
                    web
                  </span>
                  <p
                    className="text-xs"
                    style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
                  >
                    미리보기가 여기에 표시됩니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GameContent />
    </Suspense>
  );
}
