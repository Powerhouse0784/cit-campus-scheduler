import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody<Record<string, unknown>>(req);
  if (parsed.success === false) return parsed.response;

  const data = parsed.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return apiError("A valid decision query object is required.", 400);
  }

  const type = data.type;
  const id = data.id;
  if (typeof type !== "string" || !type.trim() || type.length > 64) {
    return apiError("Decision type is required and must be 64 characters or fewer.", 400);
  }
  if (typeof id !== "string" || !id.trim() || id.length > 128) {
    return apiError("Decision ID is required and must be 128 characters or fewer.", 400);
  }

  try {
    return NextResponse.json(citBackend.explainDecision({ type: type.trim(), id: id.trim() }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to explain this decision.";
    return apiError(message, 500);
  }
}
