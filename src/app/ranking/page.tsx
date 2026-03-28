"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RankEntry } from "@/types/common";

const BADGES: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

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
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then((data) => setRankings(data.rankings ?? []))
      .finally(() => setLoading(false));
  }, []);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  // 포디엄 순서: 2위 - 1위 - 3위
  const podiumOrder =
    top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  const totalVotes = rankings.reduce((s, e) => s + e.vote_count, 0);

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
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#ffffff")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "#adaaab")
          }
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
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
          Ranking
        </h1>

        <button
          onClick={() => router.push("/gallery")}
          className="flex items-center gap-2 text-sm font-bold transition-colors"
          style={{
            color: "#8ff5ff",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">
            grid_view
          </span>
          갤러리
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span
              className="text-sm"
              style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
            >
              불러오는 중...
            </span>
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: "#262627" }}
            >
              leaderboard
            </span>
            <span
              className="text-sm"
              style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
            >
              아직 랭킹 데이터가 없습니다
            </span>
          </div>
        ) : (
          <>
            {/* 포디엄 섹션 */}
            {top3.length >= 3 && (
              <div className="mt-12 mb-10">
                <p
                  className="text-center text-[10px] tracking-widest uppercase mb-8"
                  style={{
                    color: "#484849",
                    fontFamily: "var(--font-space-grotesk)",
                  }}
                >
                  Top 3
                </p>

                <div className="flex items-end justify-center gap-4">
                  {podiumOrder.map((entry) => {
                    const color = PODIUM_COLORS[entry.rank];
                    const height = PODIUM_HEIGHTS[entry.rank];
                    const isFirst = entry.rank === 1;

                    return (
                      <div
                        key={entry.rank}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">
                            {BADGES[entry.rank]}
                          </div>
                          <p
                            className="text-sm font-bold"
                            style={{
                              color: isFirst ? color : "#ffffff",
                              fontFamily: "var(--font-space-grotesk)",
                              textShadow: isFirst
                                ? `0 0 20px ${color}66`
                                : "none",
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
                              style={{
                                color,
                                fontFamily: "var(--font-space-grotesk)",
                              }}
                            >
                              {entry.vote_count}
                            </span>
                          </div>
                        </div>

                        <div
                          className="w-28 flex items-center justify-center"
                          style={{
                            height,
                            backgroundColor: `${color}18`,
                            border: `1px solid ${color}44`,
                            borderRadius: "8px 8px 0 0",
                            boxShadow: isFirst
                              ? `0 0 30px ${color}22`
                              : "none",
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

                <div
                  className="h-px w-full mt-0"
                  style={{ backgroundColor: "rgba(72,72,73,0.2)" }}
                />
              </div>
            )}

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
                  <span
                    className="w-6 text-center text-sm font-bold tabular-nums"
                    style={{
                      color: "#484849",
                      fontFamily: "var(--font-space-grotesk)",
                    }}
                  >
                    {entry.rank}
                  </span>

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

                  <span
                    className="flex-1 text-sm font-medium"
                    style={{
                      color: "#adaaab",
                      fontFamily: "var(--font-space-grotesk)",
                    }}
                  >
                    {entry.nickname}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ color: "#484849" }}
                    >
                      favorite
                    </span>
                    <span
                      className="text-sm tabular-nums font-bold"
                      style={{
                        color: "#767576",
                        fontFamily: "var(--font-space-grotesk)",
                      }}
                    >
                      {entry.vote_count}
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
                style={{
                  color: "#8ff5ff",
                  fontFamily: "var(--font-space-grotesk)",
                }}
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
                {totalVotes}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
