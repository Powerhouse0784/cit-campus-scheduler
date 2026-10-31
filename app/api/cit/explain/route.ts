import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function POST(req: NextRequest) {
  const query = await req.json();
  const explanation = citBackend.explainDecision(query);
  return NextResponse.json(explanation);
}