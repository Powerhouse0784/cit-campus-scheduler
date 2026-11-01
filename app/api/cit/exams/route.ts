export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { ExamEngine } from "@/lib/exam-engine";
import { apiError } from "@/lib/api-response";
import { authorizeRoles, SCHEDULER_ROLES } from "@/lib/api-auth";
import { readDurableJson, writeDurableJson } from "@/lib/durable-state";

export async function GET(req: NextRequest) {
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");

    const data = await readDurableJson<any>(dataPath, null);
    if (!data) return apiError("Dataset not found", 404);
    const engine = new ExamEngine(data);

    const fullScheduledList = engine.generateSchedule();

    // Complete validation check on ALL 41 exams before filtering
    const fullAssignments = fullScheduledList.map((e) => ({
      exam_id: e.exam_id,
      day: e.day,
      session: e.session,
      rooms: e.rooms,
    }));
    const validation = engine.validateSchedule(fullAssignments);

    let scheduledList = [...fullScheduledList];

    // Query params for filtering display view
    const searchParams = req.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const semesterParam = searchParams.get("semester");
    const dayParam = searchParams.get("day");
    const groupParam = searchParams.get("group");

    if (yearParam) {
      const y = parseInt(yearParam, 10);
      scheduledList = scheduledList.filter((e) => e.year === y);
    } else if (semesterParam) {
      const sem = parseInt(semesterParam, 10);
      const y = Math.ceil(sem / 2);
      scheduledList = scheduledList.filter((e) => e.year === y);
    }

    if (dayParam && dayParam !== "all") {
      scheduledList = scheduledList.filter((e) => e.day === dayParam);
    }

    if (groupParam && groupParam !== "all") {
      scheduledList = scheduledList.filter((e) => e.groups.includes(groupParam));
    }

    return NextResponse.json({
      success: true,
      total_exams: scheduledList.length,
      all_exams_count: data.exams?.length || 41,
      calendar: data.calendar?.exam_week,
      validation,
      exams: scheduledList,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load exams.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeRoles(req, SCHEDULER_ROLES);
  if (auth.ok === false) return auth.response;
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");

    const data = await readDurableJson<any>(dataPath, null);
    if (!data) return apiError("Required dataset cit_public.json not found.", 404);

    const schedule = await readDurableJson<any>(schedPath, null);
    if (!schedule) return apiError("Baseline schedule exports/schedule.json not found.", 404);

    const engine = new ExamEngine(data);

    // 1. Dynamic generation from scratch
    const newExams = engine.generateSchedule();

    const candidateAssignments = newExams.map((e) => ({
      exam_id: e.exam_id,
      day: e.day,
      session: e.session,
      rooms: e.rooms,
    }));

    // 2. Strict validation-first: validate before committing to disk!
    const validation = engine.validateSchedule(candidateAssignments);

    if (!validation.valid || validation.violations.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Generated exam schedule has constraint violations. Schedule was NOT saved.",
          validation,
        },
        { status: 422 }
      );
    }

    // 3. Safe commit only after 100% successful validation
    schedule.exams = candidateAssignments;
    await writeDurableJson(schedPath, schedule);
    await writeDurableJson(path.join(rootDir, "exports", "schedule_baseline.json"), schedule);

    return NextResponse.json({
      success: true,
      message: "Exams dynamically regenerated and verified with 0 hard violations.",
      validation,
      exams: newExams,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to regenerate exam schedule.";
    return apiError(message, 500);
  }
}
