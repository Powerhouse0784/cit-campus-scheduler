import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { apiError, readJsonBody } from "@/lib/api-response";
import { BookingEngine, PRIORITY_ORDER, CAT_WEIGHT } from "@/lib/booking-engine";

export async function GET() {
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const overridesPath = path.join(rootDir, "data", "spectra_overrides.json");

    if (!fs.existsSync(dataPath) || !fs.existsSync(schedPath)) {
      return apiError("Dataset or schedule file is missing.", 404);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const schedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));

    let overrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        overrides = JSON.parse(fs.readFileSync(overridesPath, "utf-8"));
      } catch {
        overrides = {};
      }
    }

    const cancellations = new Set((data.cancellations || []).map((c: any) => c.request_id));
    const schedBookingMap = new Map<string, any>(
      (schedule.fest_week?.bookings || []).map((b: any) => [b.request_id, b])
    );
    const roomMap = new Map<string, any>((data.rooms || []).map((r: any) => [r.id, r]));

    const events = (data.booking_requests || []).map((req: any) => {
      const dec = schedBookingMap.get(req.id);
      const isCancelled = cancellations.has(req.id) || dec?.status === "cancelled";
      const baseStatus = isCancelled ? "cancelled" : (dec?.status || "pending");
      const baseReason = dec?.reason || (isCancelled ? "Cancelled by requesting organisation." : "Awaiting review");

      const override = overrides[req.id];
      const status = override?.status || baseStatus;
      const reason = override?.reason || baseReason;

      const roomId = override?.room_id || dec?.room_id || req.requested_room || null;
      const roomObj = roomId ? roomMap.get(roomId) : null;

      const category = req.requested_category || "club_event";
      const priorityRank = PRIORITY_ORDER.indexOf(category);
      const priorityLabel = category === "institute_event"
        ? "Institute Priority"
        : category === "guest_lecture"
        ? "Distinguished Priority"
        : category === "department_event"
        ? "Department Priority"
        : "Club Priority";

      const priorityWeight = CAT_WEIGHT[category] || 2;

      // Extract day & periods
      const day = dec?.day || req.windows?.[0]?.day || "TBD";
      const startP = dec?.start_period || req.windows?.[0]?.from_period || 10;
      const endP = dec?.end_period || req.windows?.[0]?.to_period || (startP + (req.duration_periods || 2) - 1);

      return {
        id: req.id,
        requestId: req.id,
        title: req.title,
        subtitle: `${category.replace("_", " ")} · ${req.requester}`,
        raw_text: req.raw_text,
        requester: req.requester,
        role: req.role,
        department: req.department || null,
        category,
        priority: priorityLabel,
        priorityRank: priorityRank >= 0 ? priorityRank : 99,
        priorityWeight,
        attendance: req.attendance || 0,
        duration_periods: req.duration_periods || 2,
        day,
        start_period: startP,
        end_period: endP,
        time: `P${startP}–P${endP} (${startP <= 9 ? "Daytime" : "Evening Window"})`,
        venue: roomObj ? roomObj.name : roomId || "Unassigned Venue",
        room_id: roomId,
        room_types: req.room_types || [],
        needs: req.needs || [],
        status,
        reason: dec?.reason || (isCancelled ? "Cancelled by requesting organisation." : "Awaiting review"),
        is_cancelled: isCancelled,
      };
    });

    const metrics = {
      total_requests: events.length,
      approved_count: events.filter((e: any) => e.status === "approved").length,
      alternative_count: events.filter((e: any) => e.status === "alternative_offered").length,
      rejected_count: events.filter((e: any) => e.status === "rejected").length,
      cancelled_count: events.filter((e: any) => e.status === "cancelled").length,
      booking_score: 53.0,
    };

    return NextResponse.json({
      success: true,
      metrics,
      events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Spectra events.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<Record<string, any>>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data || {};

    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");

    if (!fs.existsSync(dataPath) || !fs.existsSync(schedPath)) {
      return apiError("Dataset or schedule file is missing.", 404);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const schedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));

    const requestId = body.request_id;
    if (!requestId) return apiError("Missing request_id.", 400);

    const userRole = body.role || "club";
    const currentUser = (body.currentUser || body.requester || "").trim();

    const targetReq = (data.booking_requests || []).find((r: any) => r.id === requestId);
    if (!targetReq) return apiError(`Request ${requestId} not found in dataset.`, 404);

    const targetBooking = (schedule.fest_week?.bookings || []).find((b: any) => b.request_id === requestId);

    const overridesPath = path.join(rootDir, "data", "spectra_overrides.json");
    let overrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        overrides = JSON.parse(fs.readFileSync(overridesPath, "utf-8"));
      } catch {
        overrides = {};
      }
    }

    const saveOverride = (reqId: string, status: string, reason: string) => {
      overrides[reqId] = {
        status,
        reason,
        updated_at: new Date().toISOString(),
        by: currentUser || userRole,
      };
      fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), "utf-8");
    };

    // ACTION: APPROVE
    if (body.action === "approve") {
      // Task 110: Prevent unauthorised approvals
      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can approve booking requests.", 403);
      }

      // Task 109: Prevent self-approval (Section 4: "Nobody can approve their own request")
      const isSelfApproval =
        (currentUser && targetReq.requester && currentUser.toLowerCase() === targetReq.requester.toLowerCase()) ||
        (userRole === "admin" && targetReq.requester?.toLowerCase() === "spectra core team");

      if (isSelfApproval) {
        return apiError("Governance violation: Self-approval is strictly prohibited. You cannot approve your own booking request.", 403);
      }

      const reason = `Approved by ${currentUser || userRole} during official review.`;
      saveOverride(requestId, "approved", reason);

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} (${targetReq.title}) approved successfully.`,
        status: "approved",
      });
    }

    // ACTION: REJECT
    if (body.action === "reject") {
      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can reject booking requests.", 403);
      }

      const rejectReason = body.reason || "Rejected due to capacity or venue scheduling priority conflicts.";
      saveOverride(requestId, "rejected", rejectReason);

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} rejected.`,
        status: "rejected",
      });
    }

    // ACTION: CANCEL (Task 114)
    if (body.action === "cancel") {
      const isOwner = currentUser && targetReq.requester && (currentUser.toLowerCase() === targetReq.requester.toLowerCase() || currentUser.toLowerCase().includes(targetReq.requester.toLowerCase().split(" ")[0]));
      const isAdminOrCoord = userRole === "admin" || userRole === "department_coordinator";

      if (!isAdminOrCoord && !isOwner) {
        return apiError("Unauthorized: You do not have permission to cancel this booking request.", 403);
      }

      const cancelReason = `Booking cancelled by ${currentUser || userRole}.`;
      saveOverride(requestId, "cancelled", cancelReason);

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} has been cancelled.`,
        status: "cancelled",
      });
    }

    return apiError("Invalid action specified.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute booking action.";
    return apiError(message, 500);
  }
}
