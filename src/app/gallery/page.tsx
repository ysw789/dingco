"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Entry = {
  id: number;
  nickname: string;
  votes: number;
  voted: boolean;
  preview: string; // srcdoc HTML
};

const MOCK_ENTRIES: Entry[] = [
  {
    id: 1,
    nickname: "진국",
    votes: 14,
    voted: false,
    preview: `<body style="margin:0;background:#ff6b6b;display:flex;flex-direction:column;align-items:flex-end;padding:40px;font-family:'Comic Sans MS',cursive"><h1 style="color:yellow;font-size:60px;text-shadow:3px 3px black">절대 누르지 마세요</h1><button style="background:lime;color:purple;font-size:36px;border:6px dashed orange;padding:20px 40px;transform:rotate(15deg);margin-top:30px">누르지 마세요</button></body>`,
  },
  {
    id: 2,
    nickname: "승완이형",
    votes: 9,
    voted: false,
    preview: `<body style="margin:0;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center;color:white;font-family:sans-serif"><h1 style="font-size:48px;color:#e94560">로그인</h1><input placeholder="이메일" style="display:block;width:280px;padding:12px;margin:10px auto;background:#0f3460;border:1px solid #e94560;color:white;border-radius:4px"><input type="password" placeholder="비밀번호" style="display:block;width:280px;padding:12px;margin:10px auto;background:#0f3460;border:1px solid #e94560;color:white;border-radius:4px"><button style="background:#e94560;color:white;border:none;padding:14px 60px;font-size:16px;border-radius:4px;margin-top:10px;cursor:pointer">로그아웃</button></div></body>`,
  },
  {
    id: 3,
    nickname: "길",
    votes: 21,
    voted: false,
    preview: `<body style="margin:0;background:#0a0a0a;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><div style="border:1px solid #333;padding:40px 60px;text-align:center"><h1 style="color:#ffffff;font-size:32px;font-weight:300;letter-spacing:8px;text-transform:uppercase">PORTFOLIO</h1><div style="width:40px;height:1px;background:#fff;margin:20px auto"></div><p style="color:#666;font-size:13px;letter-spacing:3px">CREATIVE DEVELOPER</p><div style="margin-top:30px;display:flex;gap:12px;justify-content:center"><div style="width:8px;height:8px;background:#fff;border-radius:50%"></div><div style="width:8px;height:8px;background:#555;border-radius:50%"></div><div style="width:8px;height:8px;background:#555;border-radius:50%"></div></div></div></body>`,
  },
  {
    id: 4,
    nickname: "강태",
    votes: 7,
    voted: false,
    preview: `<body style="margin:0;background:hotpink;display:flex;align-items:center;justify-content:center;height:100vh"><div style="background:white;padding:50px;border-radius:999px;text-align:center;transform:rotate(-5deg)"><h1 style="color:hotpink;font-size:48px;font-family:'Comic Sans MS'">귀여워요</h1><p style="font-size:60px">🌸🌸🌸</p><button style="background:hotpink;color:white;border:none;padding:15px 40px;border-radius:999px;font-size:18px;cursor:pointer">최애</button></div></body>`,
  },
  {
    id: 5,
    nickname: "익명1",
    votes: 3,
    voted: false,
    preview: `<body style="margin:0;background:#111;color:#0f0;font-family:monospace;padding:20px;height:100vh;box-sizing:border-box"><p style="font-size:12px">> SYSTEM BOOT COMPLETE</p><p style="font-size:12px">> Loading modules... <span style="color:#fff">[OK]</span></p><p style="font-size:12px">> Neural net initialized</p><p style="font-size:12px">> <span style="color:#ff0">WARNING: UNAUTHORIZED ACCESS DETECTED</span></p><p style="font-size:12px">> Countermeasures deployed</p><p style="color:#0f0;font-size:12px;margin-top:20px">> _</p></body>`,
  },
  {
    id: 6,
    nickname: "익명2",
    votes: 11,
    voted: false,
    preview: `<body style="margin:0;background:linear-gradient(to bottom,#87CEEB,#98FB98);display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100vh;font-family:sans-serif"><div style="font-size:80px;margin-bottom:20px">☀️</div><div style="width:100%;background:#3d8c40;height:80px;display:flex;align-items:center;justify-content:center"><button style="background:#8B4513;color:white;border:none;padding:12px 30px;border-radius:4px;font-size:14px">심기</button></div></body>`,
  },
];

export default function GalleryPage() {
  const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES);
  const [filter, setFilter] = useState<"latest" | "votes">("votes");
  const router = useRouter();

  const sorted = [...entries].sort((a, b) =>
    filter === "votes" ? b.votes - a.votes : b.id - a.id
  );

  const handleVote = (id: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id && !e.voted
          ? { ...e, votes: e.votes + 1, voted: true }
          : e
      )
    );
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#0e0e0f", color: "#ffffff" }}
    >
      {/* 상단 헤더 */}
      <header
        className="flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-10"
        style={{
          backgroundColor: "#131314",
          borderBottom: "1px solid rgba(72,72,73,0.15)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 transition-colors"
          style={{ color: "#adaaab" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ffffff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#adaaab")}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span
            className="text-sm"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            홈
          </span>
        </button>

        <h1
          className="text-lg font-bold tracking-widest uppercase"
          style={{ color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}
        >
          Gallery
        </h1>

        <button
          onClick={() => router.push("/ranking")}
          className="flex items-center gap-2 text-sm font-bold transition-colors"
          style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
          랭킹
        </button>
      </header>

      {/* 필터 탭 */}
      <div
        className="flex gap-1 px-8 py-4 sticky top-16 z-10"
        style={{ backgroundColor: "#0e0e0f", borderBottom: "1px solid rgba(72,72,73,0.1)" }}
      >
        {(["votes", "latest"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: filter === f ? "#005d63" : "#767576",
              backgroundColor: filter === f ? "#8ff5ff" : "transparent",
              border: filter === f ? "none" : "1px solid rgba(72,72,73,0.2)",
              borderRadius: "6px",
            }}
          >
            {f === "votes" ? "인기순" : "최신순"}
          </button>
        ))}
        <span
          className="ml-auto text-xs self-center"
          style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
        >
          {entries.length}개의 작품
        </span>
      </div>

      {/* 갤러리 그리드 */}
      <main className="flex-1 p-8">
        <div className="grid grid-cols-3 gap-5 max-w-6xl mx-auto">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col overflow-hidden transition-transform hover:-translate-y-1 duration-200"
              style={{
                backgroundColor: "#131314",
                border: "1px solid rgba(72,72,73,0.15)",
                borderRadius: "12px",
              }}
            >
              {/* 미리보기 */}
              <div
                className="relative overflow-hidden"
                style={{ height: 200, backgroundColor: "#0a0a0b" }}
              >
                <iframe
                  srcDoc={entry.preview}
                  className="w-full h-full border-0 pointer-events-none"
                  sandbox=""
                  title={`${entry.nickname}의 작품`}
                  style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "125%", height: "125%" }}
                />
              </div>

              {/* 카드 하단 */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(143,245,255,0.1)",
                      border: "1px solid rgba(143,245,255,0.15)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[12px]"
                      style={{ color: "#8ff5ff" }}
                    >
                      person
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {entry.nickname}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ color: "#767576" }}
                    >
                      favorite
                    </span>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {entry.votes}
                    </span>
                  </div>
                  <button
                    onClick={() => handleVote(entry.id)}
                    disabled={entry.voted}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: entry.voted
                        ? "rgba(143,245,255,0.1)"
                        : "#8ff5ff",
                      color: entry.voted ? "#8ff5ff" : "#005d63",
                      fontFamily: "var(--font-space-grotesk)",
                      borderRadius: "6px",
                      border: entry.voted ? "1px solid rgba(143,245,255,0.2)" : "none",
                    }}
                  >
                    {entry.voted ? (
                      <>
                        <span className="material-symbols-outlined text-[14px]">
                          check
                        </span>
                        투표됨
                      </>
                    ) : (
                      "투표"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
