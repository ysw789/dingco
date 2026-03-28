"use client";

import { useRouter } from "next/navigation";

type RankEntry = {
  rank: number;
  nickname: string;
  votes: number;
  badge?: string;
};

const RANKING: RankEntry[] = [
  { rank: 1, nickname: "길", votes: 21, badge: "🥇" },
  { rank: 2, nickname: "진국", votes: 14, badge: "🥈" },
  { rank: 3, nickname: "익명2", votes: 11, badge: "🥉" },
  { rank: 4, nickname: "승완이형", votes: 9 },
  { rank: 5, nickname: "강태", votes: 7 },
  { rank: 6, nickname: "익명1", votes: 3 },
];

const PODIUM_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

const PODIUM_HEIGHTS: Record<number, number> = {
  1: 120,
  2: 90,
  3: 70,
};

export default function RankingPage() {
  const router = useRouter();
  const top3 = RANKING.slice(0, 3);
  const rest = RANKING.slice(3);

  // 포디엄 순서: 2위 - 1위 - 3위
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#0e0e0f", color: "#ffffff" }}
    >
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-8 h-16 shrink-0"
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
          <span className="text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            홈
          </span>
        </button>

        <h1
          className="text-lg font-bold tracking-widest uppercase"
          style={{ color: "#ffffff", fontFamily: "var(--font-space-grotesk)" }}
        >
          Ranking
        </h1>

        <button
          onClick={() => router.push("/gallery")}
          className="flex items-center gap-2 text-sm font-bold transition-colors"
          style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          갤러리
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pb-12">
        {/* 포디엄 섹션 */}
        <div className="mt-12 mb-10">
          <p
            className="text-center text-[10px] tracking-widest uppercase mb-8"
            style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}
          >
            Top 3
          </p>

          {/* 포디엄 */}
          <div className="flex items-end justify-center gap-4">
            {podiumOrder.map((entry) => {
              const color = PODIUM_COLORS[entry.rank];
              const height = PODIUM_HEIGHTS[entry.rank];
              const isFirst = entry.rank === 1;

              return (
                <div key={entry.rank} className="flex flex-col items-center gap-2">
                  {/* 닉네임 + 뱃지 */}
                  <div className="text-center">
                    <div className="text-2xl mb-1">{entry.badge}</div>
                    <p
                      className="text-sm font-bold"
                      style={{
                        color: isFirst ? color : "#ffffff",
                        fontFamily: "var(--font-space-grotesk)",
                        textShadow: isFirst ? `0 0 20px ${color}66` : "none",
                      }}
                    >
                      {entry.nickname}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span
                        className="material-symbols-outlined text-[12px]"
                        style={{ color }}
                      >
                        favorite
                      </span>
                      <span
                        className="text-xs tabular-nums font-bold"
                        style={{ color, fontFamily: "var(--font-space-grotesk)" }}
                      >
                        {entry.votes}
                      </span>
                    </div>
                  </div>

                  {/* 단상 */}
                  <div
                    className="w-28 flex items-center justify-center"
                    style={{
                      height,
                      backgroundColor: `${color}18`,
                      border: `1px solid ${color}44`,
                      borderRadius: "8px 8px 0 0",
                      boxShadow: isFirst ? `0 0 30px ${color}22` : "none",
                    }}
                  >
                    <span
                      className="text-2xl font-black"
                      style={{
                        color: `${color}88`,
                        fontFamily: "var(--font-space-grotesk)",
                      }}
                    >
                      {entry.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 바닥 선 */}
          <div
            className="h-px w-full mt-0"
            style={{ backgroundColor: "rgba(72,72,73,0.2)" }}
          />
        </div>

        {/* 4위 이하 리스트 */}
        <div className="space-y-2">
          {rest.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-4 px-5 py-4 transition-colors"
              style={{
                backgroundColor: "#131314",
                border: "1px solid rgba(72,72,73,0.15)",
                borderRadius: "10px",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(72,72,73,0.3)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(72,72,73,0.15)")
              }
            >
              {/* 순위 */}
              <span
                className="w-6 text-center text-sm font-bold tabular-nums"
                style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}
              >
                {entry.rank}
              </span>

              {/* 아바타 */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "#1e1e1f",
                  border: "1px solid rgba(72,72,73,0.2)",
                }}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ color: "#484849" }}
                >
                  person
                </span>
              </div>

              {/* 닉네임 */}
              <span
                className="flex-1 text-sm font-medium"
                style={{ color: "#adaaab", fontFamily: "var(--font-space-grotesk)" }}
              >
                {entry.nickname}
              </span>

              {/* 득표수 */}
              <div className="flex items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ color: "#484849" }}
                >
                  favorite
                </span>
                <span
                  className="text-sm tabular-nums font-bold"
                  style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}
                >
                  {entry.votes}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 총 투표수 요약 */}
        <div
          className="mt-8 p-4 flex items-center justify-between"
          style={{
            backgroundColor: "rgba(143,245,255,0.04)",
            border: "1px solid rgba(143,245,255,0.1)",
            borderRadius: "10px",
          }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)" }}
          >
            총 투표수
          </span>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{
              color: "#8ff5ff",
              fontFamily: "var(--font-space-grotesk)",
              textShadow: "0 0 20px rgba(143,245,255,0.3)",
            }}
          >
            {RANKING.reduce((s, e) => s + e.votes, 0)}
          </span>
        </div>
      </main>
    </div>
  );
}
