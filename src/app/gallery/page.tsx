"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getVoterId } from "@/utils/voter";
import type { Submission } from "@/types/common";

type Tab = "gallery" | "hallOfFame";

const PODIUM_COLORS: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
const PODIUM_HEIGHTS: Record<number, number> = { 1: 120, 2: 90, 3: 70 };
const BADGES: Record<number, string> = { 1: "\u{1F947}", 2: "\u{1F948}", 3: "\u{1F949}" };

export default function GalleryPage() {
  const [entries, setEntries] = useState<Submission[]>([]);
  const [tab, setTab] = useState<Tab>("gallery");
  const [filter, setFilter] = useState<"latest" | "votes">("votes");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchEntries = useCallback(async () => {
    const voterId = getVoterId();
    const res = await fetch(`/api/submissions?sort=${filter}&voter_id=${voterId}`);
    const data = await res.json();
    setEntries(data.submissions ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleVote = async (id: string) => {
    const voterId = getVoterId();
    const res = await fetch(`/api/submissions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    });
    const data = await res.json();
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, vote_count: data.voteCount, voted_by_me: data.voted } : e));
  };

  const handleShare = (entry: Submission) => {
    const text = `[딩코] ${entry.nickname}님의 킹받는 결과를 확인해보세요!`;
    if (navigator.share) {
      navigator.share({ title: "딩코 - 킹받는 AI IDE", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    }
  };

  const sorted = [...entries].sort((a, b) =>
    filter === "votes" ? b.vote_count - a.vote_count : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const ranked = [...entries].sort((a, b) => b.vote_count - a.vote_count);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const totalVotes = entries.reduce((s, e) => s + e.vote_count, 0);

  return (
    <div className="flex flex-col" style={{ backgroundColor: "#0e0e0f", color: "#fff", minHeight: "100vh", overflowY: "auto", height: "100vh" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-10" style={{ backgroundColor: "#131314", borderBottom: "1px solid rgba(72,72,73,0.15)" }}>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 transition-colors"
          style={{ color: "#adaaab" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#adaaab")}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>홈</span>
        </button>

        {/* Tab Switch */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "#0e0e0f" }}>
          {([
            { key: "gallery" as Tab, label: "갤러리", icon: "grid_view" },
            { key: "hallOfFame" as Tab, label: "명예의 전당", icon: "emoji_events" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                color: tab === t.key ? "#fff" : "#767576",
                background: tab === t.key ? "linear-gradient(135deg, #bf81ff, #e879f9)" : "transparent",
                borderRadius: "6px",
              }}
            >
              <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ width: 70 }} /> {/* spacer for centering */}
      </header>

      {/* ═══ Gallery Tab ═══ */}
      {tab === "gallery" && (
        <>
          {/* Filter */}
          <div className="flex gap-1 px-8 py-4 sticky top-16 z-10" style={{ backgroundColor: "#0e0e0f", borderBottom: "1px solid rgba(72,72,73,0.1)" }}>
            {(["votes", "latest"] as const).map((f) => (
              <button
                key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all"
                style={{ fontFamily: "var(--font-space-grotesk)", color: filter === f ? "#fff" : "#767576", background: filter === f ? "linear-gradient(135deg, #bf81ff, #e879f9)" : "transparent", border: filter === f ? "none" : "1px solid rgba(72,72,73,0.2)", borderRadius: "6px" }}
              >
                {f === "votes" ? "인기순" : "최신순"}
              </button>
            ))}
            <span className="ml-auto text-xs self-center" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>{entries.length}개의 작품</span>
          </div>

          <main className="flex-1 p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>불러오는 중...</span>
              </div>
            ) : sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <span className="material-symbols-outlined text-4xl" style={{ color: "#262627" }}>collections</span>
                <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>아직 제출된 작품이 없습니다</span>
              </div>
            ) : (
              <div className="space-y-6 max-w-5xl mx-auto">
                {sorted.map((entry) => (
                  <div key={entry.id} className="rounded-xl overflow-hidden cursor-pointer" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }} onClick={() => router.push(`/gallery/${entry.id}`)}>
                    {/* 3-column: Example | Input | Result */}
                    <div className="grid grid-cols-3 gap-0" style={{ height: 220 }}>
                      {/* Example */}
                      <div className="flex items-center justify-center" style={{ backgroundColor: "#0a0a0b", borderRight: "1px solid rgba(72,72,73,0.1)" }}>
                        {entry.example_html ? (
                          <iframe srcDoc={entry.example_html} className="w-full h-full border-0 pointer-events-none" sandbox="" title="예제" />
                        ) : (
                          <div className="text-center">
                            <span className="material-symbols-outlined text-2xl" style={{ color: "#262627" }}>image</span>
                            <p className="text-[9px] mt-1" style={{ color: "#333" }}>예제</p>
                          </div>
                        )}
                      </div>
                      {/* User Prompts */}
                      <div className="p-3 overflow-auto" style={{ borderRight: "1px solid rgba(72,72,73,0.1)" }}>
                        <span className="text-[9px] tracking-widest uppercase block mb-2" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>사용자 입력</span>
                        {(entry.user_prompts || []).length > 0 ? (
                          entry.user_prompts.map((p, i) => (
                            <p key={i} className="text-[11px] leading-relaxed mb-1" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>
                              <span style={{ color: "#bf81ff" }}>#{i + 1}</span> {p}
                            </p>
                          ))
                        ) : entry.transcript ? (
                          <p className="text-[11px] leading-relaxed" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>{entry.transcript}</p>
                        ) : (
                          <p className="text-[11px]" style={{ color: "#333" }}>-</p>
                        )}
                      </div>
                      {/* AI Result */}
                      <div className="overflow-hidden" style={{ backgroundColor: "#0a0a0b" }}>
                        <iframe srcDoc={entry.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title={`${entry.nickname}의 작품`} style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "125%", height: "125%" }} />
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(72,72,73,0.1)" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(191,129,255,0.1)", border: "1px solid rgba(191,129,255,0.2)" }}>
                            <span className="material-symbols-outlined text-[12px]" style={{ color: "#bf81ff" }}>person</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>{entry.nickname}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Share */}
                        <button
                          onClick={() => handleShare(entry)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all hover:opacity-80"
                          style={{ color: "#767576", borderRadius: "6px" }}
                        >
                          <span className="material-symbols-outlined text-[14px]">share</span>
                        </button>

                        {/* Vote count */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs tabular-nums" style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}>{entry.vote_count}</span>
                        </div>

                        {/* 킹받아요 button */}
                        <button
                          onClick={() => handleVote(entry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all hover:opacity-90"
                          style={{
                            backgroundColor: entry.voted_by_me ? "rgba(255,107,157,0.1)" : "#ff6b9d",
                            color: entry.voted_by_me ? "#ff6b9d" : "#fff",
                            fontFamily: "var(--font-space-grotesk)",
                            borderRadius: "6px",
                            border: entry.voted_by_me ? "1px solid rgba(255,107,157,0.3)" : "none",
                          }}
                        >
                          {entry.voted_by_me ? (
                            <><span className="material-symbols-outlined text-[14px]">check</span>킹받음</>
                          ) : (
                            <><span className="material-symbols-outlined text-[14px]">local_fire_department</span>킹받아요</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {/* ═══ Hall of Fame Tab ═══ */}
      {tab === "hallOfFame" && (
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 pb-12">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>불러오는 중...</span>
            </div>
          ) : ranked.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <span className="material-symbols-outlined text-4xl" style={{ color: "#262627" }}>emoji_events</span>
              <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>아직 데이터가 없습니다</span>
            </div>
          ) : (
            <>
              {/* Podium */}
              {top3.length >= 3 && (
                <div className="mt-12 mb-10">
                  <p className="text-center text-[10px] tracking-widest uppercase mb-8" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>Top 3</p>
                  <div className="flex items-end justify-center gap-6">
                    {podiumOrder.map((entry, idx) => {
                      const rank = ranked.indexOf(entry) + 1;
                      const color = PODIUM_COLORS[rank];
                      const height = PODIUM_HEIGHTS[rank];
                      const isFirst = rank === 1;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => router.push(`/gallery/${entry.id}`)}>
                          <div className="text-center">
                            <div className="text-2xl mb-1">{BADGES[rank]}</div>
                            <p className="text-sm font-bold" style={{ color: isFirst ? color : "#fff", fontFamily: "var(--font-space-grotesk)", textShadow: isFirst ? `0 0 20px ${color}66` : "none" }}>{entry.nickname}</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <span className="material-symbols-outlined text-[12px]" style={{ color }}>local_fire_department</span>
                              <span className="text-xs tabular-nums font-bold" style={{ color, fontFamily: "var(--font-space-grotesk)" }}>{entry.vote_count}</span>
                            </div>
                          </div>
                          <div className="rounded-lg overflow-hidden" style={{ width: isFirst ? 160 : 130, height: isFirst ? 120 : 100, border: `1px solid ${color}44`, boxShadow: isFirst ? `0 0 30px ${color}22` : "none" }}>
                            <iframe srcDoc={entry.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title={`${entry.nickname}의 작품`} style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%", height: "200%" }} />
                          </div>
                          <div className="w-full flex items-center justify-center" style={{ height: height / 2, backgroundColor: `${color}18`, border: `1px solid ${color}44`, borderRadius: "8px 8px 0 0" }}>
                            <span className="text-xl font-black" style={{ color: `${color}88`, fontFamily: "var(--font-space-grotesk)" }}>{rank}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-px w-full mt-0" style={{ backgroundColor: "rgba(72,72,73,0.2)" }} />
                </div>
              )}

              {/* 4th+ list */}
              <div className="space-y-2">
                {rest.map((entry, i) => {
                  const rank = i + 4;
                  return (
                    <div key={entry.id} className="flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)", borderRadius: "10px" }}
                      onClick={() => router.push(`/gallery/${entry.id}`)}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,73,0.3)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(72,72,73,0.15)")}
                    >
                      <span className="w-6 text-center text-sm font-bold tabular-nums" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>{rank}</span>
                      <div className="w-12 h-12 rounded overflow-hidden shrink-0" style={{ border: "1px solid rgba(72,72,73,0.2)" }}>
                        <iframe srcDoc={entry.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="" title={`${entry.nickname}의 작품`} style={{ transform: "scale(0.25)", transformOrigin: "top left", width: "400%", height: "400%" }} />
                      </div>
                      <span className="flex-1 text-sm font-medium" style={{ color: "#adaaab", fontFamily: "var(--font-space-grotesk)" }}>{entry.nickname}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]" style={{ color: "#484849" }}>local_fire_department</span>
                        <span className="text-sm tabular-nums font-bold" style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}>{entry.vote_count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="mt-8 p-4 flex items-center justify-between" style={{ backgroundColor: "rgba(255,107,157,0.04)", border: "1px solid rgba(255,107,157,0.1)", borderRadius: "10px" }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: "#ff6b9d", fontFamily: "var(--font-space-grotesk)" }}>총 킹받아요</span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: "#ff6b9d", fontFamily: "var(--font-space-grotesk)", textShadow: "0 0 20px rgba(255,107,157,0.3)" }}>{totalVotes}</span>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}
