import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function GET() {
  const exams = citBackend.getExams();
  return NextResponse.json({ exams });
}