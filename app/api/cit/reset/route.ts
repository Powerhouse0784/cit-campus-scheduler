import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError } from "@/lib/api-response";
import { authorizeRoles, ADMIN_ROLES } from "@/lib/api-auth";
import { deleteDurableJson, readDurableJson, writeDurableJson } from "@/lib/durable-state";

export async function POST(req: NextRequest) {
  const auth = authorizeRoles(req, ADMIN_ROLES);
  if (auth.ok === false) return auth.response;
  try {
    const root = process.cwd();
    const baselinePath = path.join(root, "exports", "schedule_baseline.json");
    const schedulePath = path.join(root, "exports", "schedule.json");
    const baseline = await readDurableJson<any>(baselinePath, null);
    if (!baseline) return apiError("Baseline schedule is missing; reset was not applied.", 404);

    // Restore the active schedule first; clear transient records only after this succeeds.
    await writeDurableJson(schedulePath, baseline);
    await deleteDurableJson(path.join(root, "exports", "schedule_after.json"));
    await deleteDurableJson(path.join(root, "data", "spectra_overrides.json"));
    await deleteDurableJson(path.join(root, "data", "spectra_history.json"));
    await deleteDurableJson(path.join(root, "data", "user_bookings.json"));

    return NextResponse.json({
      success: true,
      message: "Restored the saved baseline schedule and cleared transient booking, Spectra history, and disruption state.",
      dataset_id: baseline.dataset_id,
      sessions_count: baseline.sessions?.length || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset demo data.";
    return apiError(message, 500);
  }
}
