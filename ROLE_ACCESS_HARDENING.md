# Role access hardening — 2026-11-01

## Changes

- `GET /api/cit/bookings` now requires an authenticated campus role (`admin`, `department_coordinator`, `faculty`, or `club`). This endpoint returns booking requests and requester details, so it should not be anonymously enumerable.
- `GET /api/cit/disruption` now requires a scheduler role (`admin` or `department_coordinator`) because it exposes the baseline and proposed timetable revision.
- `npm run verify:release` checks both read-route guards in addition to the existing schedule, disruption, booking-transaction, and required-file checks.

## Validation

- `node scripts/verify-release.mjs`: 20/20 checks passed.
- Baseline schedule: 0 hard violations, soft penalty 13.
- Sample disruption schedule: 0 hard violations, soft penalty 15; 11 sessions moved, all room-only.

## Limitations

These are source-level and dataset-validator checks. They do not replace testing authenticated HTTP requests against a running deployment, nor do they establish that Supabase migrations have been applied. Run `npm ci`, `npm run typecheck`, `npm run build`, and test with demo accounts before deploying.


## Frontend least-privilege follow-up (2026-11-01)

- The application now starts in the `student` role until the server session is loaded, rather than briefly rendering Admin controls by default.
- The Reset Demo Data menu item is rendered only for the Admin role. The server-side Admin guard remains authoritative; hiding the button is not a substitute for API authorization.
- Verification limitation: local `npm run typecheck` could not complete because the mounted `node_modules` type packages were incomplete; `npm ci` timed out in this environment. Re-run `npm ci`, `npm run typecheck`, and `npm run build` locally before deployment.
