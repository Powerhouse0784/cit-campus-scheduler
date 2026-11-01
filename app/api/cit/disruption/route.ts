export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError, readJsonBody } from "@/lib/api-response";
import { authorizeRoles, SCHEDULER_ROLES } from "@/lib/api-auth";
import { readDurableJson, writeDurableJson } from "@/lib/durable-state";
import { ReschedulingSolver, DisruptionPayload } from "@/lib/rescheduling-solver";

export async function GET(req: NextRequest) {
  const auth = authorizeRoles(req, SCHEDULER_ROLES);
  if (auth.ok === false) return auth.response;

  try {
    const root = process.cwd();
    const [baseline, proposed] = await Promise.all([
      readDurableJson<any>(path.join(root, "exports", "schedule.json"), null),
      readDurableJson<any>(path.join(root, "exports", "schedule_after.json"), null),
    ]);
    if (!baseline) return apiError("Baseline schedule is missing from persistent storage.", 404);
    return NextResponse.json({
      success: true,
      baseline_schedule: baseline,
      proposed_schedule: proposed,
      has_proposal: Boolean(proposed),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load rescheduling comparison.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeRoles(req, SCHEDULER_ROLES);
  if (auth.ok === false) return auth.response;

  try {
    const parsed = await readJsonBody<Record<string, any>>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data || {};
    const root = process.cwd();
    const baselinePath = path.join(root, "exports", "schedule.json");
    const proposedPath = path.join(root, "exports", "schedule_after.json");

    if (body.action === "publish" || body.action === "approve") {
      if (auth.session.role !== "admin" && auth.session.role !== "department_coordinator") {
        return apiError("Only Admin or Department Coordinator accounts can publish schedule revisions.", 403);
      }
      const proposed = await readDurableJson<any>(proposedPath, null);
      if (!proposed) return apiError("No proposed schedule is available to publish.", 404);
      const validation = proposed.validation;
      const hasExplicitCleanValidation =
        validation &&
        validation.hard_violations === 0 &&
        validation.status === "Certified 0 Hard Violations";
      if (proposed.solver_success !== true || !hasExplicitCleanValidation) {
        return apiError(
          "The proposed schedule cannot be published without an explicit successful solver result and a clean validation report (zero hard violations).",
          409
        );
      }
      const publishedSchedule = { ...proposed };
      delete publishedSchedule.validation;
      delete publishedSchedule.solver_success;
      await writeDurableJson(baselinePath, publishedSchedule);
      return NextResponse.json({ success: true, message: "Proposed timetable published.", published_by: auth.session.name, workflow_state: "published" });
    }

    const payload = (body.disruption || body) as DisruptionPayload;
    if (!payload || !Array.isArray(payload.changes) || payload.changes.length === 0) {
      return apiError("A disruption request with at least one change is required.", 400);
    }
    if (payload.changes.length > 100) return apiError("A disruption request may contain at most 100 changes.", 413);

    const data = await readDurableJson<any>(path.join(root, "data", "cit_public.json"), null);
    const baseline = await readDurableJson<any>(baselinePath, null);
    if (!data || !baseline) return apiError("Dataset or baseline schedule is missing from persistent storage.", 404);

    const solver = new ReschedulingSolver(data);
    const result = solver.solve(baseline, payload);
    const proposedSchedule = {
      ...result.schedule_after,
      validation: result.validation,
      solver_success: result.success,
    };
    await writeDurableJson(proposedPath, proposedSchedule);

    return NextResponse.json({
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