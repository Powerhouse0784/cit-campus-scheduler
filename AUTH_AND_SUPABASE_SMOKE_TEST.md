# Auth + Supabase integration smoke test

This checklist separates checks that can run without project credentials from checks that require your own Supabase project. The demo accounts are for local/hackathon evaluation only; they are not a production identity provider.

## 1. Configure locally

1. Copy `.env.example` to `.env.local`.
2. Set `CIT_AUTH_SECRET` to a random secret with at least 32 characters. Do not commit `.env.local` or paste its values into chat.
3. For persistent storage, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`. Keep the key server-side; never prefix it with `NEXT_PUBLIC_`.
4. In the Supabase SQL Editor, run migrations in order:
   - `supabase/migrations/202611010001_cit_app_state.sql`
   - `supabase/migrations/202611010002_atomic_booking_workflow.sql`
5. Start the app with `npm ci` and `npm run dev`.

## 2. Verify login/session in PowerShell

Run from a separate PowerShell terminal while the app is running on `http://localhost:3000`:

```powershell
# Valid credentials should return success and set the httpOnly cit_auth_token cookie.
curl.exe -i -c cit-cookies.txt -H "Content-Type: application/json" -d '{"email":"admin@cit.edu","password":"CITAdmin2024!"}' http://localhost:3000/api/cit/auth/login

# The session endpoint should report isAuthenticated=true and role=admin.
curl.exe -i -b cit-cookies.txt http://localhost:3000/api/cit/auth/session

# Invalid credentials must return HTTP 401.
curl.exe -i -H "Content-Type: application/json" -d '{"email":"admin@cit.edu","password":"wrong-password"}' http://localhost:3000/api/cit/auth/login

# Logout should expire the session cookie.
curl.exe -i -b cit-cookies.txt -X DELETE http://localhost:3000/api/cit/auth/session
curl.exe -i -b cit-cookies.txt http://localhost:3000/api/cit/auth/session
```

Repeat login with the coordinator, faculty, and club demo accounts documented in `README.md`; verify each session returns the expected role. Do not treat a client-supplied role name as proof of authentication.

## 3. Verify role restrictions

- Without a cookie, call a state-changing endpoint such as `POST /api/cit/reset`; it must be rejected.
- Login as faculty or club representative and attempt the same admin-only endpoint; it must return HTTP 403.
- Login as admin and use the demo reset action only against a disposable local/demo dataset.
- Confirm the UI shows **Reset Demo Data** only to the admin role. UI visibility is not a security boundary; the API role check must reject unauthorized requests independently.

## 4. Verify Supabase persistence

1. With Supabase env vars set, create a normal booking through the app.
2. In Supabase SQL Editor, inspect the persisted booking and schedule keys. The application uses `public.cit_app_state`; exact keys are file basenames such as `user_bookings.json` and `schedule.json`.
3. Approve and then cancel a test booking. Confirm both the booking record and the schedule mirror reflect the same status.
4. Restart the app and confirm the state remains present.
5. Run `supabase/tests/atomic_booking_workflow.sql` in the SQL Editor after both migrations are applied. It is a rollback-only smoke test using `__cit_test_*` keys.
6. For a production-like check, run two simultaneous overlapping booking requests against a disposable staging project and confirm at most one succeeds. The SQL smoke test is not a substitute for this concurrency test.

## 5. Local checks

From the repository root:

```bash
node scripts/verify-release.mjs
python validator.py --data data/cit_public.json --schedule exports/schedule.json
python validator.py --data data/cit_public.json --schedule exports/schedule_after.json --disruption data/sample_disruption.json --baseline exports/schedule.json
npm run typecheck
npm run build
```

A successful static release check or schedule validator does **not** prove live authentication or Supabase persistence. Record the actual output of the login/session checks and SQL smoke test before claiming those integrations are verified.

## Current environment limitation

Live Supabase checks require credentials for a Supabase project and the migrations to be applied there. Never place real credentials in the ZIP or source control. If dependencies are incomplete, run `npm ci` in an environment with registry access before the TypeScript check and production build.
