export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { readDurableJson, writeDurableJson } from "@/lib/durable-state";
import { authorizeRoles } from "@/lib/api-auth";
import { generateSchedulePure } from "@/lib/schedule-generator-pure";
import { apiError, readJsonBody } from "@/lib/api-response";
import path from "path";

export async function GET() {
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const data = await readDurableJson(dataPath, null);

    if (!data) {
      return apiError("Dataset not loaded.", 404);
    }

    return NextResponse.json({
      success: true,
      dataset_id: data.dataset_id || "cit-public-v1",
      counts: {
        rooms: data.rooms?.length || 0,
        courses: data.courses?.length || 0,
        faculty: data.faculty?.length || 0,
        sessions: data.sessions?.length || 0,
        booking_requests: data.booking_requests?.length || 0,
        exams: data.exams?.length || 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read dataset metadata.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = authorizeRoles(req, ["admin", "department_coordinator"]);
    if (auth.ok === false) return auth.response;

    const parsed = await readJsonBody<{ dataset?: any }>(req);
    if (!parsed.success) return parsed.response;

    const dataset = parsed.data?.dataset || parsed.data;

    if (!dataset || !Array.isArray(dataset.rooms) || !Array.isArray(dataset.sessions)) {
      return apiError("Invalid dataset structure. Must include 'rooms' and 'sessions' arrays.", 400);
    }

    const rootDir = process.cwd();
    // Generate first, then commit both records so an invalid candidate is not persisted.
    const schedule = generateSchedulePure(dataset);
    await writeDurableJson(path.join(rootDir, "data", "cit_public.json"), dataset);
    await writeDurableJson(path.join(rootDir, "exports", "schedule.json"), schedule);
    await writeDurableJson(path.join(rootDir, "exports", "schedule_baseline.json"), schedule);

    return NextResponse.json({
      success: true,
      message: `Dataset '${dataset.dataset_id || "custom"}' loaded and a candidate timetable was generated with ${schedule.sessions?.length || 0} sessions. Run the official validator before treating it as certified.`,
      dataset_id: dataset.dataset_id,
      sessions_count: schedule.sessions?.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load custom dataset.";
    return apiError(message, 500);
  }
}
