import { generateOppositeCodeStream } from "@/lib/gemini";
import type { GenerateRequest } from "@/types/common";

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequest;

  if (!body.transcript?.trim()) {
    return new Response(JSON.stringify({ error: "transcript is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stream = await generateOppositeCodeStream(
      body.transcript,
      body.previousCode,
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Gemini generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate code" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
