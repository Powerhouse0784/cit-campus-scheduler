import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "exports", "schedule.json");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Schedule not generated yet", { status: 404 });
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="schedule.json"',
        "Content-Type": "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}