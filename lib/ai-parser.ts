export interface ParsedBookingIntent {
  title: string;
  category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  attendance: number;
  duration_periods: number;
  day: string;
  start_period: number;
  end_period: number;
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
  const followUps: string[] = [];

  // 1. Extract Title
  let title = "Campus Event";
  if (lower.includes("hackathon")) title = "Coding Hackathon";
  else if (lower.includes("quiz")) title = "Campus Quiz Competition";
  else if (lower.includes("dance") || lower.includes("rehearsal")) title = "Dance & Cultural Rehearsal";
  else if (lower.includes("guest lecture") || lower.includes("talk") || lower.includes("speaker")) title = "Distinguished Guest Lecture";
  else if (lower.includes("workshop")) title = "Technical Workshop";
  else if (lower.includes("inauguration") || lower.includes("opening")) title = "Opening & Inaugural Ceremony";
  else if (lower.includes("jam") || lower.includes("concert") || lower.includes("music")) title = "Music & Jam Night";
  else if (lower.includes("exhibition")) title = "Photography & Art Exhibition";
  else if (lower.includes("robo")) title = "Robo-Wars Battle Arena";

  // 2. Extract Category
  let category: "institute_event" | "guest_lecture" | "department_event" | "club_event" = "club_event";
  if (lower.includes("inauguration") || lower.includes("closing ceremony") || lower.includes("convocation") || lower.includes("institute")) {
    category = "institute_event";
  } else if (lower.includes("guest lecture") || lower.includes("distinguished talk") || lower.includes("keynote")) {
    category = "guest_lecture";
  } else if (lower.includes("department") || lower.includes("pre-placement") || lower.includes("faculty meeting")) {
    category = "department_event";
  }

  // 3. Extract Attendance
  let attendance = 50;
  let attendanceFound = false;
  const numMatch = lower.match(/(\d+)\s*(people|students|participants|log|audience|seats|attendance|members)?/);
  if (numMatch && parseInt(numMatch[1], 10) > 0) {
    attendance = parseInt(numMatch[1], 10);
    attendanceFound = true;
  }
  if (!attendanceFound && !lower.includes("50")) {
    followUps.push("Estimated attendance was not specified; defaulted to 50. What is your estimated audience size?");
  }

  // 4. Extract Duration
  let duration = 2;
  let durationFound = false;
  const durMatch = lower.match(/(\d+)\s*(hour|hr|ghante|ghanta|periods|period)/);
  if (durMatch) {
    duration = parseInt(durMatch[1], 10);
    durationFound = true;
  }
  if (!durationFound) {
    followUps.push("Duration was not specified; defaulted to 2 periods. How many hours do you need?");
  }

  // 5. Robust Date & Day Parsing (Supports days, Hindi terms, calendar dates)
  let day = "THU";
  let dayFound = false;
  if (lower.includes("monday") || lower.includes("somwar") || lower.includes("mon")) {
    day = "MON";
    dayFound = true;
  } else if (lower.includes("tuesday") || lower.includes("mangalwar") || lower.includes("tue")) {
    day = "TUE";
    dayFound = true;
  } else if (lower.includes("wednesday") || lower.includes("budhwar") || lower.includes("wed")) {
    day = "WED";
    dayFound = true;
  } else if (lower.includes("thursday") || lower.includes("guruwar") || lower.includes("thu")) {
    day = "THU";
    dayFound = true;
  } else if (lower.includes("friday") || lower.includes("shukrawar") || lower.includes("fri")) {
    day = "FRI";
    dayFound = true;
  } else if (lower.includes("parso") || lower.includes("day after tomorrow")) {
    day = "THU";
    dayFound = true;
  } else if (lower.includes("kal") || lower.includes("tomorrow")) {
    day = "WED";
    dayFound = true;
  } else if (lower.includes("aaj") || lower.includes("today")) {
    day = "MON";
    dayFound = true;
  } else {
    // Check for specific date formats like "nov 2", "2nd nov", "2026-11-04"
    const dateMatch = lower.match(/(nov|november|dec|december)\s*(\d{1,2})|(\d{1,2})(?:st|nd|rd|th)?\s*(nov|november)/);
    if (dateMatch) {
      const dateNum = parseInt(dateMatch[2] || dateMatch[3], 10);
      // Map to November 2026 festival week (Nov 2=MON, Nov 3=TUE, Nov 4=WED, Nov 5=THU, Nov 6=FRI)
      const dayMap: Record<number, string> = { 2: "MON", 3: "TUE", 4: "WED", 5: "THU", 6: "FRI", 9: "MON", 10: "TUE", 11: "WED", 12: "THU", 13: "FRI" };
      if (dayMap[dateNum]) {
        day = dayMap[dateNum];
        dayFound = true;
      }
    }
  }

  if (!dayFound) {
    followUps.push("Target day was not specified; defaulted to THU. Please confirm the intended day.");
  }

  // 6. Extract Start Period & Time (P1=8:00, P2=9:00, P3=10:00, P4=11:00, P5=12:00, P6=14:00 ... P10=18:00)
  let fromPeriod = 10; // default to evening event slot
  let timeFound = false;

  if (lower.includes("shaam 6") || lower.includes("6 to 8") || lower.includes("6 to 9") || lower.includes("6 pm") || lower.includes("18:00")) {
    fromPeriod = 10;
    timeFound = true;
  } else if (lower.includes("7 pm") || lower.includes("19:00")) {
    fromPeriod = 11;
    timeFound = true;
  } else if (lower.includes("8 pm") || lower.includes("20:00")) {
    fromPeriod = 12;
    timeFound = true;
  } else if (lower.includes("9 pm") || lower.includes("21:00")) {
    fromPeriod = 13;
    timeFound = true;
  } else if (lower.includes("5 pm") || lower.includes("17:00")) {
    fromPeriod = 9;
    timeFound = true;
  } else if (lower.includes("4 pm") || lower.includes("16:00")) {
    fromPeriod = 8;
    timeFound = true;
  } else if (lower.includes("3 pm") || lower.includes("15:00")) {
    fromPeriod = 7;
    timeFound = true;
  } else if (lower.includes("2 pm") || lower.includes("14:00") || lower.includes("after lunch") || lower.includes("dopahar")) {
    fromPeriod = 6;
    timeFound = true;
  } else if (lower.includes("11 am") || lower.includes("subah 11")) {
    fromPeriod = 4;
    timeFound = true;
  } else if (lower.includes("10 am") || lower.includes("subah 10")) {
    fromPeriod = 3;
    timeFound = true;
  } else if (lower.includes("9 am") || lower.includes("subah 9")) {
    fromPeriod = 2;
    timeFound = true;
  } else if (lower.includes("8 am") || lower.includes("subah 8")) {
    fromPeriod = 1;
    timeFound = true;
  }

  if (!timeFound) {
    followUps.push("Start time was not specified; defaulted to evening slot P10 (18:00). Please select your preferred period.");
  }

  const toPeriod = Math.min(13, fromPeriod + duration - 1);

  // 7. Extract Required Features / Needs
  const needs: string[] = [];
  if (lower.includes("mic") || lower.includes("pa system") || lower.includes("sound") || lower.includes("speaker")) needs.push("pa_system");
  if (lower.includes("projector") || lower.includes("screen")) needs.push("projector");
  if (lower.includes("stage") || lower.includes("podium")) needs.push("stage");
  if (lower.includes("computer") || lower.includes("coding") || lower.includes("pc")) needs.push("computers");
  if (lower.includes("wheelchair") || lower.includes("accessible") || lower.includes("ramp")) needs.push("accessible");

  // 8. Extract Room Types & Specific Venue
  const roomTypes: string[] = [];
  let requestedRoom: string | null = null;
  let accessibilityWarning: string | null = null;

  if (lower.includes("auditorium") || lower.includes("aud")) {
    roomTypes.push("auditorium");
    requestedRoom = "AUD";
  } else if (lower.includes("open air theatre") || lower.includes("oat")) {
    roomTypes.push("outdoor");
    requestedRoom = "OAT";
  } else if (lower.includes("seminar hall") || lower.includes("sh-1") || lower.includes("sh-2") || lower.includes("sh")) {
    roomTypes.push("seminar_hall");
    if (lower.includes("sh-2")) {
      requestedRoom = "SH-2";
      if (needs.includes("accessible")) {
        accessibilityWarning = "Warning: SH-2 is on the 1st floor with no lift. Ground-floor accessible venue SH-1 is recommended instead.";
        requestedRoom = "SH-1";
      }
    } else {
      requestedRoom = "SH-1";
    }
  } else if (lower.includes("lab") || lower.includes("computer lab") || lower.includes("cs lab")) {
    roomTypes.push("lab_cs");
    requestedRoom = "CS-LAB-1";
  } else if (lower.includes("lecture hall") || lower.includes("lh")) {
    roomTypes.push("lecture_hall");
    if (lower.includes("lh-1")) requestedRoom = "LH-1";
    else if (lower.includes("lh-2")) requestedRoom = "LH-2";
  }

  if (roomTypes.length === 0) {
    roomTypes.push("classroom", "lecture_hall", "seminar_hall", "auditorium");
  }

  // 9. Mandatory Cohorts
  const mandatory: string[] = [];
  if (lower.includes("mechanical third years") || lower.includes("me-3")) mandatory.push("ME-3");
  if (lower.includes("ece-3")) mandatory.push("ECE-3");
  if (lower.includes("cse-3")) mandatory.push("CSE-3");
  if (lower.includes("ce-3")) mandatory.push("CE-3");
  if (lower.includes("ee-3")) mandatory.push("EE-3");

  const combinedFollowUp = followUps.length > 0 ? followUps.join(" ") : null;

  return {
    title,
    category,
    attendance,
    duration_periods: duration,
    day,
    start_period: fromPeriod,
    end_period: toPeriod,
    windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
    needs,
    room_types: roomTypes,
    requested_room: requestedRoom,
    mandatory_for_groups: mandatory,
    follow_up: combinedFollowUp,
    accessibility_warning: accessibilityWarning,
  };
}
