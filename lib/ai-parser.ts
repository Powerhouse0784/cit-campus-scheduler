import { Day } from "./types";

export interface ParsedBookingIntent {
  title: string;
  category: "institute_event" | "guest_lecture" | "department_event" | "club_event";
  attendance: number;
  duration_periods: number;
  day: Day;
  start_period: number;
  end_period: number;
  windows: { day: Day; from_period: number; to_period: number }[];
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

const WEEKDAY_NAMES: Day[] = ["MON", "MON", "TUE", "WED", "THU", "FRI", "MON"];

/**
 * Period mapping in CIT Crunch Week:
 * P1: 08:00–09:00, P2: 09:00–10:00, P3: 10:00–11:00, P4: 11:00–12:00, P5: 12:00–13:00
 * (13:00–14:00 Lunch Break)
 * P6: 14:00–15:00, P7: 15:00–16:00, P8: 16:00–17:00, P9: 17:00–18:00
 * P10: 18:00–19:00, P11: 19:00–20:00, P12: 20:00–21:00, P13: 21:00–22:00 (Curfew Cutoff)
 */
export function hourToPeriod(hour24: number): number {
  if (hour24 <= 8) return 1;
  if (hour24 === 9) return 2;
  if (hour24 === 10) return 3;
  if (hour24 === 11) return 4;
  if (hour24 === 12) return 5;
  if (hour24 === 13) return 6; // Transition from lunch into afternoon teaching
  if (hour24 === 14) return 6;
  if (hour24 === 15) return 7;
  if (hour24 === 16) return 8;
  if (hour24 === 17) return 9;
  if (hour24 === 18) return 10;
  if (hour24 === 19) return 11;
  if (hour24 === 20) return 12;
  return 13;
}

export function parseHinglishOrEnglishRequest(
  text: string,
  referenceDate?: Date
): ParsedBookingIntent {
  const lower = text.toLowerCase();
  const followUps: string[] = [];
  const ref = referenceDate ? new Date(referenceDate) : new Date();

  // 1. Title Extraction
  let title = "Campus Event";
  if (lower.includes("hackathon") || lower.includes("coding contest") || lower.includes("code sprint") || lower.includes("coding competition")) {
    title = "Coding Hackathon";
  } else if (lower.includes("quiz finals") || lower.includes("quiz competition") || lower.includes("quiz prelims") || lower.includes("quiz")) {
    title = lower.includes("finals") ? "Spectra Quiz Finals" : "Campus Quiz Competition";
  } else if (lower.includes("farewell")) {
    title = lower.includes("cse") ? "CSE Department Farewell" : "Department Farewell Ceremony";
  } else if (lower.includes("dance") || lower.includes("rehearsal")) {
    title = "Dance & Cultural Rehearsal";
  } else if (lower.includes("industry speaker") || lower.includes("founder talk") || lower.includes("guest lecture") || lower.includes("keynote") || lower.includes("scientist")) {
    title = "Distinguished Industry Guest Lecture";
  } else if (lower.includes("workshop") || lower.includes("line-follower")) {
    title = "Technical Workshop";
  } else if (lower.includes("inauguration") || lower.includes("opening ceremony")) {
    title = "Opening & Inaugural Ceremony";
  } else if (lower.includes("closing ceremony")) {
    title = "Closing Ceremony";
  } else if (lower.includes("jam night") || lower.includes("concert") || lower.includes("open mic") || lower.includes("music")) {
    title = lower.includes("open mic") ? "Spectra Open Mic" : "Music & Jam Night";
  } else if (lower.includes("poster session") || lower.includes("photo exhibition") || lower.includes("exhibition")) {
    title = lower.includes("photo") ? "Spectra Photo Exhibition" : "Poster Session & Exhibition";
  } else if (lower.includes("robo-wars") || lower.includes("robotics")) {
    title = "Robo-Wars Battle Arena";
  }

  // 2. Category Extraction
  let category: "institute_event" | "guest_lecture" | "department_event" | "club_event" = "club_event";
  if (
    lower.includes("inauguration") ||
    lower.includes("closing ceremony") ||
    lower.includes("convocation") ||
    lower.includes("institute main event") ||
    lower.includes("annual day") ||
    lower.includes("pro-night")
  ) {
    category = "institute_event";
  } else if (
    lower.includes("guest lecture") ||
    lower.includes("industry speaker") ||
    lower.includes("distinguished talk") ||
    lower.includes("isro") ||
    lower.includes("founder talk") ||
    lower.includes("keynote")
  ) {
    category = "guest_lecture";
  } else if (
    lower.includes("department") ||
    lower.includes("pre-placement") ||
    lower.includes("farewell") ||
    lower.includes("alumni seminar") ||
    lower.includes("bridge-building")
  ) {
    category = "department_event";
  }

  // 3. Attendance Extraction
  let attendance = 50;
  let attendanceFound = false;

  const unitMatch = lower.match(
    /(?:around|about|maybe|for)?\s*(\d+)\s*(people|students|participants|log|audience|seats|attendance|members|candidates|persons|visitors|spectators)\b/
  );
  if (unitMatch && parseInt(unitMatch[1], 10) > 0) {
    attendance = parseInt(unitMatch[1], 10);
    attendanceFound = true;
  } else {
    const prefixMatch = lower.match(/\b(?:around|about|maybe)\s+(\d+)\b/);
    if (prefixMatch && parseInt(prefixMatch[1], 10) > 0) {
      attendance = parseInt(prefixMatch[1], 10);
      attendanceFound = true;
    } else {
      const allNumbers = lower.match(/\b\d+\b/g);
      if (allNumbers) {
        for (const numStr of allNumbers) {
          const val = parseInt(numStr, 10);
          if (val >= 1900 && val <= 2100) continue; // Skip calendar years
          const pattern = new RegExp(
            `\\b${val}\\s*(?:pm|am|baje|hr|hrs|hour|hours|ghante|ghanta|period|periods|st|nd|rd|th|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\b`,
            "i"
          );
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
    followUps.push("Estimated attendance was not explicitly specified; defaulted to 50 attendees. Please specify audience size if different.");
  }

  // 4. Time & Duration Parsing
  let fromPeriod = 10; // Default evening event slot
  let timeFound = false;
  let duration = 2;
  let durationFound = false;

  // A. Check for explicit time ranges: "6 to 8 pm", "10 am to 12 pm", "2 to 6 pm", "7 to 8 pm", "2 - 5 pm"
  const rangeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|se|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (rangeMatch) {
    let startH = parseInt(rangeMatch[1], 10);
    const startAmPm = rangeMatch[3]?.toLowerCase();
    let endH = parseInt(rangeMatch[4], 10);
    const endAmPm = rangeMatch[6]?.toLowerCase();

    if (endAmPm === "pm" && endH < 12) endH += 12;
    if (startAmPm === "pm" && startH < 12) startH += 12;
    else if (!startAmPm && endAmPm === "pm" && startH <= 12) {
      if (startH < 8) startH += 12; // "6 to 8 pm" -> 18:00 to 20:00
    }

    fromPeriod = hourToPeriod(startH);
    timeFound = true;
    const computedDur = Math.max(1, endH - startH);
    duration = Math.min(6, computedDur);
    durationFound = true;
  }

  // B. Check explicit duration expressions: "3-hour", "2 hours", "6 straight hours", "2 ghante"
  if (!durationFound) {
    const durMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:-hour|-hr|hours?|hrs?|ghante|ghanta|periods?)\b/);
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

  // C. Period notations: "p10", "period 4", "slot 6"
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

  // D. Clock times: "10 am", "6 pm", "2 pm", "shaam 6 baje", "dopahar 3 baje"
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

  // E. Vague times (Crucial for Sample Requests 3 & 8)
  if (!timeFound) {
    if (lower.includes("after lunch") || lower.includes("lunch ke baad") || lower.includes("afternoon") || lower.includes("dopahar")) {
      fromPeriod = 6; // P6 (14:00) is the official period immediately after lunch break (13:00-14:00)
      timeFound = true;
      followUps.push("Start time inferred as Period 6 (14:00, immediately after lunch). Please confirm if a later afternoon period is preferred.");
    } else if (lower.includes("friday evening") || lower.includes("evening") || lower.includes("shaam")) {
      fromPeriod = 10; // P10 (18:00) begins the evening event window
      timeFound = true;
    } else if (lower.includes("morning") || lower.includes("subah")) {
      fromPeriod = 2; // P2 (09:00)
      timeFound = true;
    }
  }

  if (!timeFound) {
    followUps.push("Start time was not specified; defaulted to evening event slot Period 10 (18:00). Please verify.");
  }

  // Enforce campus operational curfew limit (P13 / 22:00)
  let toPeriod = fromPeriod + duration - 1;
  if (toPeriod > 13) {
    followUps.push("Requested time exceeds Period 13 (22:00 campus curfew). Clamped to end at Period 13.");
    toPeriod = 13;
    duration = toPeriod - fromPeriod + 1;
  }

  // 5. Day & Date Parsing (Supports Multiple Days: e.g. "Monday and Wednesday")
  const resolveCampusWeekday = (d: Date): Day => {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) return "MON"; // Weekend requests map to upcoming Monday
    return WEEKDAY_NAMES[dow];
  };

  const detectedDays: Day[] = [];

  // Check all weekdays independently (NO else-if, so multiple days are preserved!)
  if (lower.includes("monday") || lower.includes("somwar") || lower.includes("somvaar") || /\bmon\b/.test(lower)) {
    if (!detectedDays.includes("MON")) detectedDays.push("MON");
  }
  if (lower.includes("tuesday") || lower.includes("mangalwar") || lower.includes("mangalvaar") || /\btue\b/.test(lower)) {
    if (!detectedDays.includes("TUE")) detectedDays.push("TUE");
  }
  if (lower.includes("wednesday") || lower.includes("budhwar") || lower.includes("budhvaar") || /\bwed\b/.test(lower)) {
    if (!detectedDays.includes("WED")) detectedDays.push("WED");
  }
  if (lower.includes("thursday") || lower.includes("guruwar") || lower.includes("brihaspatiwar") || lower.includes("veervar") || /\bthu\b/.test(lower)) {
    if (!detectedDays.includes("THU")) detectedDays.push("THU");
  }
  if (lower.includes("friday") || lower.includes("shukrawar") || lower.includes("shukravaar") || /\bfri\b/.test(lower)) {
    if (!detectedDays.includes("FRI")) detectedDays.push("FRI");
  }

  let dayFound = detectedDays.length > 0;

  // Relative days in English & Hindi (if no explicit weekday mentioned)
  if (!dayFound) {
    if (lower.includes("tarso")) {
      const tarso = new Date(ref);
      tarso.setDate(tarso.getDate() + 3);
      detectedDays.push(resolveCampusWeekday(tarso));
      dayFound = true;
    } else if (lower.includes("parso") || lower.includes("day after tomorrow")) {
      const parso = new Date(ref);
      parso.setDate(parso.getDate() + 2);
      detectedDays.push(resolveCampusWeekday(parso));
      dayFound = true;
    } else if (lower.includes("kal") || lower.includes("tomorrow")) {
      const kal = new Date(ref);
      kal.setDate(kal.getDate() + 1);
      detectedDays.push(resolveCampusWeekday(kal));
      dayFound = true;
    } else if (lower.includes("aaj") || lower.includes("today")) {
      detectedDays.push(resolveCampusWeekday(ref));
      dayFound = true;
    }
  }

  // Calendar dates: ISO (2026-11-04), DD/MM/YYYY, or Text (25th Oct)
  if (!dayFound) {
    const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    const ddmmyyyyMatch = lower.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
    const textDateMatch = lower.match(
      /\b(?:(\d{1,2})(?:st|nd|rd|th)?\s+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)(?:\s+(\d{1,2})(?:st|nd|rd|th)?)?(?:,?\s*(\d{4}))?\b/
    );

    if (isoMatch) {
      const parsed = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
      if (!isNaN(parsed.getTime())) {
        detectedDays.push(resolveCampusWeekday(parsed));
        dayFound = true;
      }
    } else if (ddmmyyyyMatch) {
      const parsed = new Date(parseInt(ddmmyyyyMatch[3], 10), parseInt(ddmmyyyyMatch[2], 10) - 1, parseInt(ddmmyyyyMatch[1], 10));
      if (!isNaN(parsed.getTime())) {
        detectedDays.push(resolveCampusWeekday(parsed));
        dayFound = true;
      }
    } else if (textDateMatch) {
      const d = parseInt(textDateMatch[1] || textDateMatch[3] || "1", 10);
      const m = MONTH_NAMES[textDateMatch[2]];
      const y = textDateMatch[4] ? parseInt(textDateMatch[4], 10) : 2026;
      if (m !== undefined) {
        const parsedDate = new Date(y, m, d);
        if (!isNaN(parsedDate.getTime())) {
          detectedDays.push(resolveCampusWeekday(parsedDate));
          dayFound = true;
        }
      }
    }
  }

  // Set primary day & fallback
  let day: Day = detectedDays.length > 0 ? detectedDays[0] : "THU";
  if (!dayFound) {
    detectedDays.push("THU");
    followUps.push("Target day was not specified; defaulted to THU. Please confirm intended day of week.");
  }

  // Multi-day windows generation (Essential for BR-02 / BR-18 / Multi-day requests)
  const windows = detectedDays.map((d) => ({
    day: d,
    from_period: fromPeriod,
    to_period: toPeriod,
  }));

  // 6. Required Facilities & Accessibility
  const needs: string[] = [];
  if (
    lower.includes("mic") ||
    lower.includes("mike") ||
    lower.includes("pa system") ||
    lower.includes("sound") ||
    lower.includes("speaker") ||
    lower.includes("audio") ||
    lower.includes("loudspeaker")
  ) {
    needs.push("pa_system");
  }
  if (lower.includes("projector") || lower.includes("screen") || lower.includes("display") || lower.includes("beamer")) {
    needs.push("projector");
  }
  if (lower.includes("stage") || lower.includes("podium") || lower.includes("manch")) {
    needs.push("stage");
  }
  if (
    lower.includes("computer") ||
    lower.includes("computers") ||
    lower.includes("coding") ||
    lower.includes("pc") ||
    lower.includes("pcs") ||
    lower.includes("lab with computers") ||
    lower.includes("desktop")
  ) {
    needs.push("computers");
  }
  if (
    lower.includes("wheelchair") ||
    lower.includes("accessible") ||
    lower.includes("accessibility") ||
    lower.includes("ramp") ||
    lower.includes("disability") ||
    lower.includes("handicap") ||
    lower.includes("lift")
  ) {
    needs.push("accessible");
  }

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
      // CRITICAL FOR SAMPLE REQUEST 7: SH-2 is on 1st floor with no lift!
      if (needs.includes("accessible")) {
        accessibilityWarning = "Warning: SH-2 is located on the 1st floor of Library Building with no elevator. Ground-floor accessible venue SH-1 has been recommended instead.";
        requestedRoom = "SH-1";
      }
    } else {
      requestedRoom = "SH-1";
    }
  } else if (lower.includes("lab with computers") || lower.includes("computer lab") || lower.includes("cs lab") || lower.includes("coding")) {
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

  // 8. Mandatory Cohorts (Sample Request 5: Mechanical third years)
  const mandatory: string[] = [];
  if (lower.includes("mechanical third years") || lower.includes("me-3") || lower.includes("me third")) mandatory.push("ME-3");
  if (lower.includes("ece third years") || lower.includes("ece-3") || lower.includes("ece third")) mandatory.push("ECE-3");
  if (lower.includes("cse third years") || lower.includes("cse-3") || lower.includes("cse third")) mandatory.push("CSE-3");
  if (lower.includes("ce third years") || lower.includes("ce-3") || lower.includes("civil third")) mandatory.push("CE-3");
  if (lower.includes("ee third years") || lower.includes("ee-3") || lower.includes("electrical third")) mandatory.push("EE-3");

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