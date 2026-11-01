export const dynamic = "force-dynamic";

/** Compatibility endpoint for older clients. Uses the same durable solver workflow. */
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError, readJsonBody } from "@/lib/api-response";
import { authorizeRoles, SCHEDULER_ROLES } from "@/lib/api-auth";
import { readDurableJson, writeDurableJson } from "@/lib/durable-state";
import { ReschedulingSolver, DisruptionPayload } from "@/lib/rescheduling-solver";

export async function POST(req: NextRequest) {
  const auth = authorizeRoles(req, SCHEDULER_ROLES);
  if (auth.ok === false) return auth.response;
  try {
    const parsed = await readJsonBody<Record<string, unknown>>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data as any;
    let disruption = body?.disruption || body;
    if (!disruption || !Array.isArray(disruption.changes) || disruption.changes.length === 0) {
      disruption = await readDurableJson<any>(path.join(process.cwd(), "data", "sample_disruption.json"), null);
      if (!disruption) return apiError("No disruption payload provided and no sample disruption is available.", 400);
    }
    if (disruption.changes.length > 100) return apiError("A disruption request may contain at most 100 changes.", 413);

    const root = process.cwd();
    const data = await readDurableJson<any>(path.join(root, "data", "cit_public.json"), null);
    const baseline = await readDurableJson<any>(path.join(root, "exports", "schedule.json"), null);
    if (!data || !baseline) return apiError("Dataset or baseline schedule is missing from persistent storage.", 404);

    const result = new ReschedulingSolver(data).solve(baseline, disruption as DisruptionPayload);
    const proposedSchedule = { ...result.schedule_after, validation: result.validation, solver_success: result.success };
    await writeDurableJson(path.join(root, "exports", "schedule_after.json"), proposedSchedule);
    return NextResponse.json({
      status: result.success ? "success" : "partial",
      success: result.success,
      sessions_moved: result.stability.sessions_moved,
      stability: result.stability,
      moved_details: result.moved_details,
      unresolvable: result.unresolvable,
      schedule_after: proposedSchedule,
      validation: result.validation,
      explanation: result.explanation,
    }, { status: result.success ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to apply disruption.";
    return apiError(message, 400);
  }
}
