# Supabase booking workflow smoke test

1. Apply `202611010001_cit_app_state.sql` and `202611010002_atomic_booking_workflow.sql`.
2. Open Supabase SQL Editor using a database owner/admin session.
3. Run `atomic_booking_workflow.sql`.
4. A successful run completes without an exception. The script uses isolated test keys and rolls back its test data.

This smoke test verifies overlap rejection, valid approval, stale-status rejection, cancellation, and synchronization of the booking list with the schedule mirror. It does **not** prove concurrent multi-session behavior; run a separate parallel-request test against a staging project before production.
