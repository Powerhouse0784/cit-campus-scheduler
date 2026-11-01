# Next steps and verification status

## Latest update
- The timetable API now loads the active dataset and schedule through the durable-state adapter, so it does not rely on a stale module-level filesystem cache.
- The dashboard analytics no longer claims a schedule is certified or optimal using hard-coded demo numbers. Without a validator report it explicitly reports that the schedule is not verified.
- `package.json` now pins Next.js to `14.2.15`, matching the checked-in lockfile version.
- Keep `.env.local` on your own machine only. Do not commit or include secret keys in ZIP files.

## Verification
- Bundled baseline and disruption schedules were validated previously with zero hard-constraint violations.
- ZIP integrity and exclusion of `.env*` files must be checked after each package refresh.
- A fresh TypeScript check, production build, and live Supabase read/write test have not yet been confirmed in this environment. Run `npm ci`, `npm run typecheck`, and `npm run build` locally and address any reported errors before production use.
- Demo login accounts in `lib/auth-session.ts` are sample credentials; replace this demo authentication with a production identity provider before exposing the app publicly.


## Latest AI assistant reliability pass
- AI assistant now reads dataset, active schedule, and validation report through the durable-state adapter rather than directly from local JSON files.
- Conflict queries no longer claim a fixed number of sessions, rooms, bookings, or certified zero-conflict status. They report saved validation evidence when present and clearly state when validation is missing.
- Timetable query now maps session IDs to dataset session metadata before resolving course names, and avoids presenting schedule entries as validated without evidence.
- AI assistant prompt is capped at 2,000 characters; rescheduling requests fail clearly if durable dataset/schedule is unavailable.
- These changes are source-reviewed; full TypeScript/build and live Supabase tests remain unverified until dependencies and deployment secrets are available.

## Latest phase: analytics and assistant accuracy
- Reworked `/api/cit/stats` to read the active dataset, schedule, and validation report through the durable-state adapter rather than a synchronous filesystem singleton. Metrics now reflect the currently loaded schedule.
- Analytics explicitly marks validation-report freshness as unconfirmed, because the current persisted report does not carry a verified schedule hash.
- AI timetable responses no longer claim zero clashes without validation. Solver output is labelled a proposal and clearly discloses the demo assumption (faculty F01) pending robust natural-language faculty identification.
- ZIP excludes all `.env*` files. TypeScript/build and live Supabase integration remain to be verified in an environment with dependencies and credentials.

## Latest phase: safer rescheduling publication
- Tightened the rescheduling publish gate: a proposal now needs `solver_success === true` and an explicit validation report with exactly zero hard violations plus the solver's clean-validation status. Missing or incomplete validation metadata is rejected instead of passing through an undefined `hard_violations` value.
- Re-ran the bundled schedule validator: baseline hard violations 0, soft penalty 13; disruption hard violations 0, soft penalty 15, with 11 sessions moved (room-only).
- Rebuilt the ZIP and verified archive integrity; no `.env` or `.env.*` files are present.
- TypeScript/build and live Supabase integration are still not verified in this environment.

## Latest phase: booking workflow hardening
- Booking submission now validates title length, attendance bounds, weekday, period range, and duration instead of silently coercing malformed values into defaults.
- User-created booking IDs use UUIDs rather than a four-digit timestamp suffix, avoiding easy collisions under concurrent submissions.
- Booking records store the authenticated session ID; cancellation and self-approval checks use that stable identity where available, with legacy-name fallback for older records.
- Approval rechecks current room/time availability immediately before changing a pending booking to approved and returns HTTP 409 plus conflict/alternative details if availability has changed.
- Baseline and disruption validators still pass with zero hard violations (soft penalties 13 and 15 respectively).
- `tsc --noEmit` was attempted, but the checkout has no `node_modules`; reported failures are dominated by missing Next.js/React/Node type packages. A real typecheck/build remains unverified until dependencies can be installed.

## Atomic booking concurrency phase (2026-11-01)

- Added `supabase/migrations/202611010002_atomic_booking_workflow.sql` with transactional RPCs that lock schedule and user-booking state in a consistent order.
- Booking submissions now atomically append to the queue and reject duplicate IDs or room/day/period overlaps with pending/approved user bookings and approved/scheduled fest-week bookings.
- Approval and cancellation now use a single database transaction to compare the expected status, transition the booking, and mirror its state into the schedule record. Approval performs a second overlap check inside the transaction, reducing TOCTOU races.
- Supabase production workflow requires applying both migration files. Local JSON fallback is intended only for development and cannot guarantee cross-process atomicity.
- Verification: static source checks and schedule validator can be run locally; live Supabase RPC execution and TypeScript/build remain unverified in this environment without configured credentials/dependencies.

## Next phase — booking workflow integration test assets (2026-11-01)

- Added `supabase/tests/atomic_booking_workflow.sql`, a rollback-only Supabase SQL Editor smoke test for overlapping-slot rejection, approval, stale-status rejection, cancellation, and synchronization of booking/schedule state.
- Added `supabase/tests/README.md` with execution steps and the remaining requirement for a true parallel-request test against staging.
- Re-ran the Python schedule validators: baseline hard violations = 0; disruption hard violations = 0; disruption stability = 11 sessions moved (0 time changes, 11 room-only changes).
- Verification limitations: `node_modules` is absent, `psql` is unavailable in this environment, so the Next.js TypeScript/build and SQL smoke test have not been executed here. The SQL test must be run in the configured Supabase SQL Editor after both migrations are applied.
