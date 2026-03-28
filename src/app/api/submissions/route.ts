import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { nickname, htmlCode, transcript, userPrompts, exampleImageId, attemptLimit, timeLimit } = body as {
    nickname: string;
    htmlCode: string;
    transcript?: string;
    userPrompts?: string[];
    exampleImageId?: string;
    attemptLimit?: number;
    timeLimit?: number;
  };

  if (!nickname?.trim() || !htmlCode?.trim()) {
    return NextResponse.json(
      { error: "nickname and htmlCode are required" },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabase()
    .from("submissions")
    .insert({
      nickname,
      html_code: htmlCode,
      transcript: transcript || null,
      user_prompts: userPrompts || [],
      example_image_id: exampleImageId || null,
      attempt_limit: attemptLimit ?? null,
      time_limit: timeLimit ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Submission insert error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "votes";
  const voterId = searchParams.get("voter_id");

  const orderCol = sort === "latest" ? "created_at" : "vote_count";

  const { data: submissions, error } = await getSupabase()
    .from("submissions")
    .select("*, example_images(image_url)")
    .order(orderCol, { ascending: false });

  if (error) {
    console.error("Submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  let votedIds: Set<string> = new Set();
  if (voterId) {
    const { data: votes } = await getSupabase()
      .from("votes")
      .select("submission_id")
      .eq("voter_id", voterId);
    if (votes) {
      votedIds = new Set(votes.map((v) => v.submission_id));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (submissions ?? []).map((s: any) => ({
    id: s.id,
    nickname: s.nickname,
    html_code: s.html_code,
    transcript: s.transcript,
    user_prompts: s.user_prompts || [],
    example_image_id: s.example_image_id,
    example_image_url: s.example_images?.image_url || null,
    vote_count: s.vote_count,
    created_at: s.created_at,
    voted_by_me: votedIds.has(s.id),
  }));

  return NextResponse.json({ submissions: result });
}
