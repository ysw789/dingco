import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const voterId = searchParams.get("voter_id");

  const { data, error } = await getSupabase()
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let votedByMe = false;
  if (voterId) {
    const { data: vote } = await getSupabase()
      .from("votes")
      .select("id")
      .eq("submission_id", id)
      .eq("voter_id", voterId)
      .maybeSingle();
    votedByMe = !!vote;
  }

  return NextResponse.json({
    submission: {
      id: data.id,
      nickname: data.nickname,
      html_code: data.html_code,
      transcript: data.transcript,
      user_prompts: data.user_prompts || [],
      example_html: data.example_html || null,
      vote_count: data.vote_count,
      created_at: data.created_at,
      voted_by_me: votedByMe,
    },
  });
}
