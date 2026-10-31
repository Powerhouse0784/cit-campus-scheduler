import { NextResponse } from "next/server";
import { citBackend } from "@/lib/cit-backend";
import { apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const dashboardStats = citBackend.getDashboardStats();
    const analytics = citBackend.getAnalyticsData();
    return NextResponse.json({
      success: true,
      ...dashboardStats,
      analytics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard statistics and analytics.";
    return apiError(message, 500);
  }
}
