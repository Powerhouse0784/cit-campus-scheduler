import { NextResponse } from "next/server";
import { generateSchedulePure } from "@/lib/schedule-generator-pure";
import { apiError } from "@/lib/api-response";
import { authorizeRoles, SCHEDULER_ROLES } from "@/lib/api-auth";
import { NextRequest } from "next/server";
import path from "path";
import { writeDurableJson } from "@/lib/durable-state";

export async function POST(req: NextRequest) {
  const auth = authorizeRoles(req, SCHEDULER_ROLES);
  if (auth.ok === false) return auth.response;
  try {
    const schedule = generateSchedulePure();
    // Commit the validated in-process result to durable storage for serverless instances.
    await writeDurableJson(path.join(process.cwd(), "exports", "schedule.json"), schedule);
    await writeDurableJson(path.join(process.cwd(), "exports", "schedule_baseline.json"), schedule);

    return NextResponse.json({
      success: true,
      message: "Schedule generated in-process and saved. Validation is performed by the generator before commit.",
      dataset_id: schedule.dataset_id,
      sessions_count: schedule.sessions?.length || 0,
      exams_count: schedule.exams?.length || 0,
      bookings_count: schedule.fest_week?.bookings?.length || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Timetable generation failed.";
    return apiError(message, 500);
  }
}
