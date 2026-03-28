"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";

// 밝기 낮음(어두움) → 밀도 높은 문자, 밝음 → 밀도 낮은 문자
const ASCII_RAMP = `@#B%8&WM*oahkbdpwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^ .`;

type ColorMode = "cyan" | "green" | "amber" | "white";

const COLOR: Record<ColorMode, string> = {
  cyan: "#8ff5ff",
  green: "#4ade80",
  amber: "#fbbf24",
  white: "#f5f5f5",
};

export default function AsciiPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileUrlRef = useRef<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [asciiLines, setAsciiLines] = useState<string[]>([]);
  const [cols, setCols] = useState(100);
  const [colorMode, setColorMode] = useState<ColorMode>("cyan");
  const [inverted, setInverted] = useState(false);
  const [source, setSource] = useState<"webcam" | "file">("webcam");
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // 문자 비율(높이:너비 ≈ 2:1)을 보정해서 왜곡 없이 표시
    const charAspect = 2.2;
    const videoAspect = video.videoWidth / video.videoHeight;
    const rows = Math.max(1, Math.round(cols / videoAspect / charAspect));

    canvas.width = cols;
    canvas.height = rows;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, cols, rows);
    const { data } = ctx.getImageData(0, 0, cols, rows);
    const ramp = inverted ? ASCII_RAMP.split("").reverse().join("") : ASCII_RAMP;
    const rampLen = ramp.length - 1;

    const lines: string[] = [];
    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        const base = (y * cols + x) * 4;
        // ITU-R BT.709 루미넌스
        const luma =
          0.2126 * data[base] + 0.7152 * data[base + 1] + 0.0722 * data[base + 2];
        const idx = Math.round((luma / 255) * rampLen);
        line += ramp[idx];
      }
      lines.push(line);
    }
    setAsciiLines(lines);

    // FPS 측정
    const counter = fpsCounterRef.current;
    counter.frames++;
    const now = performance.now();
    if (now - counter.lastTime >= 1000) {
      setFps(counter.frames);
      counter.frames = 0;
      counter.lastTime = now;
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [cols, inverted]);

  const startWebcam = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      setIsRunning(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch {
      setError("웹캠 접근 권한이 필요합니다.");
    }
  };

  const stopAll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
        fileUrlRef.current = null;
      }
      video.src = "";
    }
    setIsRunning(false);
    setAsciiLines([]);
    setFps(0);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    stopAll();

    const url = URL.createObjectURL(file);
    fileUrlRef.current = url;
    const video = videoRef.current!;
    video.src = url;
    video.loop = true;
    video.muted = true;
    video.play().then(() => {
      setIsRunning(true);
      rafRef.current = requestAnimationFrame(processFrame);
    });
  };

  const handleToggle = () => {
    if (isRunning) {
      stopAll();
    } else {
      if (source === "webcam") startWebcam();
    }
  };

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  // cols나 inverted가 바뀌면 진행 중인 루프 재시작
  useEffect(() => {
    if (!isRunning) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(processFrame);
  }, [cols, inverted, isRunning, processFrame]);

  const accentColor = COLOR[colorMode];

  return (
    <div className="h-screen bg-[#0e0e0f] flex flex-col overflow-hidden">
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(72,72,73,0.3)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#767576] hover:text-[#adaaab] transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          홈으로
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{
              background: "rgba(143,245,255,0.08)",
              color: "#8ff5ff",
              border: "1px solid rgba(143,245,255,0.2)",
            }}
          >
            ASCII CAMERA
          </span>
          {isRunning && (
            <span className="font-mono text-xs text-[#767576]">{fps} fps</span>
          )}
        </div>

        <div className="w-20" />
      </header>

      {/* ASCII 출력 영역 */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4 relative">
        {asciiLines.length === 0 ? (
          <div className="text-center space-y-4">
            <p
              className="font-mono text-4xl neon-glow select-none"
              style={{ color: accentColor }}
            >
              {Array.from({ length: 5 }, (_, row) =>
                Array.from({ length: 40 }, (_, col) => {
                  const idx = Math.floor(
                    ((Math.sin(row * 0.8 + col * 0.3) + 1) / 2) *
                      (ASCII_RAMP.length - 1)
                  );
                  return ASCII_RAMP[idx];
                }).join("")
              ).join("\n")}
            </p>
            <p className="text-[#767576] text-sm mt-6">
              영상의 픽셀 밝기를 아스키 문자로 실시간 변환합니다
            </p>
          </div>
        ) : (
          <pre
            className="font-mono leading-[1.15] select-none"
            style={{
              color: accentColor,
              fontSize: `${Math.max(5, Math.min(11, Math.floor(1600 / cols)))}px`,
              textShadow: `0 0 6px ${accentColor}40`,
            }}
          >
            {asciiLines.join("\n")}
          </pre>
        )}

        {error && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-lg font-mono"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* 컨트롤 패널 */}
      <div
        className="shrink-0 glass-panel px-6 py-4"
        style={{ borderTop: "1px solid rgba(72,72,73,0.3)" }}
      >
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-4">
          {/* 소스 탭 */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(72,72,73,0.4)" }}
          >
            {(["webcam", "file"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (isRunning) stopAll();
                  setSource(s);
                }}
                className="px-3 py-1.5 text-xs font-mono transition-colors"
                style={{
                  background: source === s ? "rgba(143,245,255,0.12)" : "transparent",
                  color: source === s ? "#8ff5ff" : "#767576",
                }}
              >
                {s === "webcam" ? "웹캠" : "파일"}
              </button>
            ))}
          </div>

          {/* 파일 업로드 */}
          {source === "file" && (
            <label
              className="cursor-pointer px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
              style={{
                background: "rgba(143,245,255,0.08)",
                border: "1px solid rgba(143,245,255,0.2)",
                color: "#8ff5ff",
              }}
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">
                upload_file
              </span>
              영상 선택
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          )}

          {/* 시작/중지 버튼 */}
          {source === "webcam" && (
            <button
              onClick={handleToggle}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono rounded-lg transition-all"
              style={{
                background: isRunning
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(143,245,255,0.12)",
                border: isRunning
                  ? "1px solid rgba(239,68,68,0.3)"
                  : "1px solid rgba(143,245,255,0.3)",
                color: isRunning ? "#f87171" : "#8ff5ff",
              }}
            >
              <span className="material-symbols-outlined text-sm">
                {isRunning ? "stop_circle" : "videocam"}
              </span>
              {isRunning ? "중지" : "웹캠 시작"}
            </button>
          )}

          {/* 해상도 슬라이더 */}
          <div className="flex items-center gap-2 flex-1 min-w-36">
            <span className="text-xs text-[#767576] font-mono whitespace-nowrap">
              열 {cols}
            </span>
            <input
              type="range"
              min={40}
              max={180}
              step={10}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="flex-1 accent-[#8ff5ff] cursor-pointer"
            />
          </div>

          {/* 색상 선택 */}
          <div className="flex gap-1.5">
            {(Object.entries(COLOR) as [ColorMode, string][]).map(([mode, hex]) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                title={mode}
                className="w-6 h-6 rounded-full transition-all"
                style={{
                  background: hex,
                  opacity: colorMode === mode ? 1 : 0.3,
                  outline: colorMode === mode ? `2px solid ${hex}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>

          {/* 반전 토글 */}
          <button
            onClick={() => setInverted((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
            style={{
              background: inverted ? "rgba(143,245,255,0.12)" : "transparent",
              border: "1px solid rgba(72,72,73,0.4)",
              color: inverted ? "#8ff5ff" : "#767576",
            }}
          >
            <span className="material-symbols-outlined text-sm">invert_colors</span>
            반전
          </button>
        </div>
      </div>

      {/* 숨김 처리된 비디오 & 캔버스 (처리 전용) */}
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
