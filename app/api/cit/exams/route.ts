import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    return NextResponse.json({ exams: citBackend.getExams() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load exams.";
    return apiError(message, 500);
  }
}
