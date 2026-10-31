import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { apiError, readJsonBody } from "@/lib/api-response";
import { BookingEngine, PRIORITY_ORDER, CAT_WEIGHT } from "@/lib/booking-engine";
import { getAuthenticatedSession } from "@/lib/auth-session";
import { readDurableJson, writeDurableJson } from "@/lib/durable-state";

export interface DecisionHistoryItem {
  id: string;
  request_id: string;
  event_title: string;
  action: "approve" | "reject" | "cancel" | "alternative_offered" | "approved" | "rejected" | "cancelled";
  previous_status: string;
  new_status: string;
  by_user: string;
  by_role: string;
  reason: string;
  timestamp: string;
  room_id?: string | null;
  day?: string;
  start_period?: number;
  end_period?: number;
}

export async function GET(req: NextRequest) {
  try {
    const rootDir = process.cwd();
    const dataPath = path.join(rootDir, "data", "cit_public.json");
    const schedPath = path.join(rootDir, "exports", "schedule.json");
    const overridesPath = path.join(rootDir, "data", "spectra_overrides.json");
    const historyPath = path.join(rootDir, "data", "spectra_history.json");

    const data = await readDurableJson<any>(dataPath, null);
    const schedule = await readDurableJson<any>(schedPath, null);
    if (!data || !schedule) {
      return apiError("Dataset or schedule is missing from persistent storage.", 404);
    }

    let overrides: Record<string, any> = {};
    {
      try {
        overrides = await readDurableJson<Record<string, any>>(overridesPath, {});
      } catch {
        overrides = {};
      }
    }

    let history: DecisionHistoryItem[] = [];
    {
      try {
        history = await readDurableJson<DecisionHistoryItem[]>(historyPath, []);
      } catch {
        history = [];
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
      // Bug 5 fix: correctly prioritize override reason
      const reason = override?.reason || dec?.reason || (isCancelled ? "Cancelled by requesting organisation." : "Awaiting review");

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
      const day = override?.day || dec?.day || req.windows?.[0]?.day || "TBD";
      const startP = override?.start_period || dec?.start_period || req.windows?.[0]?.from_period || 10;
      const endP = override?.end_period || dec?.end_period || req.windows?.[0]?.to_period || (startP + (req.duration_periods || 2) - 1);

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
        reason,
        is_cancelled: isCancelled,
      };
    });

    // Calculate live festival score based on official validator formula
    let bookingScore = 0.0;
    for (const ev of events) {
      if (ev.is_cancelled || cancellations.has(ev.requestId)) continue;
      if (ev.status === "approved") {
        bookingScore += ev.priorityWeight;
      } else if (ev.status === "alternative_offered") {
        bookingScore += ev.priorityWeight * 0.5;
      }
    }

    const metrics = {
      total_requests: events.length,
      approved_count: events.filter((e: any) => e.status === "approved").length,
      alternative_count: events.filter((e: any) => e.status === "alternative_offered").length,
      rejected_count: events.filter((e: any) => e.status === "rejected").length,
      cancelled_count: events.filter((e: any) => e.status === "cancelled").length,
      booking_score: Number(bookingScore.toFixed(1)),
    };

    const session = getAuthenticatedSession(req);

    return NextResponse.json({
      success: true,
      metrics,
      events,
      history,
      current_session: session,
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
    const overridesPath = path.join(rootDir, "data", "spectra_overrides.json");
    const historyPath = path.join(rootDir, "data", "spectra_history.json");

    const data = await readDurableJson<any>(dataPath, null);
    const schedule = await readDurableJson<any>(schedPath, null);
    if (!data || !schedule) {
      return apiError("Dataset or schedule is missing from persistent storage.", 404);
    }
    const engine = new BookingEngine(data);

    const requestId = body.request_id;
    if (!requestId) return apiError("Missing request_id.", 400);

    const targetReq = (data.booking_requests || []).find((r: any) => r.id === requestId);
    if (!targetReq) return apiError(`Request ${requestId} not found in dataset.`, 404);

    // 1. Authenticated Server-Side Identity (Bug 1 & Bug 2)
    const session = getAuthenticatedSession(req);
    const userRole = session.role;
    const currentUser = session.name;

    // Load overrides
    let overrides: Record<string, any> = {};
    {
      try {
        overrides = await readDurableJson<Record<string, any>>(overridesPath, {});
      } catch {
        overrides = {};
      }
    }

    // Load history
    let history: DecisionHistoryItem[] = [];
    {
      try {
        history = await readDurableJson<DecisionHistoryItem[]>(historyPath, []);
      } catch {
        history = [];
      }
    }

    const currentBookingInSched = (schedule.fest_week?.bookings || []).find((b: any) => b.request_id === requestId);
    const previousStatus = overrides[requestId]?.status || currentBookingInSched?.status || "pending";

    const saveOverrideAndHistory = async (
      reqId: string,
      status: "approved" | "rejected" | "cancelled" | "alternative_offered",
      reason: string,
      extra?: { room_id?: string; day?: string; start_period?: number; end_period?: number }
    ) => {
      // 1. Update Overrides
      overrides[reqId] = {
        status,
        reason,
        updated_at: new Date().toISOString(),
        by: currentUser,
        role: userRole,
        room_id: extra?.room_id,
        day: extra?.day,
        start_period: extra?.start_period,
        end_period: extra?.end_period,
      };
      await writeDurableJson(overridesPath, overrides);

      // 2. Synchronize schedule.json (fest_week.bookings) (Bug 3)
      if (!schedule.fest_week) schedule.fest_week = { bookings: [], session_overrides: [] };
      const existingIdx = schedule.fest_week.bookings.findIndex((b: any) => b.request_id === reqId);
      const bookingRecord = {
        request_id: reqId,
        status,
        day: extra?.day || overrides[reqId]?.day || currentBookingInSched?.day || targetReq.windows?.[0]?.day || "MON",
        start_period: extra?.start_period || overrides[reqId]?.start_period || currentBookingInSched?.start_period || targetReq.windows?.[0]?.from_period || 10,
        end_period: extra?.end_period || overrides[reqId]?.end_period || currentBookingInSched?.end_period || targetReq.windows?.[0]?.to_period || 11,
        room_id: extra?.room_id || overrides[reqId]?.room_id || currentBookingInSched?.room_id || targetReq.requested_room || "AUD",
        reason,
      };

      if (existingIdx >= 0) {
        schedule.fest_week.bookings[existingIdx] = bookingRecord;
      } else {
        schedule.fest_week.bookings.push(bookingRecord);
      }
      await writeDurableJson(schedPath, schedule);

      // 3. Append to History Audit Log (Task 113)
      const historyAction: DecisionHistoryItem["action"] =
        status === "approved"
          ? "approve"
          : status === "rejected"
          ? "reject"
          : status === "cancelled"
          ? "cancel"
          : "alternative_offered";

      const historyEntry: DecisionHistoryItem = {
        id: `HIST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        request_id: reqId,
        event_title: targetReq.title,
        action: historyAction,
        previous_status: previousStatus,
        new_status: status,
        by_user: currentUser,
        by_role: userRole,
        reason,
        timestamp: new Date().toISOString(),
        room_id: bookingRecord.room_id,
        day: bookingRecord.day,
        start_period: bookingRecord.start_period,
        end_period: bookingRecord.end_period,
      };
      history.unshift(historyEntry);
      await writeDurableJson(historyPath, history);
    };

    // ACTION: GET ALTERNATIVES (Task 107 & 108)
    if (body.action === "get_alternatives") {
      const targetRoom = body.room_id || targetReq.requested_room || "AUD";
      const targetDay = body.day || targetReq.windows?.[0]?.day || "MON";
      const startP = body.start_period || targetReq.windows?.[0]?.from_period || 10;
      const dur = targetReq.duration_periods || 2;

      const check = engine.checkAvailability(
        {
          title: targetReq.title,
          role: targetReq.role,
          requested_category: targetReq.requested_category,
          attendance: targetReq.attendance,
          day: targetDay,
          start_period: startP,
          duration_periods: dur,
          room_id: targetRoom,
          needs: targetReq.needs || [],
          mandatory_for_groups: targetReq.mandatory_for_groups || [],
        },
        schedule
      );

      return NextResponse.json({
        success: true,
        request_id: requestId,
        available: check.available,
        conflicts: check.conflicts,
        reasons: check.reasons,
        alternatives: check.alternatives,
      });
    }

    // ACTION: APPROVE (Tasks 105, 109, 110, 115)
    if (body.action === "approve") {
      if (userRole !== "admin" && userRole !== "department_coordinator") return apiError("Only Admin or Department Coordinator accounts may approve events.", 403);
      if (previousStatus !== "pending" && previousStatus !== "alternative_offered") {
        return apiError(`Only pending or alternative-offered requests can be approved (current status: ${previousStatus}).`, 409);
      }
      // Task 110: Prevent unauthorized approvals
      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can approve booking requests.", 403);
      }

      // Task 109: Prevent self-approval (Section 4 Governance Rule: "Nobody can approve their own request")
      const reqName = (targetReq.requester || "").trim().toLowerCase();
      const currName = currentUser.trim().toLowerCase();
      const isSimulatedSelf = session.isSimulatedSelf === true;
      const isSelfApproval =
        isSimulatedSelf ||
        currName === reqName ||
        (userRole === "admin" && reqName === "spectra core team" && currName.includes("core"));

      if (isSelfApproval) {
        return apiError("Governance violation: Self-approval is strictly prohibited. You cannot approve your own booking request.", 403);
      }

      // Priority Role Cap (Task 98, 99-104)
      if (userRole === "department_coordinator" && targetReq.requested_category === "institute_event") {
        return apiError("Unauthorized: Department Coordinators cannot approve Institute Main Events. Dean's Office approval is required.", 403);
      }

      // Task 115: Validate decisions with scheduling engine (Bug 3)
      const allocatedRoom = body.room_id || overrides[requestId]?.room_id || currentBookingInSched?.room_id || targetReq.requested_room || "AUD";
      const allocatedDay = body.day || overrides[requestId]?.day || currentBookingInSched?.day || targetReq.windows?.[0]?.day || "MON";
      const startP = body.start_period || overrides[requestId]?.start_period || currentBookingInSched?.start_period || targetReq.windows?.[0]?.from_period || 10;
      const dur = targetReq.duration_periods || 2;
      const endP = startP + dur - 1;

      // Check if target window matches requested windows (Validator Rule: outside requested windows must be alternative_offered)
      const insideRequestedWindow = (targetReq.windows || []).some(
        (w: any) => w.day === allocatedDay && w.from_period <= startP && endP <= w.to_period
      );

      // Temporarily remove this request from schedule fest_week for fresh availability evaluation
      const tempSched = JSON.parse(JSON.stringify(schedule));
      if (tempSched.fest_week?.bookings) {
        tempSched.fest_week.bookings = tempSched.fest_week.bookings.filter((b: any) => b.request_id !== requestId);
      }

      const checkResult = engine.checkAvailability(
        {
          title: targetReq.title,
          role: targetReq.role,
          requested_category: targetReq.requested_category,
          attendance: targetReq.attendance,
          day: allocatedDay,
          start_period: startP,
          duration_periods: dur,
          room_id: allocatedRoom,
          needs: targetReq.needs || [],
          mandatory_for_groups: targetReq.mandatory_for_groups || [],
        },
        tempSched
      );

      if (!checkResult.available) {
        return NextResponse.json({
          success: false,
          error: `Scheduling conflict: ${checkResult.conflicts.join("; ")}`,
          validation: checkResult,
          alternatives: checkResult.alternatives,
        }, { status: 409 });
      }

      const finalStatus = insideRequestedWindow ? "approved" : "alternative_offered";
      const finalReason = insideRequestedWindow
        ? `Approved by ${currentUser} (${userRole}) following official schedule validation.`
        : `Approved in alternative time window by ${currentUser}.`;

      await saveOverrideAndHistory(requestId, finalStatus, finalReason, {
        room_id: allocatedRoom,
        day: allocatedDay,
        start_period: startP,
        end_period: endP,
      });

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} (${targetReq.title}) ${finalStatus === "approved" ? "approved" : "offered with alternative slot"} successfully.`,
        status: finalStatus,
        validation: checkResult,
      });
    }

    // ACTION: OFFER / APPLY ALTERNATIVE (Tasks 107 & 108)
    if (body.action === "offer_alternative" || body.action === "apply_alternative") {
      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can offer alternatives.", 403);
      }

      if (previousStatus !== "pending" && previousStatus !== "alternative_offered") {
        return apiError(`Only pending requests can receive an alternative (current status: ${previousStatus}).`, 409);
      }
      const altRoom = body.room_id;
      const altDay = body.day;
      const altStart = parseInt(body.start_period, 10);
      const altEnd = parseInt(body.end_period, 10) || (altStart + (targetReq.duration_periods || 2) - 1);

      if (!altRoom || !altDay || !altStart) {
        return apiError("Missing alternative venue, day, or start period parameters.", 400);
      }

      // Validate alternative against scheduling engine
      const tempSched = JSON.parse(JSON.stringify(schedule));
      if (tempSched.fest_week?.bookings) {
        tempSched.fest_week.bookings = tempSched.fest_week.bookings.filter((b: any) => b.request_id !== requestId);
      }

      const checkResult = engine.checkAvailability(
        {
          title: targetReq.title,
          role: targetReq.role,
          requested_category: targetReq.requested_category,
          attendance: targetReq.attendance,
          day: altDay,
          start_period: altStart,
          duration_periods: altEnd - altStart + 1,
          room_id: altRoom,
          needs: targetReq.needs || [],
          mandatory_for_groups: targetReq.mandatory_for_groups || [],
        },
        tempSched
      );

      if (!checkResult.available) {
        return NextResponse.json({
          success: false,
          error: `Selected alternative has scheduling conflicts: ${checkResult.conflicts.join("; ")}`,
          validation: checkResult,
        }, { status: 409 });
      }

      const altReason = body.reason || `Alternative slot (${altRoom} on ${altDay} P${altStart}–P${altEnd}) offered by ${currentUser} to resolve venue contention.`;
      await saveOverrideAndHistory(requestId, "alternative_offered", altReason, {
        room_id: altRoom,
        day: altDay,
        start_period: altStart,
        end_period: altEnd,
      });

      return NextResponse.json({
        success: true,
        message: `Alternative venue/time successfully offered for ${requestId}.`,
        status: "alternative_offered",
        booking: {
          room_id: altRoom,
          day: altDay,
          start_period: altStart,
          end_period: altEnd,
        },
      });
    }

    // ACTION: REJECT (Tasks 106, 112)
    if (body.action === "reject") {
      if (userRole !== "admin" && userRole !== "department_coordinator") {
        return apiError("Unauthorized: Only Dean's Office or Department Coordinators can reject booking requests.", 403);
      }
      if (previousStatus !== "pending" && previousStatus !== "alternative_offered") {
        return apiError(`Only pending requests can be rejected (current status: ${previousStatus}).`, 409);
      }

      const rejectReason = (body.reason && body.reason.trim())
        ? body.reason.trim()
        : "Rejected due to capacity or venue scheduling priority conflicts.";

      await saveOverrideAndHistory(requestId, "rejected", rejectReason);

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} rejected.`,
        status: "rejected",
        reason: rejectReason,
      });
    }

    // ACTION: CANCEL (Task 114)
    if (body.action === "cancel") {
      const isOwner = targetReq.requester && currentUser.toLowerCase() === targetReq.requester.toLowerCase();
      const isAdminOrCoord = userRole === "admin" || userRole === "department_coordinator";

      if (!isAdminOrCoord && !isOwner) {
        return apiError("Unauthorized: You do not have permission to cancel this booking request.", 403);
      }

      const cancelReason = `Booking cancelled by ${currentUser} (${userRole}).`;
      await saveOverrideAndHistory(requestId, "cancelled", cancelReason);

      return NextResponse.json({
        success: true,
        message: `Event ${requestId} has been cancelled.`,
        status: "cancelled",
        reason: cancelReason,
      });
    }

    return apiError("Invalid action specified.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute booking action.";
    return apiError(message, 500);
  }
}
