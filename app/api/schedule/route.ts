import { NextResponse } from "next/server";
import path from "path";
import { apiError } from "@/lib/api-response";
import { readDurableJson } from "@/lib/durable-state";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "exports", "schedule.json");
    const data = await readDurableJson<any>(filePath, null);
    if (!data) return apiError("Schedule has not been generated yet.", 404);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read the generated schedule.";
    return apiError(message, 500);
  }
}
