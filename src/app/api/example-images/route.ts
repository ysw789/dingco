import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const examplesDir = path.join(process.cwd(), "public", "examples");

  let files: string[] = [];
  try {
    files = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".html"));
  } catch {
    return NextResponse.json({ example: null });
  }

  if (files.length === 0) {
    return NextResponse.json({ example: null });
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];
  const htmlCode = fs.readFileSync(path.join(examplesDir, randomFile), "utf-8");

  return NextResponse.json({
    example: {
      id: randomFile.replace(".html", ""),
      filename: randomFile,
      html_code: htmlCode,
    },
  });
}
