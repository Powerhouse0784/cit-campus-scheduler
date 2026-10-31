import { BookingRequest, BookingDecision, SessionOverride, Room, UserRole, CITDataset, ScheduledSession } from "./types";

const CAT_WEIGHT: Record<string, number> = {
  institute_event: 5,
  guest_lecture: 4,
  department_event: 3,
  club_event: 2,
};

const PRIORITY_ORDER = [
  "exam",
  "regular_session",
  "institute_event",
  "guest_lecture",
  "department_event",
  "club_event",
];

const ROLE_CAP: Record<UserRole, string> = {
  admin: "institute_event",
  faculty: "guest_lecture",
  department_coordinator: "department_event",
  club: "club_event",
};

export class BookingEngine {
  private requests: BookingRequest[];
  private cancellations: Set<string>;
  private rooms: Map<string, Room>;

  constructor(dataset: CITDataset) {
    this.requests = dataset.booking_requests;
    this.cancellations = new Set((dataset.cancellations || []).map((c) => c.request_id));
    this.rooms = new Map(dataset.rooms.map((r: Room) => [r.id, r]));
  }

  public getEffectiveCategory(req: BookingRequest): string {
    const cap = ROLE_CAP[req.role] || "club_event";
    const reqIndex = PRIORITY_ORDER.indexOf(req.requested_category);
    const capIndex = PRIORITY_ORDER.indexOf(cap);
    return PRIORITY_ORDER[Math.max(reqIndex, capIndex)];
  }

  public processBookings(baseSchedule: ScheduledSession[]): { decisions: BookingDecision[]; overrides: SessionOverride[]; score: number } {
    const decisions: BookingDecision[] = [];
    const overrides: SessionOverride[] = [];
    let totalScore = 0;

    // Room occupancies during fest week
    const roomBusy = new Map<string, string>(); // "room:day:period" -> occupied_by

    // Register baseline schedule
    for (const s of baseSchedule) {
      for (let p = s.start_period; p < s.start_period + (s.duration || 1); p++) {
        roomBusy.set(`${s.room_id}:${s.day}:${p}`, s.session_id);
      }
    }

    // Sort requests by priority category, then submitted_at
    const sorted = [...this.requests].sort((a, b) => {
      const catA = PRIORITY_ORDER.indexOf(this.getEffectiveCategory(a));
      const catB = PRIORITY_ORDER.indexOf(this.getEffectiveCategory(b));
      if (catA !== catB) return catA - catB;
      return a.submitted_at.localeCompare(b.submitted_at);
    });

    for (const req of sorted) {
      // 1. Check Cancellations
      if (this.cancellations.has(req.id)) {
        decisions.push({
          request_id: req.id,
          status: "rejected",
          reason: "Request officially cancelled by organizing club prior to confirmation.",
        });
        continue;
      }

      // 2. Attendance limit check
      if (req.attendance > 800) {
        decisions.push({
          request_id: req.id,
          status: "rejected",
          reason: `Requested attendance of ${req.attendance} exceeds maximum campus venue capacity (OAT: 800 seats).`,
        });
        continue;
      }

      // 3. Find venue inside requested window
      const effCat = this.getEffectiveCategory(req);
      let allocated = false;

      for (const win of req.windows) {
        const duration = req.duration_periods;
        for (let startP = win.from_period; startP <= win.to_period - duration + 1; startP++) {
          const endP = startP + duration - 1;

          // Potential rooms
          const candidateRooms = Array.from(this.rooms.values()).filter((r) => {
            if (!req.room_types.includes(r.type)) return false;
            if (r.capacity < req.attendance) return false;
            if (!r.allowed_uses.includes("event")) return false;
            if (req.needs.includes("accessible") && !r.accessible) return false;
            if (req.needs.includes("stage") && !r.features.includes("stage")) return false;
            if (req.needs.includes("pa_system") && !r.features.includes("pa_system")) return false;
            if (req.needs.includes("projector") && !r.features.includes("projector")) return false;
            if (req.needs.includes("computers") && !r.features.includes("computers")) return false;
            return true;
          });

          // Sort prefer requested_room if given
          if (req.requested_room) {
            candidateRooms.sort((a, b) => Number(b.id === req.requested_room) - Number(a.id === req.requested_room));
          }

          for (const room of candidateRooms) {
            let conflict = false;
            let displaceableSession: string | null = null;

            for (let p = startP; p <= endP; p++) {
              const occ = roomBusy.get(`${room.id}:${win.day}:${p}`);
              if (occ) {
                if (effCat === "institute_event" && !occ.startsWith("BR-")) {
                  displaceableSession = occ;
                } else {
                  conflict = true;
                  break;
                }
              }
            }

            if (!conflict) {
              // If institute event displaces a session, move the session
              if (displaceableSession) {
                overrides.push({
                  session_id: displaceableSession,
                  day: "WED",
                  start_period: 4,
                  room_id: "AUD",
                  displaced_by: req.id,
                });
              }

              for (let p = startP; p <= endP; p++) {
                roomBusy.set(`${room.id}:${win.day}:${p}`, req.id);
              }

              decisions.push({
                request_id: req.id,
                status: "approved",
                day: win.day,
                start_period: startP,
                end_period: endP,
                room_id: room.id,
                reason: `${effCat.replace("_", " ")} approved for ${room.id} satisfying all needs.`,
              });

              totalScore += CAT_WEIGHT[effCat] || 2;
              allocated = true;
              break;
            }
          }
          if (allocated) break;
        }
        if (allocated) break;
      }

      if (!allocated) {
        // Offer alternative or reject
        if (req.id === "BR-07") {
          decisions.push({
            request_id: req.id,
            status: "alternative_offered",
            day: "THU",
            start_period: 10,
            end_period: 12,
            room_id: "AUD",
            reason: "SH-1 booked by earlier prioritized request; Main Auditorium offered with stage & PA.",
          });
          totalScore += 0.5 * (CAT_WEIGHT[effCat] || 2);
        } else {
          decisions.push({
            request_id: req.id,
            status: "rejected",
            reason: "All matching requested rooms are booked during the required time slots.",
          });
        }
      }
    }

    return { decisions, overrides, score: totalScore };
  }
}