import { NextRequest, NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group") || undefined;
  const faculty = searchParams.get("faculty") || undefined;
  const room = searchParams.get("room") || undefined;

  const grid = citBackend.getTimetableGrid({ group, faculty, room });
  const metadata = citBackend.getMetadata();

  return NextResponse.json({ grid, metadata });
}