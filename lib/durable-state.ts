import fs from "fs";
import path from "path";
import { safeWriteJson, safeReadJson } from "@/lib/storage";

const REST_TABLE = "cit_app_state";
function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  // Prefer the legacy service-role JWT when explicitly configured. New sb_secret_*
  // keys are API keys (not JWTs), so they are sent as apikey only.
  const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const key = legacyServiceRoleKey || secretKey;
  if (!url || !key) return null;
  return {
    url,
    headers: legacyServiceRoleKey
      ? { apikey: legacyServiceRoleKey, Authorization: `Bearer ${legacyServiceRoleKey}` }
      : { apikey: secretKey! },
  };
}

async function responseError(operation: string, response: Response): Promise<Error> {
  let detail = "";
  try {
    detail = (await response.text()).slice(0, 1200);
  } catch {
    // Keep the status as the useful minimum diagnostic.
  }
  return new Error(`${operation} failed (${response.status})${detail ? `: ${detail}` : "."}`);
}
function stateKey(filePath: string) {
  // Keep keys stable across local paths and serverless deployments.
  return path.basename(filePath);
}

/** Read persistent state from Supabase when configured; local JSON is the development fallback. */
export async function readDurableJson<T>(filePath: string, fallback: T): Promise<T> {
  const cfg = config();
  if (cfg) {
    try {
      const url = `${cfg.url}/rest/v1/${REST_TABLE}?state_key=eq.${encodeURIComponent(stateKey(filePath))}&select=state_value`;
      const response = await fetch(url, { headers: cfg.headers, cache: "no-store" });
      if (!response.ok) throw new Error(`Supabase read failed (${response.status})`);
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length) return rows[0].state_value as T;
    } catch (error) {
      console.error("Durable state read failed; using local fallback only in development.", error);
      if (process.env.NODE_ENV === "production") throw new Error("Persistent storage is unavailable.");
    }
  }
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.error("Local state read failed", error);
  }
  return fallback;
}

/** Persist state to Supabase and mirror locally for development. Never silently reports a production write as successful. */
export async function writeDurableJson(filePath: string, value: unknown): Promise<void> {
  const cfg = config();
  if (cfg) {
    const response = await fetch(`${cfg.url}/rest/v1/${REST_TABLE}?on_conflict=state_key`, {
      method: "POST",
      headers: {
        ...cfg.headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ state_key: stateKey(filePath), state_value: value, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) throw await responseError("Persistent storage write", response);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Persistent storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY).");
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}


/** Remove a durable state record from Supabase or the local development store. */
export async function deleteDurableJson(filePath: string): Promise<void> {
  const cfg = config();
  if (cfg) {
    const url = `${cfg.url}/rest/v1/${REST_TABLE}?state_key=eq.${encodeURIComponent(stateKey(filePath))}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: { ...cfg.headers, Prefer: "return=minimal" },
      cache: "no-store",
    });
    if (!response.ok) throw await responseError("Persistent storage delete", response);
    return;
  }
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    // Non-fatal if file doesn't exist
  }
}

export type AtomicBookingResult = {
  success: boolean;
  booking?: any;
  error?: string;
  conflict?: any;
  status_code?: number;
  current_status?: string;
};

async function callBookingRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Atomic booking operations require configured Supabase storage in production.");
  const response = await fetch(`${cfg.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { ...cfg.headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await responseError("Atomic booking operation", response);
  return response.json() as Promise<T>;
}

/** Atomically reserves a booking in Supabase, serializing concurrent room/time submissions. */
export async function submitBookingAtomically(
  booking: Record<string, any>,
  bookingsPath: string,
  schedulePath: string,
): Promise<AtomicBookingResult> {
  if (config()) {
    return callBookingRpc<AtomicBookingResult>("cit_submit_booking", {
      p_booking: booking,
      p_bookings_key: stateKey(bookingsPath),
      p_schedule_key: stateKey(schedulePath),
    });
  }
  if (process.env.NODE_ENV === "production") throw new Error("Atomic booking operations require Supabase RPC configuration.");
  const bookings = await readDurableJson<any[]>(bookingsPath, []);
  const schedule = await readDurableJson<any>(schedulePath, {});
  if (bookings.some((item) => item.request_id === booking.request_id)) return { success: false, error: "Booking request already exists." };
  if (["pending", "approved"].includes(String(booking.status))) {
    const busy = [
      ...(schedule.fest_week?.bookings || []).filter((item: any) => ["approved", "scheduled"].includes(item.status)),
      ...bookings.filter((item: any) => ["pending", "approved"].includes(item.status)),
    ];
    const conflict = busy.find((item: any) => item.room_id === booking.room_id && item.day === booking.day &&
      Number(item.start_period) <= Number(booking.end_period) && Number(item.end_period) >= Number(booking.start_period));
    if (conflict) return { success: false, error: "Room/time slot was reserved by another request.", conflict };
  }
  await writeDurableJson(bookingsPath, [booking, ...bookings]);
  return { success: true, booking };
}

/** Atomically transitions a booking and mirrors its status into the schedule in Supabase. */
export async function transitionBookingAtomically(
  requestId: string,
  expectedStatus: string,
  newStatus: "approved" | "cancelled",
  reason: string,
  bookingsPath: string,
  schedulePath: string,
): Promise<AtomicBookingResult> {
  if (config()) {
    return callBookingRpc<AtomicBookingResult>("cit_transition_booking", {
      p_request_id: requestId,
      p_expected_status: expectedStatus,
      p_new_status: newStatus,
      p_reason: reason,
      p_bookings_key: stateKey(bookingsPath),
      p_schedule_key: stateKey(schedulePath),
    });
  }
  if (process.env.NODE_ENV === "production") throw new Error("Atomic booking operations require Supabase RPC configuration.");
  const bookings = await readDurableJson<any[]>(bookingsPath, []);
  const schedule = await readDurableJson<any>(schedulePath, {});
  const target = bookings.find((item) => item.request_id === requestId);
  if (!target) return { success: false, error: "Booking not found.", status_code: 404 };
  if (target.status !== expectedStatus) return { success: false, error: "Booking status changed; refresh and retry.", status_code: 409, current_status: target.status };
  if (newStatus === "approved") {
    const busy = [
      ...(schedule.fest_week?.bookings || []).filter((item: any) => ["approved", "scheduled"].includes(item.status)),
      ...bookings.filter((item: any) => item.request_id !== requestId && ["pending", "approved"].includes(item.status)),
    ];
    const conflict = busy.find((item: any) => item.room_id === target.room_id && item.day === target.day &&
      Number(item.start_period) <= Number(target.end_period) && Number(item.end_period) >= Number(target.start_period));
    if (conflict) return { success: false, error: "Room/time slot was reserved by another request.", conflict, status_code: 409 };
  }
  const updated = { ...target, status: newStatus, reason };
  await writeDurableJson(bookingsPath, bookings.map((item) => item.request_id === requestId ? updated : item));
  const scheduleBookings = schedule.fest_week?.bookings || [];
  const found = scheduleBookings.some((item: any) => item.request_id === requestId);
  schedule.fest_week = { ...(schedule.fest_week || {}), bookings: found
    ? scheduleBookings.map((item: any) => item.request_id === requestId ? { ...item, status: newStatus, reason } : item)
    : newStatus === "approved" ? [...scheduleBookings, { request_id: requestId, status: newStatus, day: target.day, start_period: target.start_period, end_period: target.end_period, room_id: target.room_id, reason }] : scheduleBookings };
  await writeDurableJson(schedulePath, schedule);
  return { success: true, booking: updated };
}
