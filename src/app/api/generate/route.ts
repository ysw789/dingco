import { NextResponse } from "next/server";
import { generateOppositeCode } from "@/lib/gemini";
import type { GenerateRequest, GenerateResponse } from "@/types/common";

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequest;

  if (!body.transcript?.trim()) {
    return NextResponse.json(
      { error: "transcript is required" },
      { status: 400 },
    );
  }

  try {
    const code = await generateOppositeCode(body.transcript, body.previousCode);
    return NextResponse.json({ code } satisfies GenerateResponse);
  } catch (error) {
    console.error("Gemini generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 },
    );
  }
}
