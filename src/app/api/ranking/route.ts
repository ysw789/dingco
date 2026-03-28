import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("submissions")
    .select("id, nickname, vote_count")
    .order("vote_count", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Ranking fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const rankings = (data ?? []).map((s, i) => ({
    rank: i + 1,
    id: s.id,
    nickname: s.nickname,
    vote_count: s.vote_count,
  }));

  return NextResponse.json({ rankings });
}
