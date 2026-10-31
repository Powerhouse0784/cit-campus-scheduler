import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { citBackend } from "@/lib/cit-backend";
import { apiError } from "@/lib/api-response";

export async function POST() {
  try {
    const rootDir = process.cwd();
    const spectraOverridesPath = path.join(rootDir, "data", "spectra_overrides.json");
    if (fs.existsSync(spectraOverridesPath)) {
      try {
        fs.unlinkSync(spectraOverridesPath);
      } catch {}
    }

    const spectraHistoryPath = path.join(rootDir, "data", "spectra_history.json");
    if (fs.existsSync(spectraHistoryPath)) {
      try {
        fs.unlinkSync(spectraHistoryPath);
      } catch {}
    }

    const userBookingsPath = path.join(rootDir, "data", "user_bookings.json");
    if (fs.existsSync(userBookingsPath)) {
      try {
        fs.unlinkSync(userBookingsPath);
      } catch {}
    }

    const result = citBackend.resetToBaseline();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset demo data.";
    return apiError(message, 500);
  }
}
