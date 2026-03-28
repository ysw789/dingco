"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ExampleImage } from "@/types/common";

type Phase = "setup" | "game" | "result";
type GameSubPhase = "idle" | "recording" | "confirming" | "generating" | "showing";

/* ───────── voice animation keyframes (injected once) ───────── */
const STYLE_ID = "dingco-keyframes";
function injectKeyframes() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes dingco-pulse-ring {
      0% { transform: scale(0.8); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 0.2; }
      100% { transform: scale(0.8); opacity: 0.8; }
    }
    @keyframes dingco-flip-in {
      0% { transform: rotateX(90deg) scaleY(0); opacity: 0; }
      60% { transform: rotateX(-10deg) scaleY(1.05); opacity: 1; }
      100% { transform: rotateX(0deg) scaleY(1); opacity: 1; }
    }
    @keyframes dingco-fade-up {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes dingco-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

const LIMIT_OPTIONS = [1, 2, 3, 5, 10, 0] as const; // 0 = 무제한
const TIME_OPTIONS = [1, 2, 3, 5, 10, 0] as const;

export default function HomePage() {
  const router = useRouter();

  /* ── Phase state ── */
  const [phase, setPhase] = useState<Phase>("setup");

  /* ── Setup state ── */
  const [nickname, setNickname] = useState("");
  const [attemptLimit, setAttemptLimit] = useState<number>(5);
  const [timeLimitMin, setTimeLimitMin] = useState<number>(3);

  /* ── Game state ── */
  const [exampleImage, setExampleImage] = useState<ExampleImage | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [subPhase, setSubPhase] = useState<GameSubPhase>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [micError, setMicError] = useState("");
  const [showFlip, setShowFlip] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => { injectKeyframes(); }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (phase !== "game" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft > 0]);

  const maxAttempts = attemptLimit === 0 ? Infinity : attemptLimit;
  const hasAttemptsLeft = attemptsUsed < maxAttempts;
  const hasTimeLeft = timeLimitMin === 0 || timeLeft > 0;
  const canContinue = hasAttemptsLeft && hasTimeLeft;

  /* ── Start game ── */
  const handleStart = async () => {
    if (!nickname.trim()) return;
    // Fetch random example image
    try {
      const res = await fetch("/api/example-images");
      const data = await res.json();
      setExampleImage(data.example || null);
    } catch { /* no example image available */ }

    setTimeLeft(timeLimitMin === 0 ? 0 : timeLimitMin * 60);
    setAttemptsUsed(0);
    setPrompts([]);
    setCode("");
    setSubPhase("idle");
    setPhase("game");
  };

  /* ── STT ── */
  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    setMicError("");
    setTranscript("");
    setInterimTranscript("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { setMicError("Chrome 브라우저를 사용해주세요"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (final) setTranscript((p) => (p ? p + " " + final : final));
      setInterimTranscript(interim);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error === "not-allowed") setMicError("마이크 권한을 허용해주세요");
      else if (e.error !== "aborted") setMicError(`음성 인식 오류: ${e.error}`);
    };
    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ok */ }
      }
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setSubPhase("recording");
  }, []);

  const handleStartVoice = () => {
    if (!canContinue) return;
    startRecording();
  };

  const handleConfirmInput = () => {
    stopRecording();
    const fullText = transcript + (interimTranscript ? " " + interimTranscript : "");
    if (!fullText.trim()) { setSubPhase("idle"); return; }
    setCurrentPrompt(fullText.trim());
    setShowFlip(true);
    setSubPhase("confirming");
    setTimeout(() => {
      setShowFlip(false);
      generateCode(fullText.trim());
    }, 1500);
  };

  const generateCode = async (promptText: string) => {
    setSubPhase("generating");
    setAttemptsUsed((a) => a + 1);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: promptText, previousCode: code || undefined }),
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
      setPrompts((p) => [...p, promptText]);
    } catch (err) { console.error("Generate error:", err); }
    setSubPhase("showing");
  };

  const handleNextRound = () => {
    setTranscript("");
    setInterimTranscript("");
    setCurrentPrompt("");
    setSubPhase("idle");
  };

  /* ── Submit ── */
  const handleAutoSubmit = () => {
    stopRecording();
    if (code) submitToGallery();
    else setPhase("result");
  };

  const submitToGallery = async () => {
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          htmlCode: code,
          transcript: prompts.join(" | "),
          userPrompts: prompts,
          exampleImageId: exampleImage?.id || null,
          attemptLimit: attemptLimit || null,
          timeLimit: timeLimitMin || null,
        }),
      });
    } catch { /* ok */ }
    setPhase("result");
  };

  const handleFinish = () => {
    if (code) submitToGallery();
    else setPhase("result");
  };

  /* ── Timer display ── */
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const timerColor = timeLeft <= 10 ? "#ff4d4d" : timeLeft <= 30 ? "#ffb84d" : "#8ff5ff";
  const timerGlow = timeLeft <= 10 ? "0 0 20px rgba(255,77,77,0.5)" : timeLeft <= 30 ? "0 0 20px rgba(255,184,77,0.3)" : "0 0 20px rgba(143,245,255,0.3)";

  const displayTranscript = transcript + (interimTranscript ? (transcript ? " " : "") + interimTranscript : "");

  /* ═════════════════════ SETUP PHASE ═════════════════════ */
  if (phase === "setup") {
    return (
      <div className="flex h-screen overflow-auto items-center justify-center relative" style={{ backgroundColor: "#0e0e0f", color: "#fff" }}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ backgroundColor: "rgba(143,245,255,0.03)", filter: "blur(140px)" }} />

        <div className="flex flex-col items-center gap-8 z-10 w-full max-w-lg px-6 py-12">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-black tracking-tighter" style={{ fontFamily: "var(--font-space-grotesk)", color: "#8ff5ff", textShadow: "0 0 60px rgba(143,245,255,0.4), 0 0 120px rgba(143,245,255,0.1)" }}>
              딩코
            </h1>
            <p className="text-sm leading-relaxed mt-3" style={{ color: "#767576", fontFamily: "var(--font-inter)" }}>
              청개구리 같은 AI를 설득해서<br />예제와 비슷한 화면을 만들어보세요
            </p>
          </div>

          {/* Attempt Limit */}
          <div className="w-full space-y-2">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>횟수 제한</label>
            <div className="flex gap-2 flex-wrap">
              {LIMIT_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAttemptLimit(v)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    backgroundColor: attemptLimit === v ? "#8ff5ff" : "#131314",
                    color: attemptLimit === v ? "#005d63" : "#767576",
                    border: attemptLimit === v ? "none" : "1px solid rgba(72,72,73,0.2)",
                    borderRadius: "6px",
                  }}
                >
                  {v === 0 ? "무제한" : `${v}회`}
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div className="w-full space-y-2">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>시간 제한</label>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setTimeLimitMin(v)}
                  className="px-3 py-1.5 text-xs font-bold transition-all"
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    backgroundColor: timeLimitMin === v ? "#8ff5ff" : "#131314",
                    color: timeLimitMin === v ? "#005d63" : "#767576",
                    border: timeLimitMin === v ? "none" : "1px solid rgba(72,72,73,0.2)",
                    borderRadius: "6px",
                  }}
                >
                  {v === 0 ? "무제한" : `${v}분`}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname + Start */}
          <div className="w-full space-y-3">
            <input
              type="text" placeholder="닉네임을 입력하세요" value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              className="w-full bg-transparent outline-none text-sm px-4 py-3"
              style={{ color: "#fff", fontFamily: "var(--font-inter)", border: "1px solid rgba(72,72,73,0.3)", borderRadius: "8px", backgroundColor: "#131314" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(143,245,255,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(72,72,73,0.3)")}
            />
            <button
              onClick={handleStart} disabled={!nickname.trim()}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#8ff5ff", color: "#005d63", fontFamily: "var(--font-space-grotesk)", borderRadius: "8px", boxShadow: "0 0 30px rgba(143,245,255,0.2)" }}
            >
              시작
            </button>
            <button
              onClick={() => router.push("/gallery")}
              className="w-full py-2.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90"
              style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)", border: "1px solid rgba(143,245,255,0.2)", borderRadius: "8px", backgroundColor: "rgba(143,245,255,0.05)" }}
            >
              갤러리 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════════════ RESULT PHASE ═════════════════════ */
  if (phase === "result") {
    return (
      <div className="flex flex-col h-screen" style={{ backgroundColor: "#0e0e0f", color: "#fff" }}>
        <header className="flex items-center justify-center px-6 h-14 shrink-0" style={{ backgroundColor: "#131314", borderBottom: "1px solid rgba(72,72,73,0.15)" }}>
          <h2 className="text-sm font-bold tracking-widest uppercase" style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}>제출 완료</h2>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto" style={{ minHeight: "70vh" }}>
            {/* Example */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] tracking-widest uppercase" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>제시된 예제</span>
              <div className="flex-1 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
                {exampleImage ? (
                  <iframe srcDoc={exampleImage.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title="예제" />
                ) : (
                  <span className="material-symbols-outlined text-3xl" style={{ color: "#262627" }}>image</span>
                )}
              </div>
            </div>

            {/* Prompts */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] tracking-widest uppercase" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>사용자 입력</span>
              <div className="flex-1 rounded-lg overflow-auto p-4 space-y-3" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
                {prompts.length === 0 ? (
                  <p className="text-xs" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>입력된 프롬프트가 없습니다</p>
                ) : prompts.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] font-bold shrink-0 mt-0.5" style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}>#{i + 1}</span>
                    <p className="text-xs leading-relaxed" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] tracking-widest uppercase" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>딩코가 생성한 킹받는 결과</span>
              <div className="flex-1 rounded-lg overflow-hidden" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
                {code ? (
                  <iframe srcDoc={code} className="w-full border-0" style={{ height: "100%", minHeight: 400 }} sandbox="allow-scripts" title="result" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="material-symbols-outlined text-3xl" style={{ color: "#262627" }}>web</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center px-6 py-4 shrink-0" style={{ backgroundColor: "#131314", borderTop: "1px solid rgba(72,72,73,0.15)" }}>
          <button onClick={() => router.push("/gallery")} className="px-6 py-3 text-sm font-bold tracking-widest uppercase" style={{ backgroundColor: "#8ff5ff", color: "#005d63", fontFamily: "var(--font-space-grotesk)", borderRadius: "8px" }}>갤러리 보기</button>
          <button onClick={() => { setPhase("setup"); setCode(""); setPrompts([]); }} className="px-6 py-3 text-sm font-bold tracking-widest uppercase" style={{ color: "#adaaab", fontFamily: "var(--font-space-grotesk)", border: "1px solid rgba(72,72,73,0.3)", borderRadius: "8px" }}>다시 하기</button>
        </div>
      </div>
    );
  }

  /* ═════════════════════ GAME PHASE ═════════════════════ */
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#0e0e0f", color: "#fff" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 shrink-0" style={{ backgroundColor: "#131314", borderBottom: "1px solid rgba(72,72,73,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(143,245,255,0.1)", border: "1px solid rgba(143,245,255,0.2)" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#8ff5ff" }}>person</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>{nickname}</span>
          </div>
        </div>

        {/* Timer + Attempts */}
        <div className="flex items-center gap-4">
          {attemptLimit > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#484849" }}>repeat</span>
              <span className="text-xs tabular-nums font-bold" style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}>
                {attemptsUsed}/{attemptLimit}
              </span>
            </div>
          )}
          {timeLimitMin > 0 && (
            <span className="text-2xl font-bold tabular-nums" style={{ color: timerColor, fontFamily: "var(--font-space-grotesk)", textShadow: timerGlow, transition: "color 0.5s, text-shadow 0.5s" }}>
              {mins}:{secs}
            </span>
          )}
        </div>

        <button onClick={handleFinish} disabled={!code} className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed" style={{ backgroundColor: "#8ff5ff", color: "#005d63", fontFamily: "var(--font-space-grotesk)", borderRadius: "6px" }}>
          <span className="material-symbols-outlined text-[16px]">upload</span>
          제출
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Example Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
              {exampleImage ? (
                <iframe srcDoc={exampleImage.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title="예제" />
              ) : (
                <div className="text-center space-y-2">
                  <span className="material-symbols-outlined text-4xl" style={{ color: "#262627" }}>image</span>
                  <p className="text-xs" style={{ color: "#484849" }}>예제 이미지 없음</p>
                </div>
              )}
            </div>
            <p className="text-xs text-center" style={{ color: "#767576", fontFamily: "var(--font-inter)" }}>
              청개구리 같은 AI를 잘 설득해서 위 이미지와 최대한 비슷하게 만들어보세요.
            </p>
          </div>

          {/* Voice Input Section */}
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
            {subPhase === "idle" && (
              <>
                {micError && <p className="text-xs" style={{ color: "#ff4d4d", fontFamily: "var(--font-inter)" }}>{micError}</p>}
                <button
                  onClick={handleStartVoice}
                  disabled={!canContinue}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "rgba(143,245,255,0.1)", border: "2px solid rgba(143,245,255,0.3)", boxShadow: "0 0 30px rgba(143,245,255,0.1)" }}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ color: "#8ff5ff" }}>mic</span>
                </button>
                <span className="text-xs" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>
                  {canContinue ? "발화 시작" : "제한에 도달했습니다"}
                </span>
              </>
            )}

            {subPhase === "recording" && (
              <>
                {/* Voice animation — concentric pulsing rings */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${60 + i * 20}px`,
                        height: `${60 + i * 20}px`,
                        border: "1px solid rgba(143,245,255,0.3)",
                        animation: `dingco-pulse-ring ${1.5 + i * 0.3}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,77,77,0.15)", border: "2px solid rgba(255,77,77,0.4)" }}>
                    <span className="material-symbols-outlined text-[24px] animate-pulse" style={{ color: "#ff4d4d" }}>mic</span>
                  </div>
                </div>

                {/* Real-time transcript */}
                <div className="w-full text-center min-h-[40px]">
                  {displayTranscript ? (
                    <p className="text-sm leading-relaxed" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>
                      &quot;{displayTranscript}&quot;
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>말씀하세요...</p>
                  )}
                </div>

                <button
                  onClick={handleConfirmInput}
                  className="px-6 py-2.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90"
                  style={{ backgroundColor: "#8ff5ff", color: "#005d63", fontFamily: "var(--font-space-grotesk)", borderRadius: "8px" }}
                >
                  입력
                </button>
              </>
            )}

            {subPhase === "confirming" && (
              <div className="w-full text-center py-4" style={{ perspective: "600px" }}>
                <div
                  className="inline-block px-6 py-3 rounded-lg"
                  style={{
                    backgroundColor: "rgba(143,245,255,0.08)",
                    border: "1px solid rgba(143,245,255,0.2)",
                    animation: showFlip ? "dingco-flip-in 0.8s ease-out forwards" : "none",
                    transformOrigin: "center center",
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: "#8ff5ff", fontFamily: "var(--font-inter)" }}>&quot;{currentPrompt}&quot;</p>
                </div>
              </div>
            )}

            {subPhase === "generating" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 rounded-full" style={{ border: "2px solid rgba(143,245,255,0.3)", borderTopColor: "#8ff5ff", animation: "dingco-spin 0.8s linear infinite" }} />
                <span className="text-xs" style={{ color: "#8ff5ff", fontFamily: "var(--font-inter)" }}>결과를 생성중입니다.</span>
              </div>
            )}

            {subPhase === "showing" && (
              <div className="w-full space-y-4" style={{ animation: "dingco-fade-up 0.5s ease-out" }}>
                {/* 3-column result */}
                <div className="grid grid-cols-3 gap-3" style={{ height: 350 }}>
                  <div className="rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#0a0a0b", border: "1px solid rgba(72,72,73,0.15)" }}>
                    {exampleImage ? (
                      <iframe srcDoc={exampleImage.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title="예제" />
                    ) : <span className="material-symbols-outlined" style={{ color: "#262627" }}>image</span>}
                  </div>
                  <div className="rounded-lg overflow-auto p-3" style={{ backgroundColor: "#0a0a0b", border: "1px solid rgba(72,72,73,0.15)" }}>
                    <span className="text-[9px] tracking-widest uppercase block mb-2" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>사용자 입력</span>
                    {prompts.map((p, i) => (
                      <p key={i} className="text-[11px] leading-relaxed mb-1" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>
                        <span style={{ color: "#8ff5ff" }}>#{i + 1}</span> {p}
                      </p>
                    ))}
                  </div>
                  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#0a0a0b", border: "1px solid rgba(72,72,73,0.15)" }}>
                    {code && <iframe srcDoc={code} className="w-full border-0" style={{ height: "100%", minHeight: 280 }} sandbox="allow-scripts" title="result" />}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-3">
                  {canContinue ? (
                    <button onClick={handleNextRound} className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase" style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)", border: "1px solid rgba(143,245,255,0.2)", borderRadius: "8px", backgroundColor: "rgba(143,245,255,0.05)" }}>
                      다시 말하기
                    </button>
                  ) : (
                    <button onClick={handleFinish} className="px-5 py-2.5 text-xs font-bold tracking-widest uppercase" style={{ backgroundColor: "#8ff5ff", color: "#005d63", fontFamily: "var(--font-space-grotesk)", borderRadius: "8px" }}>
                      최종 제출
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
