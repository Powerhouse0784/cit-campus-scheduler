import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { BookingEngine } from "@/lib/booking-engine";
import { apiError, readJsonBody } from "@/lib/api-response";
import { getAuthenticatedSession } from "@/lib/auth-session";

export async function GET() {
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const userBookingsPath = path.join(rootDir, "data", "user_bookings.json");

    if (!fs.existsSync(dataPath) || !fs.existsSync(schedPath)) {
      return apiError("Dataset or schedule file is missing.", 404);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const schedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));

    let userBookings: any[] = [];
    if (fs.existsSync(userBookingsPath)) {
      try {
        userBookings = JSON.parse(fs.readFileSync(userBookingsPath, "utf-8"));
      } catch {
        userBookings = [];
      }
    }

    const requestMap = new Map<string, any>((data.booking_requests || []).map((r: any) => [r.id, r]));
    const roomMap = new Map<string, any>((data.rooms || []).map((r: any) => [r.id, r]));

    // Combine fest week bookings + user bookings
    const combinedBookings = [
      ...userBookings,
      ...(schedule.fest_week?.bookings || []).map((b: any) => {
        const req = requestMap.get(b.request_id) as any;
        const rObj = b.room_id ? (roomMap.get(b.room_id) as any) : null;
        return {
          request_id: b.request_id,
          title: req?.title || b.request_id,
          requester: req?.requester || "Campus Club",
          role: req?.role || "club",
          category: req?.requested_category || "club_event",
          attendance: req?.attendance || 0,
          day: b.day || req?.windows?.[0]?.day || "TBD",
          start_period: b.start_period || req?.windows?.[0]?.from_period || 10,
          end_period: b.end_period || req?.windows?.[0]?.to_period || 12,
          room_id: b.room_id || null,
          room_name: rObj ? rObj.name : b.room_id || "None",
          status: b.status,
          reason: b.reason || "Processed",
          submitted_at: req?.submitted_at || new Date().toISOString(),
          is_user_created: false,
        };
      }),
    ];

    const totalRooms = data.rooms?.length || 27;
    const upcomingCount = combinedBookings.filter((b) => b.status === "approved").length;
    const pendingCount = combinedBookings.filter((b) => b.status === "alternative_offered").length;

    return NextResponse.json({
      success: true,
      metrics: {
        total_venues: totalRooms,
        upcoming_bookings: upcomingCount,
        pending_approvals: pendingCount,
        curfew: "P13 (22:00)",
      },
      venues: (data.rooms || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        features: r.features || [],
        accessible: !!r.accessible,
        allowed_uses: r.allowed_uses || [],
      })),
      bookings: combinedBookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load venue bookings.";
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonBody<any>(req);
    if (!parsed.success) return parsed.response;
    const body = parsed.data;

    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const userBookingsPath = path.join(rootDir, "data", "user_bookings.json");

    if (!fs.existsSync(dataPath) || !fs.existsSync(schedPath)) {
      return apiError("Dataset or schedule file is missing.", 404);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const schedule = JSON.parse(fs.readFileSync(schedPath, "utf-8"));
    const engine = new BookingEngine(data);

    // Authenticated server-side session identity
    const session = getAuthenticatedSession(req);
    const userRole = session.role;
    const requester = session.name;

    // 1. ACTION: CHECK AVAILABILITY
    if (body.action === "check") {
      const result = engine.checkAvailability(
        {
          title: body.title,
          role: userRole,
          requested_category: body.category || "club_event",
          attendance: parseInt(body.attendance, 10) || 50,
          day: body.day || "THU",
          start_period: parseInt(body.start_period, 10) || 10,
          duration_periods: parseInt(body.duration_periods, 10) || 2,
          room_id: body.room_id || undefined,
          room_types: body.room_types || undefined,
          needs: body.needs || [],
          mandatory_for_groups: body.mandatory_for_groups || [],
        },
        schedule
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // 2. ACTION: SUBMIT BOOKING (Tasks 87, 88)
    if (body.action === "submit") {
      const attendance = parseInt(body.attendance, 10) || 50;
      const duration = parseInt(body.duration_periods, 10) || 2;
      const startP = parseInt(body.start_period, 10) || 10;
      const endP = startP + duration - 1;
      const day = body.day || "THU";
      const roomId = body.room_id || "AUD";

      // Verify availability deterministically
      const checkResult = engine.checkAvailability(
        {
          title: body.title,
          role: userRole,
          requested_category: body.category || "club_event",
          attendance,
          day,
          start_period: startP,
          duration_periods: duration,
          room_id: roomId,
          needs: body.needs || [],
          mandatory_for_groups: body.mandatory_for_groups || [],
        },
        schedule
      );

      // Workflow: Admin/Coordinator bookings are immediately approved if available.
      // Club/Faculty requests enter "pending" approval status if venue is available.
      let status: "approved" | "pending" | "rejected";
      if (!checkResult.available) {
        status = "rejected";
      } else if (userRole === "admin" || userRole === "department_coordinator" || body.auto_approve === true) {
        status = "approved";
      } else {
        status = "pending";
      }

      const newBookingId = `UB-${Date.now().toString().slice(-4)}`;

      const newBooking = {
        request_id: newBookingId,
        title: body.title || "Campus Booking",
        requester,
        role: userRole,
        category: body.category || "club_event",
        attendance,
        day,
        start_period: startP,
        end_period: endP,
        room_id: roomId,
        room_name: checkResult.room_name || roomId,
        status,
        reason: status === "pending"
          ? "Venue available; booking submitted and pending Coordinator/Admin approval."
          : checkResult.explanation,
        submitted_at: new Date().toISOString(),
        is_user_created: true,
      };

      // Persist in user_bookings.json
      let userBookings: any[] = [];
      if (fs.existsSync(userBookingsPath)) {
        try {
          userBookings = JSON.parse(fs.readFileSync(userBookingsPath, "utf-8"));
        } catch {
          userBookings = [];
        }
      }
      userBookings.unshift(newBooking);
      fs.writeFileSync(userBookingsPath, JSON.stringify(userBookings, null, 2), "utf-8");

      // If approved, also add to schedule.json fest_week.bookings
      if (status === "approved") {
        if (!schedule.fest_week) schedule.fest_week = { bookings: [], session_overrides: [] };
        schedule.fest_week.bookings.push({
          request_id: newBookingId,
          status: "approved",
          day,
          start_period: startP,
          end_period: endP,
          room_id: roomId,
          reason: checkResult.explanation,
        });
        fs.writeFileSync(schedPath, JSON.stringify(schedule, null, 2), "utf-8");
      }

      const message = status === "approved"
        ? "Booking confirmed and approved!"
        : status === "pending"
        ? "Booking submitted successfully. It is now pending Dean's Office / Coordinator review."
        : "Booking request rejected due to scheduling or venue constraints.";

      return NextResponse.json({
        success: status !== "rejected",
        status,
        message,
        booking: newBooking,
        validation: checkResult,
      });
    }

    // 3. ACTION: APPROVE PENDING BOOKING (Admin / Coordinator only)
    if (body.action === "approve") {
      const requestId = body.request_id;
      if (!requestId) return apiError("Booking request_id is required.", 400);

      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can approve bookings.", 403);
      }

      let userBookings: any[] = [];
      if (fs.existsSync(userBookingsPath)) {
        try {
          userBookings = JSON.parse(fs.readFileSync(userBookingsPath, "utf-8"));
        } catch {
          userBookings = [];
        }
      }

      const target = userBookings.find((b) => b.request_id === requestId);
      if (!target) return apiError(`Booking ${requestId} not found in pending records.`, 404);

      target.status = "approved";
      target.reason = `Approved by ${requester} (${userRole}).`;
      fs.writeFileSync(userBookingsPath, JSON.stringify(userBookings, null, 2), "utf-8");

      // Also register in schedule.json
      if (!schedule.fest_week) schedule.fest_week = { bookings: [], session_overrides: [] };
      const existing = schedule.fest_week.bookings.find((b: any) => b.request_id === requestId);
      if (existing) {
        existing.status = "approved";
        existing.reason = target.reason;
      } else {
        schedule.fest_week.bookings.push({
          request_id: target.request_id,
          status: "approved",
          day: target.day,
          start_period: target.start_period,
          end_period: target.end_period,
          room_id: target.room_id,
          reason: target.reason,
        });
      }
      fs.writeFileSync(schedPath, JSON.stringify(schedule, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: `Booking ${requestId} has been approved.`,
        booking: target,
      });
    }

    // 4. ACTION: CANCEL BOOKING (Task 89 - with strict ownership verification)
    if (body.action === "cancel") {
      const requestId = body.request_id;
      if (!requestId) return apiError("Booking request_id is required.", 400);

      let userBookings: any[] = [];
      if (fs.existsSync(userBookingsPath)) {
        try {
          userBookings = JSON.parse(fs.readFileSync(userBookingsPath, "utf-8"));
        } catch {
          userBookings = [];
        }
      }

      const inUserBookings = userBookings.find((b) => b.request_id === requestId);
      const inSchedBookings = schedule.fest_week?.bookings?.find((b: any) => b.request_id === requestId);
      const inDatasetBookings = (data.booking_requests || []).find((b: any) => b.id === requestId);

      if (!inUserBookings && !inSchedBookings && !inDatasetBookings) {
        return apiError(`Booking ${requestId} was not found.`, 404);
      }

      const bookingOwner = inUserBookings?.requester || inDatasetBookings?.requester || "Campus Club Member";
      const bookingRole = inUserBookings?.role || inDatasetBookings?.role || "club";

      // Strict server-side permission check:
      // Admin and Coordinator can cancel any booking.
      // Other roles MUST provide requester and it MUST match the booking owner.
      const isAdminOrCoord = userRole === "admin" || userRole === "department_coordinator";
      if (!isAdminOrCoord) {
        if (!requester) {
          return apiError("Unauthorized: Requester identity is required to verify ownership before cancellation.", 401);
        }
        const isOwner = (requester.toLowerCase() === bookingOwner.toLowerCase()) || (userRole === bookingRole);
        if (!isOwner) {
          return apiError(`Forbidden: You do not have permission to cancel another user's booking (owned by ${bookingOwner}).`, 403);
        }
      }

      // Mark cancelled in user_bookings.json
      if (inUserBookings) {
        inUserBookings.status = "cancelled";
        inUserBookings.reason = `Booking cancelled by ${requester || userRole}.`;
        fs.writeFileSync(userBookingsPath, JSON.stringify(userBookings, null, 2), "utf-8");
      }

      // Mark CANCELLED (not "rejected"!) in schedule.json
      if (inSchedBookings) {
        inSchedBookings.status = "cancelled";
        inSchedBookings.reason = `Booking cancelled by ${requester || userRole}.`;
        fs.writeFileSync(schedPath, JSON.stringify(schedule, null, 2), "utf-8");
      }

      return NextResponse.json({
        success: true,
        message: `Booking ${requestId} has been successfully cancelled.`,
        status: "cancelled",
      });
    }

    return apiError("Invalid action specified.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking operation failed.";
    return apiError(message, 500);
  }
}
