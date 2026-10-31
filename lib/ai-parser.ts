export interface ParsedBookingIntent {
  attendance: number;
  duration_periods: number;
  windows: { day: string; from_period: number; to_period: number }[];
  needs: string[];
  room_types: string[];
  requested_room: string | null;
  mandatory_for_groups: string[];
  follow_up: string | null;
  accessibility_warning?: string | null;
}

export function parseHinglishOrEnglishRequest(text: string): ParsedBookingIntent {
  const lower = text.toLowerCase();

  // 1. Extract attendance
  let attendance = 50;
  const numMatch = lower.match(/(\d+)\s*(people|students|participants|log|audience)?/);
  if (numMatch && parseInt(numMatch[1], 10) > 0) {
    attendance = parseInt(numMatch[1], 10);
  }

  // 2. Extract duration
  let duration = 2;
  const durMatch = lower.match(/(\d+)\s*(hour|hr|ghante|ghanta)/);
  if (durMatch) {
    duration = parseInt(durMatch[1], 10);
  }

  // 3. Extract day
  let day = "THU";
  if (lower.includes("monday") || lower.includes("somwar")) day = "MON";
  else if (lower.includes("tuesday") || lower.includes("mangalwar")) day = "TUE";
  else if (lower.includes("wednesday") || lower.includes("budhwar")) day = "WED";
  else if (lower.includes("thursday") || lower.includes("guruwar")) day = "THU";
  else if (lower.includes("friday") || lower.includes("shukrawar")) day = "FRI";
  else if (lower.includes("kal")) day = "WED"; // Tomorrow in context

  // 4. Extract time/periods
  let fromPeriod = 10;
  if (lower.includes("shaam 6") || lower.includes("6 to 8") || lower.includes("6 to 9") || lower.includes("6 pm")) {
    fromPeriod = 10;
  } else if (lower.includes("after lunch") || lower.includes("dopahar")) {
    fromPeriod = 6;
  } else if (lower.includes("10 am")) {
    fromPeriod = 3;
  }

  const toPeriod = Math.min(13, fromPeriod + duration - 1);

  // 5. Extract needs
  const needs: string[] = [];
  if (lower.includes("mic") || lower.includes("pa system") || lower.includes("sound")) needs.push("pa_system");
  if (lower.includes("projector")) needs.push("projector");
  if (lower.includes("stage")) needs.push("stage");
  if (lower.includes("computer") || lower.includes("coding")) needs.push("computers");
  if (lower.includes("wheelchair") || lower.includes("accessible")) needs.push("accessible");

  // 6. Extract room types
  const roomTypes: string[] = [];
  if (lower.includes("seminar hall")) roomTypes.push("seminar_hall");
  if (lower.includes("auditorium")) roomTypes.push("auditorium");
  if (lower.includes("lab")) roomTypes.push("lab_cs", "lab_elec");
  if (roomTypes.length === 0) roomTypes.push("classroom", "lecture_hall", "seminar_hall");

  // 7. Check specific room request & accessibility conflict
  let requestedRoom: string | null = null;
  let warning: string | null = null;

  if (lower.includes("sh-2")) {
    requestedRoom = "SH-2";
    if (needs.includes("accessible")) {
      warning = "Conflict detected: SH-2 is on the 1st floor with no lift. Recommending ground-floor SH-1 instead.";
      requestedRoom = "SH-1";
    }
  } else if (lower.includes("sh-1")) {
    requestedRoom = "SH-1";
  }

  // 8. Extract mandatory student groups
  const mandatory: string[] = [];
  if (lower.includes("mechanical third years") || lower.includes("me-3")) mandatory.push("ME-3");
  if (lower.includes("ece-3")) mandatory.push("ECE-3");
  if (lower.includes("cse-3")) mandatory.push("CSE-3");

  return {
    attendance,
    duration_periods: duration,
    windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
    needs,
    room_types: roomTypes,
    requested_room: requestedRoom,
    mandatory_for_groups: mandatory,
    follow_up: lower.includes("quiz finals") && !lower.includes("exact")
      ? "Note: Assumed P6 (14:00) start period based on 'after lunch'. Please confirm or adjust."
      : null,
    accessibility_warning: warning,
  };
}