import fs from "fs";
import path from "path";

const REST_TABLE = "cit_app_state";
function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  // Prefer the current Supabase secret key. The legacy service_role key remains
  // supported for existing deployments, but must never be exposed to a browser.
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = secretKey || legacyServiceRoleKey;
  if (!url || !key) return null;
  return {
    url,
    key,
    // New sb_secret_* keys are API keys, not JWTs; do not send them as Bearer JWTs.
    headers: secretKey
      ? { apikey: secretKey }
      : { apikey: legacyServiceRoleKey!, Authorization: `Bearer ${legacyServiceRoleKey}` },
  };
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
    if (!response.ok) throw new Error(`Persistent storage write failed (${response.status}).`);
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
    if (!response.ok) throw new Error(`Persistent storage delete failed (${response.status}).`);
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Persistent storage is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY).");
  }
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    throw new Error(`Local state delete failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
