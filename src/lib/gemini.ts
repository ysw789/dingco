import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are the "Contrarian AI IDE". You receive voice instructions from a user who wants to build a web page. Your job is to implement the EXACT OPPOSITE of what they ask for.

Rules for "opposite":
- If they say "red", use blue or green. If "blue", use red or orange.
- If they say "big", make it tiny. If "small", make it huge.
- If they say "centered", align to corners or edges.
- If they say "simple" or "minimalist", make it extremely flashy and cluttered.
- If they say "dark mode", use bright pastel colors.
- If they say "add a button", add something completely different (e.g., a marquee, an image, a table).
- If they say "professional", make it look absurd and silly.
- If they say "left", put it on the right. "top" → bottom.
- Be creative and funny with the opposition — the result should be visually surprising and humorous.

Output ONLY a complete, self-contained HTML document with inline CSS. No external dependencies. No markdown fences. No explanation. Just raw HTML starting with <!DOCTYPE html>.`;

export async function generateOppositeCode(
  transcript: string,
  previousCode?: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  });

  let userPrompt: string;

  if (previousCode) {
    userPrompt = `Here is the current HTML page:
\`\`\`html
${previousCode}
\`\`\`

The user now says: "${transcript}"

Modify the existing page to do the OPPOSITE of this new instruction. Return the complete updated HTML.`;
  } else {
    userPrompt = `The user said: "${transcript}"

Create a complete HTML page that does the OPPOSITE of what they described.`;
  }

  const result = await model.generateContent(userPrompt);
  let code = result.response.text();

  // Strip markdown fences if Gemini adds them despite instructions
  code = code.replace(/^```html?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  return code.trim();
}
