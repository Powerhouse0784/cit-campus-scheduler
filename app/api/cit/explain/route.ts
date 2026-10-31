import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError, readJsonBody } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return apiError("Query parameters 'type' and 'id' are required.", 400);
    }

    const explanation = citBackend.explainDecision({ type, id });
    return NextResponse.json({
      success: true,
      ...explanation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to explain this decision.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<{ type: string; id: string }>(req);
    if (!parsed.success) return parsed.response;

    if (!parsed.data || typeof parsed.data !== "object" || !parsed.data.type || !parsed.data.id) {
      return apiError("A valid decision query object with type and id is required.", 400);
    }

    const explanation = citBackend.explainDecision(parsed.data);
    return NextResponse.json({
      success: true,
      ...explanation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to explain this decision.";
    return apiError(message, 500);
  }
}
