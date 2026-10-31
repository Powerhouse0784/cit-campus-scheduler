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

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Period mapping in CIT Crunch Week:
 * P1: 08:00–09:00
 * P2: 09:00–10:00
 * P3: 10:00–11:00
 * P4: 11:00–12:00
 * P5: 12:00–13:00
 * (13:00–14:00 Lunch)
 * P6: 14:00–15:00
 * P7: 15:00–16:00
 * P8: 16:00–17:00
 * P9: 17:00–18:00
 * P10: 18:00–19:00 (Evening events window begins)
 * P11: 19:00–20:00
 * P12: 20:00–21:00
 * P13: 21:00–22:00 (Campus Curfew Cutoff)
 */
export function hourToPeriod(hour24: number): number {
  if (hour24 <= 8) return 1;
  if (hour24 === 9) return 2;
  if (hour24 === 10) return 3;
  if (hour24 === 11) return 4;
  if (hour24 === 12) return 5;
  if (hour24 === 13) return 6; // lunch transition
  if (hour24 === 14) return 6;
  if (hour24 === 15) return 7;
  if (hour24 === 16) return 8;
  if (hour24 === 17) return 9;
  if (hour24 === 18) return 10;
  if (hour24 === 19) return 11;
  if (hour24 === 20) return 12;
  return 13;
}

/**
 * Natural language parser supporting English and Hinglish expressions,
 * dynamic real calendar dates, relative days (aaj, kal, parso), time ranges,
 * period numbers, and facility requirements.
 */
export function parseHinglishOrEnglishRequest(
  text: string,
  referenceDate?: Date
): ParsedBookingIntent {
  const lower = text.toLowerCase();
  const followUps: string[] = [];
  const ref = referenceDate ? new Date(referenceDate) : new Date();

  // 1. Title Extraction
  let title = "Campus Event";
  if (lower.includes("hackathon") || lower.includes("coding contest") || lower.includes("coding competition")) title = "Coding Hackathon";
  else if (lower.includes("quiz")) title = "Campus Quiz Competition";
  else if (lower.includes("dance") || lower.includes("rehearsal")) title = "Dance & Cultural Rehearsal";
  else if (lower.includes("guest lecture") || lower.includes("industry speaker") || lower.includes("speaker") || lower.includes("keynote")) title = "Distinguished Guest Lecture";
  else if (lower.includes("workshop")) title = "Technical Workshop";
  else if (lower.includes("inauguration") || lower.includes("opening")) title = "Opening & Inaugural Ceremony";
  else if (lower.includes("farewell")) title = "Department Farewell";
  else if (lower.includes("jam") || lower.includes("concert") || lower.includes("music")) title = "Music & Jam Night";
  else if (lower.includes("poster") || lower.includes("exhibition")) title = "Poster Session & Exhibition";
  else if (lower.includes("robo")) title = "Robo-Wars Battle Arena";

  // 2. Category Extraction
  let category: "institute_event" | "guest_lecture" | "department_event" | "club_event" = "club_event";
  if (lower.includes("inauguration") || lower.includes("closing ceremony") || lower.includes("convocation") || lower.includes("institute main event") || lower.includes("annual day")) {
    category = "institute_event";
  } else if (lower.includes("guest lecture") || lower.includes("distinguished talk") || lower.includes("keynote") || lower.includes("industry speaker")) {
    category = "guest_lecture";
  } else if (lower.includes("department") || lower.includes("pre-placement") || lower.includes("faculty meeting") || lower.includes("farewell")) {
    category = "department_event";
  }

  // 3. Attendance Extraction
  let attendance = 50;
  let attendanceFound = false;

  // Check explicit unit matches first: "100 log", "45 people", "60 participants", "around 400"
  const unitMatch = lower.match(/(?:around|about|maybe|for)?\s*(\d+)\s*(people|students|participants|log|audience|seats|attendance|members|candidates|persons)\b/);
  if (unitMatch && parseInt(unitMatch[1], 10) > 0) {
    attendance = parseInt(unitMatch[1], 10);
    attendanceFound = true;
  } else {
    // Check "around 400", "about 60", "maybe 150"
    const prefixMatch = lower.match(/\b(?:around|about|maybe)\s+(\d+)\b/);
    if (prefixMatch && parseInt(prefixMatch[1], 10) > 0) {
      attendance = parseInt(prefixMatch[1], 10);
      attendanceFound = true;
    } else {
      // Look for standalone numbers that are not hours, dates, or period numbers
      const allNumbers = lower.match(/\b\d+\b/g);
      if (allNumbers) {
        for (const numStr of allNumbers) {
          const val = parseInt(numStr, 10);
          if (val >= 1900 && val <= 2100) continue; // Skip year
          // Check if followed by pm, am, baje, hr, hour, ghante, period, st, nd, rd, th
          const pattern = new RegExp(`\\b${val}\\s*(?:pm|am|baje|hr|hrs|hour|hours|ghante|ghanta|period|periods|st|nd|rd|th|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\b`, "i");
          if (pattern.test(lower)) continue;
          if (val > 10) {
            attendance = val;
            attendanceFound = true;
            break;
          }
        }
      }
    }
  }

  if (!attendanceFound && !lower.includes("50")) {
    followUps.push("Estimated attendance was not specified; defaulted to 50. What is your estimated audience size?");
  }

  // 4. Time & Duration Parsing
  let fromPeriod = 10; // default evening event slot
  let timeFound = false;
  let duration = 2;
  let durationFound = false;

  // Check for time ranges like "6 to 8 pm", "10 am to 12 pm", "2 - 5 pm", "18:00 to 20:00", "7 to 8 pm"
  const rangeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|se|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (rangeMatch) {
    let startH = parseInt(rangeMatch[1], 10);
    const startAmPm = rangeMatch[3]?.toLowerCase();
    let endH = parseInt(rangeMatch[4], 10);
    const endAmPm = rangeMatch[6]?.toLowerCase();

    if (endAmPm === "pm" && endH < 12) endH += 12;
    if (startAmPm === "pm" && startH < 12) startH += 12;
    else if (!startAmPm && endAmPm === "pm" && startH <= 12) {
      if (startH < 8) startH += 12; // e.g. "6 to 8 pm" -> 18 to 20
    }

    fromPeriod = hourToPeriod(startH);
    timeFound = true;
    const computedDur = Math.max(1, endH - startH);
    duration = Math.min(6, computedDur);
    durationFound = true;
  }

  // If duration was not found from range, check explicit duration expressions
  if (!durationFound) {
    const durMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|ghante|ghanta|periods?)\b/);
    if (durMatch) {
      const parsedDur = parseFloat(durMatch[1]);
      duration = Math.max(1, Math.min(6, Math.round(parsedDur)));
      durationFound = true;
    } else if (lower.includes("half an hour") || lower.includes("aadha ghanta")) {
      duration = 1;
      durationFound = true;
    } else if (lower.includes("dedh ghanta") || lower.includes("1.5 hr") || lower.includes("1.5 hours")) {
      duration = 2;
      durationFound = true;
    }
  }

  // If start period not found from range, check standalone period mentions ("p10", "period 4", "slot 6")
  if (!timeFound) {
    const periodMatch = lower.match(/\b(?:p|period|slot)\s*(\d{1,2})\b/);
    if (periodMatch) {
      const pNum = parseInt(periodMatch[1], 10);
      if (pNum >= 1 && pNum <= 13) {
        fromPeriod = pNum;
        timeFound = true;
      }
    }
  }

  // If start period not found, check clock times: "6 pm", "6:00 pm", "18:00", "shaam 6 baje", "10 am", "subah 10"
  if (!timeFound) {
    const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const ampm = timeMatch[3].toLowerCase();
      if (ampm === "pm" && h < 12) h += 12;
      else if (ampm === "am" && h === 12) h = 0;
      fromPeriod = hourToPeriod(h);
      timeFound = true;
    } else {
      const bajeMatch = lower.match(/\b(\d{1,2})\s*baje\b/);
      if (bajeMatch) {
        let h = parseInt(bajeMatch[1], 10);
        if (lower.includes("shaam") || lower.includes("raat")) {
          if (h < 12) h += 12;
        } else if (lower.includes("dopahar") && h < 12 && h !== 12) {
          h += 12;
        }
        fromPeriod = hourToPeriod(h);
        timeFound = true;
      }
    }
  }

  // Colloquial expressions
  if (!timeFound) {
    if (lower.includes("after lunch") || lower.includes("afternoon")) {
      fromPeriod = 6;
      timeFound = true;
    } else if (lower.includes("evening") || lower.includes("shaam")) {
      fromPeriod = 10;
      timeFound = true;
    } else if (lower.includes("morning") || lower.includes("subah")) {
      fromPeriod = 2;
      timeFound = true;
    }
  }

  if (!durationFound) {
    followUps.push("Duration was not specified; defaulted to 2 periods. How many hours do you need?");
  }
  if (!timeFound) {
    followUps.push("Start time was not specified; defaulted to evening slot P10 (18:00). Please select your preferred period.");
  }

  const toPeriod = Math.min(13, fromPeriod + duration - 1);

  // 5. Robust Date & Day Parsing (Supports days, Hindi terms, relative days, real calendar dates)
  let day = "THU";
  let dayFound = false;

  const resolveCampusWeekday = (d: Date): string => {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      return "MON"; // Default weekend requests to next teaching week
    }
    return WEEKDAY_NAMES[dow];
  };

  // A. Check for explicit weekdays in English or Hindi
  if (lower.includes("monday") || lower.includes("somwar") || lower.includes("somvaar") || /\bmon\b/.test(lower)) {
    day = "MON";
    dayFound = true;
  } else if (lower.includes("tuesday") || lower.includes("mangalwar") || lower.includes("mangalvaar") || /\btue\b/.test(lower)) {
    day = "TUE";
    dayFound = true;
  } else if (lower.includes("wednesday") || lower.includes("budhwar") || lower.includes("budhvaar") || /\bwed\b/.test(lower)) {
    day = "WED";
    dayFound = true;
  } else if (lower.includes("thursday") || lower.includes("guruwar") || lower.includes("brihaspatiwar") || lower.includes("veervar") || /\bthu\b/.test(lower)) {
    day = "THU";
    dayFound = true;
  } else if (lower.includes("friday") || lower.includes("shukrawar") || lower.includes("shukravaar") || /\bfri\b/.test(lower)) {
    day = "FRI";
    dayFound = true;
  }

  // B. Check relative days dynamically from reference calendar date
  if (!dayFound) {
    if (lower.includes("tarso")) {
      const tarso = new Date(ref);
      tarso.setDate(tarso.getDate() + 3);
      day = resolveCampusWeekday(tarso);
      dayFound = true;
    } else if (lower.includes("parso") || lower.includes("day after tomorrow")) {
      const parso = new Date(ref);
      parso.setDate(parso.getDate() + 2);
      day = resolveCampusWeekday(parso);
      dayFound = true;
    } else if (lower.includes("kal") || lower.includes("tomorrow")) {
      const kal = new Date(ref);
      kal.setDate(kal.getDate() + 1);
      day = resolveCampusWeekday(kal);
      dayFound = true;
    } else if (lower.includes("aaj") || lower.includes("today")) {
      day = resolveCampusWeekday(ref);
      dayFound = true;
    }
  }

  // C. Check real calendar dates (ISO "YYYY-MM-DD", "DD/MM/YYYY", "Nov 4", "4th November", etc.)
  if (!dayFound) {
    // 1. ISO format: 2026-11-04
    const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      const parsedDate = new Date(y, m, d);
      if (!isNaN(parsedDate.getTime())) {
        day = resolveCampusWeekday(parsedDate);
        dayFound = true;
      }
    }
  }

  if (!dayFound) {
    // 2. Slash or Dash: 04/11/2026 or 04-11-2026
    const slashMatch = lower.match(/\b(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?\b/);
    if (slashMatch) {
      const d = parseInt(slashMatch[1], 10);
      const m = parseInt(slashMatch[2], 10) - 1;
      const y = slashMatch[3] ? (slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3], 10) : parseInt(slashMatch[3], 10)) : ref.getFullYear();
      const parsedDate = new Date(y, m, d);
      if (!isNaN(parsedDate.getTime())) {
        day = resolveCampusWeekday(parsedDate);
        dayFound = true;
      }
    }
  }

  if (!dayFound) {
    // 3. Textual Month & Day: "nov 4", "4th november", "november 6th", "2 dec"
    const textDateMatch = lower.match(
      /\b(?:(\d{1,2})(?:st|nd|rd|th)?\s+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(\d{1,2})(?:st|nd|rd|th)?)?(?:,?\s*(\d{4}))?\b/
    );
    if (textDateMatch) {
      const d = parseInt(textDateMatch[1] || textDateMatch[3] || "1", 10);
      const monthStr = textDateMatch[2];
      const m = MONTH_NAMES[monthStr];
      const y = textDateMatch[4] ? parseInt(textDateMatch[4], 10) : (ref.getFullYear() || 2026);
      if (m !== undefined) {
        const parsedDate = new Date(y, m, d);
        if (!isNaN(parsedDate.getTime())) {
          day = resolveCampusWeekday(parsedDate);
          dayFound = true;
        }
      }
    }
  }

  if (!dayFound) {
    followUps.push("Target day was not specified; defaulted to THU. Please confirm the intended day.");
  }

  // 6. Required Features / Needs
  const needs: string[] = [];
  if (lower.includes("mic") || lower.includes("pa system") || lower.includes("sound") || lower.includes("speaker")) needs.push("pa_system");
  if (lower.includes("projector") || lower.includes("screen")) needs.push("projector");
  if (lower.includes("stage") || lower.includes("podium")) needs.push("stage");
  if (lower.includes("computer") || lower.includes("coding") || lower.includes("pc") || lower.includes("lab with computers")) needs.push("computers");
  if (lower.includes("wheelchair") || lower.includes("accessible") || lower.includes("ramp")) needs.push("accessible");

  // 7. Room Types & Specific Venue
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

  // 8. Mandatory Cohorts
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
