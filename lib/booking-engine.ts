import { BookingRequest, Room, UserRole, Day } from "./types";

export const DEFAULT_CAT_WEIGHT: Record<string, number> = {
  institute_event: 5,
  guest_lecture: 4,
  department_event: 3,
  club_event: 2,
};

export const DEFAULT_PRIORITY_ORDER = [
  "exam",
  "regular_session",
  "institute_event",
  "guest_lecture",
  "department_event",
  "club_event",
];

export const CAT_WEIGHT = DEFAULT_CAT_WEIGHT;
export const PRIORITY_ORDER = DEFAULT_PRIORITY_ORDER;

export const ROLE_CAP: Record<string, string> = {
  admin: "institute_event",
  faculty: "guest_lecture",
  department_coordinator: "department_event",
  club: "club_event",
};

export interface CheckAvailabilityParams {
  title?: string;
  role?: string;
  requested_category?: string;
  attendance: number;
  day: Day | string;
  start_period: number;
  duration_periods: number;
  room_id?: string;
  room_types?: string[];
  needs?: string[];
  mandatory_for_groups?: string[];
}

export interface AlternativeVenueOption {
  room_id: string;
  room_name: string;
  day: Day;
  start_period: number;
  end_period: number;
  capacity: number;
  features: string[];
  reason: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  room_id?: string;
  room_name?: string;
  conflicts: string[];
  reasons: string[];
  explanation: string;
  alternatives: AlternativeVenueOption[];
}

export class BookingEngine {
  private requests: BookingRequest[];
  private cancellations: Set<string>;
  private rooms: Map<string, Room>;
  private dataset: any;
  private priorityOrder: string[];

  constructor(dataset: any, customPriorityOrder?: string[]) {
    this.dataset = dataset;
    this.requests = dataset.booking_requests || [];
    this.cancellations = new Set((dataset.cancellations || []).map((c: any) => c.request_id));
    this.rooms = new Map((dataset.rooms || []).map((r: Room) => [r.id, r]));
    this.priorityOrder = customPriorityOrder && customPriorityOrder.length > 0
      ? customPriorityOrder
      : dataset.priority_order || DEFAULT_PRIORITY_ORDER;
  }

  public getEffectiveCategory(role: string, requestedCategory: string): string {
    const cap = ROLE_CAP[role] || "club_event";
    const reqIndex = this.priorityOrder.indexOf(requestedCategory);
    const capIndex = this.priorityOrder.indexOf(cap);
    return this.priorityOrder[Math.max(reqIndex >= 0 ? reqIndex : 5, capIndex >= 0 ? capIndex : 5)];
  }

  /**
   * Real-time deterministic venue availability & conflict checking (Tasks 81-86, 92, 93)
   */
  public checkAvailability(
    params: CheckAvailabilityParams,
    currentSchedule: any
  ): AvailabilityCheckResult {
    const globalConflicts: string[] = [];
    const reasons: string[] = [];
    const alternatives: AlternativeVenueOption[] = [];

    const duration = params.duration_periods || 1;
    const startP = params.start_period;
    const endP = startP + duration - 1;
    const day = (["MON", "TUE", "WED", "THU", "FRI"].includes(String(params.day).toUpperCase())
      ? String(params.day).toUpperCase()
      : "THU") as Day;
    const attendance = params.attendance || 1;
    const needs = params.needs || [];
    const mandatoryGroups = params.mandatory_for_groups || [];

    // 0. Role authorization cap check
    if (params.role && params.requested_category) {
      const allowedMaxCat = ROLE_CAP[params.role] || "club_event";
      const reqIdx = this.priorityOrder.indexOf(params.requested_category);
      const capIdx = this.priorityOrder.indexOf(allowedMaxCat);
      if (reqIdx < capIdx && reqIdx >= 0) {
        globalConflicts.push(`Role '${params.role}' is capped at '${allowedMaxCat}' and cannot request higher priority '${params.requested_category}'.`);
      }
    }

    // 1. Time boundary & Curfew validation (Task 84)
    if (startP < 1 || endP > 13) {
      globalConflicts.push(`Requested time P${startP}–P${endP} exceeds operational campus periods (P1 to P13).`);
      reasons.push("Events must end by period 13 (22:00 curfew cutoff).");
    }

    if (startP <= 9 && (params.role === "club" || params.requested_category === "club_event")) {
      reasons.push("Regular teaching periods run P1–P9. Club events are recommended in evening event windows (P10–P13).");
    }

    // Identify target room candidates
    let targetRooms: Room[] = [];
    if (params.room_id) {
      const specified = this.rooms.get(params.room_id);
      if (specified) targetRooms = [specified];
      else globalConflicts.push(`Specified room '${params.room_id}' is not in campus inventory.`);
    } else {
      targetRooms = Array.from(this.rooms.values()).filter((r) => {
        if (!r.allowed_uses.includes("event")) return false;
        if (params.room_types && params.room_types.length > 0 && !params.room_types.includes(r.type)) return false;
        return true;
      });
    }

    // Build current schedule busy maps
    const roomBusy = new Map<string, string[]>(); // "room:day:period" -> reasons
    const grpBusy = new Map<string, string[]>();  // "group:day:period" -> reasons

    // A. Regular Academic Sessions
    const sessMap = new Map<string, any>((this.dataset.sessions || []).map((s: any) => [s.id, s]));
    for (const ss of currentSchedule?.sessions || []) {
      const meta = sessMap.get(ss.session_id) as any;
      const dur = (meta?.duration as number) || 1;
      for (let p = ss.start_period; p < ss.start_period + dur; p++) {
        const rk = `${ss.room_id}:${ss.day}:${p}`;
        roomBusy.set(rk, [...(roomBusy.get(rk) || []), `Class: ${ss.session_id}`]);

        for (const g of (meta?.groups || []) as string[]) {
          const gk = `${g}:${ss.day}:${p}`;
          grpBusy.set(gk, [...(grpBusy.get(gk) || []), `Class: ${ss.session_id}`]);
        }
      }
    }

    // B. Room Maintenance Windows
    for (const u of this.dataset.room_unavailability || []) {
      for (const p of u.periods) {
        const rk = `${u.room_id}:${u.day}:${p}`;
        roomBusy.set(rk, [...(roomBusy.get(rk) || []), `Maintenance: ${u.reason || "Room closed"}`]);
      }
    }

    // C. Approved Venue Bookings
    for (const b of currentSchedule?.fest_week?.bookings || []) {
      if (b.status === "approved" && b.room_id) {
        for (let p = b.start_period; p <= b.end_period; p++) {
          const rk = `${b.room_id}:${b.day}:${p}`;
          roomBusy.set(rk, [...(roomBusy.get(rk) || []), `Approved Event: ${b.request_id} (${b.reason || "Booked"})`]);
        }
      }
    }

    // D. Mandatory student groups check
    for (const g of mandatoryGroups) {
      for (let p = startP; p <= endP; p++) {
        const gk = `${g}:${day}:${p}`;
        if (grpBusy.has(gk)) {
          globalConflicts.push(`Mandatory group ${g} has scheduled commitment on ${day} P${p} (${grpBusy.get(gk)?.join(", ")}).`);
        }
      }
    }

    // Evaluate target room candidates independently
    let chosenRoom: Room | null = null;
    let available = false;
    const roomLevelRejections: string[] = [];

    for (const r of targetRooms) {
      const roomConflicts: string[] = [];

      // Capacity check (Task 82)
      if (r.capacity < attendance) {
        roomConflicts.push(`Venue ${r.name || r.id} capacity (${r.capacity}) is below expected attendance (${attendance}).`);
      }

      // Allowed use check
      if (!r.allowed_uses.includes("event")) {
        roomConflicts.push(`Venue ${r.name || r.id} (${r.type}) is strictly restricted from hosting events.`);
      }

      // Facilities check (Task 83)
      if (needs.includes("accessible") && !r.accessible) {
        roomConflicts.push(`Venue ${r.name || r.id} is not wheelchair-accessible.`);
      }
      for (const reqFeat of needs) {
        if (reqFeat !== "accessible" && !r.features.includes(reqFeat)) {
          roomConflicts.push(`Venue ${r.name || r.id} lacks requested feature: '${reqFeat}'.`);
        }
      }

      // Check room clashes (Tasks 85, 86)
      for (let p = startP; p <= endP; p++) {
        const rk = `${r.id}:${day}:${p}`;
        if (roomBusy.has(rk)) {
          const occupants = roomBusy.get(rk) || [];
          roomConflicts.push(`Venue ${r.name || r.id} is occupied on ${day} P${p}: ${occupants.join("; ")}.`);
        }
      }

      if (globalConflicts.length === 0 && roomConflicts.length === 0) {
        chosenRoom = r;
        available = true;
        reasons.push(`Venue ${r.name || r.id} is completely free on ${day} P${startP}–P${endP} and satisfies all capacity & equipment rules.`);
        break;
      } else {
        roomLevelRejections.push(...roomConflicts);
      }
    }

    const conflicts: string[] = available
      ? []
      : [...globalConflicts, ...(targetRooms.length === 1 ? roomLevelRejections : Array.from(new Set(roomLevelRejections)).slice(0, 3))];

    // Compute alternative slots and rooms if unavailable
    if (!available) {
      const qualifiedRooms = Array.from(this.rooms.values()).filter((r) => {
        if (!r.allowed_uses.includes("event")) return false;
        if (r.capacity < attendance) return false;
        if (needs.includes("accessible") && !r.accessible) return false;
        if (needs.some((f) => f !== "accessible" && !r.features.includes(f))) return false;
        return true;
      });

      const groupClashInOriginalSlot = mandatoryGroups.some((g) => {
        for (let p = startP; p <= endP; p++) {
          if (grpBusy.has(`${g}:${day}:${p}`)) return true;
        }
        return false;
      });

      // 1. Same time slot in another suitable qualified venue
      if (!groupClashInOriginalSlot) {
        for (const alt of qualifiedRooms) {
          if (params.room_id && alt.id === params.room_id) continue;
          let slotFree = true;
          for (let p = startP; p <= endP; p++) {
            if (roomBusy.has(`${alt.id}:${day}:${p}`)) {
              slotFree = false;
              break;
            }
          }
          if (slotFree) {
            alternatives.push({
              room_id: alt.id,
              room_name: alt.name || alt.id,
              day,
              start_period: startP,
              end_period: endP,
              capacity: alt.capacity,
              features: alt.features,
              reason: `Alternative venue available at requested time with ${alt.capacity} seats and full required equipment.`,
            });
            if (alternatives.length >= 2) break;
          }
        }
      }

      // 2. Alternative time slots across qualified venues
      const candidateRoomsForShift = qualifiedRooms.length > 0 ? qualifiedRooms : targetRooms;
      for (const candRoom of candidateRoomsForShift.slice(0, 3)) {
        for (const candidateDay of (["MON", "TUE", "WED", "THU", "FRI"] as Day[])) {
          for (const sp of [10, 11, 6, 7, 8]) {
            if (candidateDay === day && sp === startP) continue;
            const ep = sp + duration - 1;
            if (ep > 13) continue;

            let slotFree = true;
            for (let p = sp; p <= ep; p++) {
              if (roomBusy.has(`${candRoom.id}:${candidateDay}:${p}`)) {
                slotFree = false;
                break;
              }
            }

            if (slotFree && mandatoryGroups.length > 0) {
              for (const g of mandatoryGroups) {
                for (let p = sp; p <= ep; p++) {
                  if (grpBusy.has(`${g}:${candidateDay}:${p}`)) {
                    slotFree = false;
                    break;
                  }
                }
                if (!slotFree) break;
              }
            }

            if (slotFree) {
              alternatives.push({
                room_id: candRoom.id,
                room_name: candRoom.name || candRoom.id,
                day: candidateDay,
                start_period: sp,
                end_period: ep,
                capacity: candRoom.capacity,
                features: candRoom.features,
                reason: `${candRoom.name || candRoom.id} is available on ${candidateDay} at P${sp}–P${ep} with required facilities.`,
              });
              break;
            }
          }
          if (alternatives.length >= 4) break;
        }
        if (alternatives.length >= 4) break;
      }
    }

    const explanation = available
      ? `Booking request is approved. Venue ${chosenRoom?.name || chosenRoom?.id} meets all criteria (capacity ${chosenRoom?.capacity} >= ${attendance}) with 0 timetable clashes.`
      : `Booking cannot be confirmed at requested venue & time due to: ${conflicts[0] || "Scheduling conflicts"}. Alternative slots or rooms have been computed.`;

    return {
      available,
      room_id: chosenRoom?.id || (targetRooms[0] ? targetRooms[0].id : undefined),
      room_name: chosenRoom?.name || (targetRooms[0] ? targetRooms[0].name : undefined),
      conflicts,
      reasons,
      explanation,
      alternatives,
    };
  }
}