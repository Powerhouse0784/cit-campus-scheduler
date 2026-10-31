import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError } from "@/lib/api-response";

export async function POST() {
  try {
    const result = citBackend.resetToBaseline();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset demo data.";
    return apiError(message, 500);
  }
}
