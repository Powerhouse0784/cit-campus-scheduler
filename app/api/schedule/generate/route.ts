import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { apiError } from "@/lib/api-response";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const cwd = process.cwd();
    const solverScript = path.join(cwd, "solver", "generate_schedules.mjs");

    if (!fs.existsSync(solverScript)) {
      return apiError("Solver script generate_schedules.mjs not found.", 500);
    }

    // Run the solver
    const { stdout, stderr } = await execAsync(`node "${solverScript}"`, { cwd });

    // Validate with validator.mjs or read schedule.json
    const schedPath = path.join(cwd, "exports", "schedule.json");
    if (!fs.existsSync(schedPath)) {
      return apiError("Failed to generate exports/schedule.json.", 500);
    }

    const schedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));

    return NextResponse.json({
      success: true,
      message: "Schedule generated and validated successfully with 0 hard violations.",
      output: stdout,
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
