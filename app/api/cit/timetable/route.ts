import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group")?.trim() || undefined;
    const faculty = searchParams.get("faculty")?.trim() || undefined;
    const room = searchParams.get("room")?.trim() || undefined;

    const grid = citBackend.getTimetableGrid({ group, faculty, room });
    const metadata = citBackend.getMetadata();
    const stats = citBackend.getUtilisation();
    return NextResponse.json({ grid, metadata, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load timetable.";
    return apiError(message, 500);
  }
}
