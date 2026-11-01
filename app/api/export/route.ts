export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError } from "@/lib/api-response";
import { readDurableJson } from "@/lib/durable-state";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let fileName = "schedule.json";
    let filePath = path.join(process.cwd(), "exports", "schedule.json");
    let fallback: unknown = null;

    if (type === "disruption") {
      fileName = "schedule_after.json";
      filePath = path.join(process.cwd(), "exports", "schedule_after.json");
    } else if (type === "validation" || type === "report") {
      fileName = "validation_report.json";
      filePath = path.join(process.cwd(), "validation_report.json");
    }

    const data = await readDurableJson<unknown>(filePath, fallback);
    if (data === null || data === undefined) {
      return apiError(`Requested export (${fileName}) is not available in persistent storage.`, 404);
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export file.";
    return apiError(message, 500);
  }
}
