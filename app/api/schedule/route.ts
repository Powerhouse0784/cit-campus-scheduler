import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "exports", "schedule.json");
    if (!fs.existsSync(filePath)) return apiError("Schedule has not been generated yet.", 404);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read the generated schedule.";
    return apiError(message, 500);
  }
}
