import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = citBackend.applyCustomDisruption(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}