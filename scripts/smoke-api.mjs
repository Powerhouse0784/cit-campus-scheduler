#!/usr/bin/env node
/**
 * Live, unauthenticated API smoke checks for the local/deployed app.
 * Usage: npm run smoke:api
 *        BASE_URL=https://your-host.example npm run smoke:api
 */
const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const checks = [
  { name: "session endpoint responds", path: "/api/cit/auth/session", method: "GET", expected: [200] },
  { name: "dataset metadata responds", path: "/api/cit/dataset", method: "GET", expected: [200] },
  { name: "timetable endpoint responds", path: "/api/cit/timetable", method: "GET", expected: [200] },
  { name: "analytics endpoint responds", path: "/api/cit/stats", method: "GET", expected: [200] },
  { name: "schedule endpoint responds", path: "/api/schedule", method: "GET", expected: [200] },
  { name: "booking list requires authentication", path: "/api/cit/bookings", method: "GET", expected: [401, 403] },
  { name: "dataset writes require authorization", path: "/api/cit/dataset", method: "POST", body: {}, expected: [401, 403] },
  { name: "demo reset requires admin authentication", path: "/api/cit/reset", method: "POST", expected: [401, 403] },
];

let failed = 0;
console.log(`API smoke checks against ${baseUrl}`);
for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: check.method,
      headers: check.body ? { "content-type": "application/json" } : undefined,
      body: check.body ? JSON.stringify(check.body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    if (check.expected.includes(response.status)) {
      console.log(`PASS ${check.name} (${response.status})`);
    } else {
      failed += 1;
      const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 180);
      console.error(`FAIL ${check.name}: expected ${check.expected.join(" or ")}, received ${response.status}${detail ? ` — ${detail}` : ""}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${check.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`\nAPI smoke checks: ${checks.length - failed}/${checks.length} passed.`);
if (failed) process.exitCode = 1;
