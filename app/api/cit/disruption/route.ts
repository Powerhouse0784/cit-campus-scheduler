import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody<Record<string, unknown>>(req);
  if (!parsed.success) return parsed.response;

  if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
    return apiError("A disruption request object is required.", 400);
  }

  try {
    return NextResponse.json(citBackend.applyCustomDisruption(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply disruption.";
    return apiError(message, 400);
  }
}
