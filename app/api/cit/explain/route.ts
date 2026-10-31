import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody<{ type: string; id: string }>(req);
  if (!parsed.success) return parsed.response;

  if (!parsed.data || typeof parsed.data !== "object" || !parsed.data.type || !parsed.data.id) {
    return apiError("A valid decision query object with type and id is required.", 400);
  }

  try {
    return NextResponse.json(citBackend.explainDecision(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to explain this decision.";
    return apiError(message, 500);
  }
}
