"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getVoterId } from "@/utils/voter";
import type { Submission } from "@/types/common";

export default function SubmissionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEntry = useCallback(async () => {
    const voterId = getVoterId();
    const res = await fetch(`/api/submissions/${id}?voter_id=${voterId}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setEntry(data.submission ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  const handleVote = async () => {
    if (!entry) return;
    const voterId = getVoterId();
    const res = await fetch(`/api/submissions/${entry.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    });
    const data = await res.json();
    setEntry((prev) => prev ? { ...prev, vote_count: data.voteCount, voted_by_me: data.voted } : prev);
  };

  const handleShare = () => {
    if (!entry) return;
    const text = `[딩코] ${entry.nickname}님의 킹받는 결과를 확인해보세요!`;
    if (navigator.share) {
      navigator.share({ title: "딩코 - 킹받는 AI IDE", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0e0e0f" }}>
        <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>불러오는 중...</span>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: "#0e0e0f" }}>
        <span className="material-symbols-outlined text-4xl" style={{ color: "#262627" }}>error</span>
        <span className="text-sm" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>작품을 찾을 수 없습니다</span>
        <button onClick={() => router.push("/gallery")} className="mt-4 px-4 py-2 text-xs font-bold tracking-widest uppercase" style={{ color: "#8ff5ff", fontFamily: "var(--font-space-grotesk)", border: "1px solid rgba(143,245,255,0.2)", borderRadius: "8px" }}>
          갤러리로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#0e0e0f", color: "#fff" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-16 shrink-0 sticky top-0 z-10" style={{ backgroundColor: "#131314", borderBottom: "1px solid rgba(72,72,73,0.15)" }}>
        <button
          onClick={() => router.push("/gallery")}
          className="flex items-center gap-2 transition-colors"
          style={{ color: "#adaaab" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#adaaab")}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>갤러리</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(143,245,255,0.1)", border: "1px solid rgba(143,245,255,0.15)" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#8ff5ff" }}>person</span>
            </div>
            <span className="text-sm font-bold" style={{ color: "#fff", fontFamily: "var(--font-space-grotesk)" }}>{entry.nickname}</span>
          </div>
        </div>

        <div style={{ width: 70 }} />
      </header>

      {/* Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#131314", border: "1px solid rgba(72,72,73,0.15)" }}>
          {/* 3-column: Example | Input | Result */}
          <div className="grid grid-cols-3 gap-0" style={{ height: 420 }}>
            {/* Example */}
            <div className="flex items-center justify-center" style={{ backgroundColor: "#0a0a0b", borderRight: "1px solid rgba(72,72,73,0.1)" }}>
              {entry.example_html ? (
                <iframe srcDoc={entry.example_html} className="w-full h-full border-0 pointer-events-none" sandbox="" title="예제" />
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-3xl" style={{ color: "#262627" }}>image</span>
                  <p className="text-[10px] mt-1" style={{ color: "#333" }}>예제 없음</p>
                </div>
              )}
            </div>

            {/* User Prompts */}
            <div className="p-5 overflow-auto" style={{ borderRight: "1px solid rgba(72,72,73,0.1)" }}>
              <span className="text-[10px] tracking-widest uppercase block mb-3" style={{ color: "#484849", fontFamily: "var(--font-space-grotesk)" }}>사용자 입력</span>
              {(entry.user_prompts || []).length > 0 ? (
                entry.user_prompts.map((p, i) => (
                  <p key={i} className="text-[12px] leading-relaxed mb-2" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>
                    <span style={{ color: "#8ff5ff" }}>#{i + 1}</span> {p}
                  </p>
                ))
              ) : entry.transcript ? (
                <p className="text-[12px] leading-relaxed" style={{ color: "#adaaab", fontFamily: "var(--font-inter)" }}>{entry.transcript}</p>
              ) : (
                <p className="text-[12px]" style={{ color: "#333" }}>-</p>
              )}
            </div>

            {/* AI Result */}
            <div className="overflow-hidden" style={{ backgroundColor: "#0a0a0b" }}>
              <iframe srcDoc={entry.html_code} className="w-full h-full border-0 pointer-events-none" sandbox="allow-scripts" title={`${entry.nickname}의 작품`} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(72,72,73,0.1)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#484849", fontFamily: "var(--font-inter)" }}>
                {new Date(entry.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all hover:opacity-80"
                style={{ color: "#767576", borderRadius: "6px", border: "1px solid rgba(72,72,73,0.2)" }}
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                공유
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-sm tabular-nums font-bold" style={{ color: "#767576", fontFamily: "var(--font-space-grotesk)" }}>{entry.vote_count}</span>
              </div>

              <button
                onClick={handleVote}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all hover:opacity-90"
                style={{
                  backgroundColor: entry.voted_by_me ? "rgba(255,107,157,0.1)" : "#ff6b9d",
                  color: entry.voted_by_me ? "#ff6b9d" : "#fff",
                  fontFamily: "var(--font-space-grotesk)",
                  borderRadius: "8px",
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
      </main>
    </div>
  );
}
