import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError, readJsonBody } from "@/lib/api-response";

/** Shared handler used by the canonical endpoint and its backwards-compatible alias. */
export async function handleDisruptionPost(req: NextRequest): Promise<NextResponse> {
  const parsed = await readJsonBody<Record<string, unknown>>(req);
  if (parsed.success === false) return parsed.response;

  const payload = parsed.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return apiError("A disruption request object is required.", 400);
  }
  if (!Array.isArray(payload.changes) || payload.changes.length === 0) {
    return apiError("At least one disruption change is required.", 400);
  }
  if (payload.changes.length > 50) {
    return apiError("A maximum of 50 changes can be submitted at once.", 413);
  }

  try {
    return NextResponse.json(citBackend.applyCustomDisruption(payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply disruption.";
    return apiError(message, 400);
  }
}
