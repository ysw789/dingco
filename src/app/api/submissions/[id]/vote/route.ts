import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { voterId } = body as { voterId: string };

  if (!voterId) {
    return NextResponse.json(
      { error: "voterId is required" },
      { status: 400 },
    );
  }

  // Check if vote exists
  const { data: existing } = await getSupabase()
    .from("votes")
    .select("id")
    .eq("submission_id", id)
    .eq("voter_id", voterId)
    .single();

  if (existing) {
    // Remove vote
    await getSupabase().from("votes").delete().eq("id", existing.id);
  } else {
    // Add vote
    const { error } = await getSupabase()
      .from("votes")
      .insert({ submission_id: id, voter_id: voterId });

    if (error) {
      console.error("Vote insert error:", error);
      return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
    }
  }

  // Get updated count
  const { data: submission } = await getSupabase()
    .from("submissions")
    .select("vote_count")
    .eq("id", id)
    .single();

  return NextResponse.json({
    voted: !existing,
    voteCount: submission?.vote_count ?? 0,
  });
}
