import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPGRAM_API_KEY not set" }, { status: 500 });
  }

  const audioBuffer = await req.arrayBuffer();

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&language=ko&smart_format=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": req.headers.get("content-type") ?? "audio/webm",
      },
      body: audioBuffer,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[Deepgram] transcribe error:", err);
    return NextResponse.json({ error: "Deepgram error", detail: err }, { status: res.status });
  }

  const data = await res.json();
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return NextResponse.json({ transcript });
}
