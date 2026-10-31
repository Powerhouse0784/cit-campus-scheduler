import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { apiError } from "@/lib/api-response";

/** Download endpoint retained for compatibility; /api/schedule returns the JSON payload. */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "exports", "schedule.json");
    if (!fs.existsSync(filePath)) return apiError("Schedule has not been generated yet.", 404);
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="schedule.json"',
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export the schedule.";
    return apiError(message, 500);
  }
}
