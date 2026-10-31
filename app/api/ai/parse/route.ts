import { NextRequest, NextResponse } from "next/server";
import { parseHinglishOrEnglishRequest } from "@/lib/ai-parser";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // High performance fallback regex + contextual rule parser
    const structuredResult = parseHinglishOrEnglishRequest(prompt);
    return NextResponse.json(structuredResult);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}