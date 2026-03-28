"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getVoterId } from "@/utils/voter";
import type { Submission } from "@/types/common";

export default function GalleryPage() {
  const [entries, setEntries] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"latest" | "votes">("votes");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEntries = useCallback(async () => {
    const voterId = getVoterId();
    const res = await fetch(
      `/api/submissions?sort=${filter}&voter_id=${voterId}`,
    );
    const data = await res.json();
    setEntries(data.submissions ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleVote = async (id: string) => {
    const voterId = getVoterId();
    const res = await fetch(`/api/submissions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    });
    const data = await res.json();

    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, vote_count: data.voteCount, voted_by_me: data.voted }
          : e,
      ),
    );
  };

  const sorted = [...entries].sort((a, b) =>
    filter === "votes"
      ? b.vote_count - a.vote_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

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
          Gallery
        </h1>

        <button
          onClick={() => router.push("/ranking")}
          className="flex items-center gap-2 text-sm font-bold transition-colors"
          style={{ color: "#bf81ff", fontFamily: "var(--font-space-grotesk)" }}
        >
          <span className="material-symbols-outlined text-[18px]">
            leaderboard
          </span>
          랭킹
        </button>
      </header>

      {/* 필터 탭 */}
      <div
        className="flex gap-1 px-8 py-4 sticky top-16 z-10"
        style={{
          backgroundColor: "#0e0e0f",
          borderBottom: "1px solid rgba(72,72,73,0.1)",
        }}
      >
        {(["votes", "latest"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: filter === f ? "#ffffff" : "#767576",
              background: filter === f ? "linear-gradient(135deg, #bf81ff, #e879f9)" : "transparent",
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span
              className="text-sm"
              style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
            >
              불러오는 중...
            </span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: "#262627" }}
            >
              collections
            </span>
            <span
              className="text-sm"
              style={{ color: "#484849", fontFamily: "var(--font-inter)" }}
            >
              아직 제출된 작품이 없습니다
            </span>
          </div>
        ) : (
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
                {/* 미��보기 */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: 200, backgroundColor: "#0a0a0b" }}
                >
                  <iframe
                    srcDoc={entry.html_code}
                    className="w-full h-full border-0 pointer-events-none"
                    sandbox=""
                    title={`${entry.nickname}의 작품`}
                    style={{
                      transform: "scale(0.8)",
                      transformOrigin: "top left",
                      width: "125%",
                      height: "125%",
                    }}
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
                      style={{
                        color: "#ffffff",
                        fontFamily: "var(--font-space-grotesk)",
                      }}
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
                        style={{
                          color: "#767576",
                          fontFamily: "var(--font-space-grotesk)",
                        }}
                      >
                        {entry.vote_count}
                      </span>
                    </div>
                    <button
                      onClick={() => handleVote(entry.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-all hover:opacity-90"
                      style={{
                        backgroundColor: entry.voted_by_me
                          ? "rgba(143,245,255,0.1)"
                          : "#8ff5ff",
                        color: entry.voted_by_me ? "#8ff5ff" : "#005d63",
                        fontFamily: "var(--font-space-grotesk)",
                        borderRadius: "6px",
                        border: entry.voted_by_me
                          ? "1px solid rgba(143,245,255,0.2)"
                          : "none",
                      }}
                    >
                      {entry.voted_by_me ? (
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
        )}
      </main>
    </div>
  );
}
