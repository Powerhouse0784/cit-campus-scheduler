import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function POST() {
  const result = citBackend.resetToBaseline();
  return NextResponse.json(result);
}