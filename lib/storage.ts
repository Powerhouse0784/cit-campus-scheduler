import fs from "fs";
import path from "path";

/**
 * Universal Serverless Storage & Persistence Adapter
 * 
 * Solves the Vercel read-only filesystem constraint by using a 3-tier strategy:
 * 1. Global in-memory cache (`globalThis.__citMemoryCache`) for instantaneous serverless reads/writes.
 * 2. `/tmp` fallback store for writable serverless ephemeral storage.
 * 3. Local workspace storage for local development & offline hackathon judging.
 */

// Initialize global hot cache
const globalCache = (globalThis as any).__citMemoryCache || new Map<string, string>();
(globalThis as any).__citMemoryCache = globalCache;

export interface PersistedBooking {
  request_id: string;
  title: string;
  requester: string;
  role: string;
  category: string;
  attendance: number;
  day: string;
  start_period: number;
  end_period: number;
  room_id: string;
  room_name?: string;
  status: "approved" | "pending" | "rejected" | "cancelled" | "alternative_offered";
  reason: string;
  submitted_at: string;
  is_user_created?: boolean;
  alternative?: {
    room_id: string;
    day: string;
    start_period: number;
    end_period: number;
  };
}

/**
 * Safely writes a JSON string or object to disk, falling back gracefully to /tmp and memory cache.
 */
export function safeWriteJson(relativeOrAbsolutePath: string, data: any): boolean {
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const cacheKey = path.basename(relativeOrAbsolutePath);
  globalCache.set(cacheKey, jsonStr);

  const rootDir = process.cwd();
  const targetPath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(rootDir, relativeOrAbsolutePath);

  // 1. Try writing to primary target path
  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, jsonStr, "utf-8");
    return true;
  } catch (err: any) {
    // Expected on read-only environments like Vercel
    // console.warn(`Notice: Primary write failed for ${targetPath}: ${err.message}. Using /tmp fallback.`);
  }

  // 2. Fallback to /tmp directory (writable on AWS Lambda / Vercel Serverless)
  try {
    const tmpDir = path.join("/tmp", "cit-scheduler");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpFile = path.join(tmpDir, cacheKey);
    fs.writeFileSync(tmpFile, jsonStr, "utf-8");
    return true;
  } catch (tmpErr) {
    // console.warn(`Notice: /tmp write also unavailable, retained in active memory cache.`);
  }

  return true; // Memory cache succeeded
}

/**
 * Safely reads a JSON file checking: Memory Cache -> Primary File -> /tmp Fallback -> Default Fallback.
 */
export function safeReadJson<T = any>(relativeOrAbsolutePath: string, defaultFallback: T): T {
  const cacheKey = path.basename(relativeOrAbsolutePath);

  // 1. Check memory cache first
  if (globalCache.has(cacheKey)) {
    try {
      return JSON.parse(globalCache.get(cacheKey)!);
    } catch {}
  }

  const rootDir = process.cwd();
  const targetPath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(rootDir, relativeOrAbsolutePath);

  // 2. Check primary disk path
  if (fs.existsSync(targetPath)) {
    try {
      const content = fs.readFileSync(targetPath, "utf-8");
      globalCache.set(cacheKey, content);
      return JSON.parse(content);
    } catch {}
  }

  // 3. Check /tmp fallback path
  const tmpFile = path.join("/tmp", "cit-scheduler", cacheKey);
  if (fs.existsSync(tmpFile)) {
    try {
      const content = fs.readFileSync(tmpFile, "utf-8");
      globalCache.set(cacheKey, content);
      return JSON.parse(content);
    } catch {}
  }

  return defaultFallback;
}
