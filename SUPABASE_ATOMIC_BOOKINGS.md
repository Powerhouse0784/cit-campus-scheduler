# Supabase setup for atomic booking workflow

The booking API now uses PostgreSQL RPC functions for atomic booking submission, approval, and cancellation. This protects against lost booking-array updates and serializes room/time reservations when requests hit the same Supabase database.

## Apply migrations

In the Supabase Dashboard, open **SQL Editor** and run these files in order:

1. `supabase/migrations/202611010001_cit_app_state.sql`
2. `supabase/migrations/202611010002_atomic_booking_workflow.sql`

The second migration creates `cit_submit_booking` and `cit_transition_booking`, with execute permission restricted to the server-side `service_role`.

## Server environment

Configure these only in server-side deployment environment variables (or local `.env.local`, which must not be committed or included in a ZIP):

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (preferred), or the legacy `SUPABASE_SERVICE_ROLE_KEY`

Never use the secret/service-role key in a `NEXT_PUBLIC_*` variable or browser code. If a deployment returns an RPC error after applying the migration, confirm the SQL completed successfully and allow PostgREST schema cache to refresh before retrying.

## Concurrency scope and limitations

- Submit locks the schedule and booking-state rows, rejects duplicate request IDs, and checks overlapping room/day/period reservations against pending/approved user bookings and approved/scheduled fest-week bookings.
- Approval checks the expected status and rechecks conflicts in the same transaction that updates the booking and schedule.
- Cancellation checks the expected status and mirrors the cancellation to both records in one transaction.
- The local JSON fallback is for development only and is not cross-process atomic. Use configured Supabase for production concurrency guarantees.
- Other APIs that replace the entire schedule document can still race with booking workflow updates; future hardening should move all schedule mutations behind database RPCs or normalized relational tables.
