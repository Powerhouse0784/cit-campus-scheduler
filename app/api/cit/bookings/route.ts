export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { BookingEngine } from "@/lib/booking-engine";
import { apiError, readJsonBody } from "@/lib/api-response";
import { getAuthenticatedSession } from "@/lib/auth-session";
import { authorizeRoles } from "@/lib/api-auth";
import { readDurableJson, writeDurableJson, submitBookingAtomically, transitionBookingAtomically } from "@/lib/durable-state";

export async function GET(req: NextRequest) {
  const auth = authorizeRoles(req, ["admin", "department_coordinator", "faculty", "club"]);
  if (auth.ok === false) return auth.response;

  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const userBookingsPath = path.join(rootDir, "data", "user_bookings.json");

    const data = await readDurableJson<any>(dataPath, null);
    const schedule = await readDurableJson<any>(schedPath, null);
    if (!data || !schedule) {
      return apiError("Dataset or schedule is missing from persistent storage.", 404);
    }

    let userBookings: any[] = await readDurableJson<any[]>(userBookingsPath, []);

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

    const data = await readDurableJson<any>(dataPath, null);
    const schedule = await readDurableJson<any>(schedPath, null);
    if (!data || !schedule) {
      return apiError("Dataset or schedule is missing from persistent storage.", 404);
    }
    const engine = new BookingEngine(data);

    // Authenticated server-side session identity
    const session = getAuthenticatedSession(req);
    const userRole = session.role;
    const requester = session.name;

    // 1. ACTION: CHECK AVAILABILITY
    if (body.action === "check") {
      const result = engine.checkAvailability(
        {
          title: typeof body.title === "string" ? body.title.trim() : "Campus Booking",
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
      if (userRole === "student") return apiError("Please sign in with an authorized campus account to submit a booking.", 401);
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title || title.length > 160) return apiError("Booking title is required and must be 160 characters or fewer.", 400);
      const attendance = Number(body.attendance ?? 50);
      const duration = Number(body.duration_periods ?? 2);
      const startP = Number(body.start_period ?? 10);
      const day = typeof body.day === "string" ? body.day.trim().toUpperCase() : "THU";
      const roomId = typeof body.room_id === "string" && body.room_id.trim() ? body.room_id.trim() : "AUD";
      const allowedDays = new Set(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);
      if (!Number.isInteger(attendance) || attendance < 1 || attendance > 10000) return apiError("Attendance must be a whole number between 1 and 10000.", 400);
      if (!Number.isInteger(duration) || duration < 1 || duration > 13) return apiError("Duration must be a whole number between 1 and 13 periods.", 400);
      if (!Number.isInteger(startP) || startP < 1 || startP > 13 || startP + duration - 1 > 13) return apiError("Start period and duration must fit within periods 1–13.", 400);
      if (!allowedDays.has(day)) return apiError("Day must be a valid weekday abbreviation.", 400);
      const endP = startP + duration - 1;

      // Verify availability deterministically
      const checkResult = engine.checkAvailability(
        {
          title,
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
      let status: "pending" | "rejected";
      if (!checkResult.available) {
        status = "rejected";
      } else {
        // All user-created bookings enter the approval queue. A client-supplied
        // `auto_approve` flag must never bypass the approval workflow.
        status = "pending";
      }

      const newBookingId = `UB-${randomUUID()}`;

      const newBooking = {
        request_id: newBookingId,
        requester_id: session.id,
        title,
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

      // Use a database transaction to serialize room/time reservations and prevent lost updates.
      const submission = await submitBookingAtomically(newBooking, userBookingsPath, schedPath);
      if (!submission.success) {
        return NextResponse.json({ success: false, error: submission.error || "Booking could not be reserved.", conflict: submission.conflict }, { status: 409 });
      }

      const message = status === "pending"
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

    if (!["check", "submit", "approve", "cancel"].includes(body.action)) {
      return apiError("Unsupported booking action.", 400);
    }

    // 3. ACTION: APPROVE PENDING BOOKING (Admin / Coordinator only)
    if (body.action === "approve") {
      const requestId = body.request_id;
      if (!requestId) return apiError("Booking request_id is required.", 400);

      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can approve bookings.", 403);
      }

      let userBookings: any[] = [];
      {
        try {
          userBookings = await readDurableJson<any[]>(userBookingsPath, []);
        } catch {
          userBookings = [];
        }
      }

      const target = userBookings.find((b) => b.request_id === requestId);
      if (!target) return apiError(`Booking ${requestId} not found in pending records.`, 404);
      if ((target.requester_id && target.requester_id === session.id) ||
          String(target.requester || "").trim().toLowerCase() === String(requester || "").trim().toLowerCase()) {
        return apiError("Governance violation: you cannot approve your own booking request.", 403);
      }
      if (target.status !== "pending") {
        return apiError(`Only pending bookings can be approved (current status: ${target.status}).`, 409);
      }

      // Re-check availability at approval time; submission-time availability can go stale.
      const currentSchedule = JSON.parse(JSON.stringify(schedule));
      if (currentSchedule.fest_week?.bookings) {
        currentSchedule.fest_week.bookings = currentSchedule.fest_week.bookings.filter((b: any) => b.request_id !== requestId);
      }
      const approvalCheck = engine.checkAvailability({
        title: target.title,
        role: target.role,
        requested_category: target.category || "club_event",
        attendance: target.attendance,
        day: target.day,
        start_period: target.start_period,
        duration_periods: target.end_period - target.start_period + 1,
        room_id: target.room_id,
      }, currentSchedule);
      if (!approvalCheck.available) {
        return NextResponse.json({
          success: false,
          error: "Booking cannot be approved because availability changed since submission.",
          validation: approvalCheck,
          alternatives: approvalCheck.alternatives,
        }, { status: 409 });
      }

      const approvalReason = `Approved by ${requester} (${userRole}).`;
      const transition = await transitionBookingAtomically(requestId, "pending", "approved", approvalReason, userBookingsPath, schedPath);
      if (!transition.success) {
        return NextResponse.json({ success: false, error: transition.error || "Booking could not be approved.", conflict: transition.conflict }, { status: transition.status_code || 409 });
      }

      return NextResponse.json({
        success: true,
        message: `Booking ${requestId} has been approved.`,
        booking: transition.booking,
      });
    }

    // 4. ACTION: CANCEL BOOKING (Task 89 - with strict ownership verification)
    if (body.action === "cancel") {
      const requestId = body.request_id;
      if (!requestId) return apiError("Booking request_id is required.", 400);

      let userBookings: any[] = [];
      {
        try {
          userBookings = await readDurableJson<any[]>(userBookingsPath, []);
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

      // Strict server-side permission check:
      // Admin and Coordinator can cancel any booking. Everyone else must match
      // the authenticated session name exactly; matching only a role is not ownership.
      const isAdminOrCoord = userRole === "admin" || userRole === "department_coordinator";
      if (!isAdminOrCoord) {
        if (!requester) {
          return apiError("Unauthorized: Requester identity is required to verify ownership before cancellation.", 401);
        }
        const isOwner = inUserBookings?.requester_id
          ? inUserBookings.requester_id === session.id
          : requester.trim().toLowerCase() === String(bookingOwner || "").trim().toLowerCase();
        if (!isOwner) {
          return apiError(`Forbidden: You do not have permission to cancel another user's booking (owned by ${bookingOwner}).`, 403);
        }
      }

      const cancellationReason = `Booking cancelled by ${requester || userRole}.`;
      if (inUserBookings) {
        if (inUserBookings.status === "cancelled") return apiError("Booking is already cancelled.", 409);
        const transition = await transitionBookingAtomically(requestId, inUserBookings.status, "cancelled", cancellationReason, userBookingsPath, schedPath);
        if (!transition.success) return NextResponse.json({ success: false, error: transition.error || "Booking could not be cancelled." }, { status: transition.status_code || 409 });
      } else if (inSchedBookings) {
        // Legacy/scheduler-only bookings are not in the user booking queue.
        inSchedBookings.status = "cancelled";
        inSchedBookings.reason = cancellationReason;
        await writeDurableJson(schedPath, schedule);
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
