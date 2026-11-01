# Spectra API access hardening

## Change

`POST /api/cit/spectra` now verifies that the request has an authenticated campus session before loading request-specific booking details or returning alternatives. An unauthenticated request falls back to the guest/student session and receives HTTP 401.

The existing action-specific role checks remain in place for approval, rejection, and alternative offers. Self-approval checks remain in place.

## Manual verification

1. Call `POST /api/cit/spectra` without `cit_auth_token` and without a valid Bearer token. Expect HTTP 401.
2. Sign in as Club Representative and request `get_alternatives`. Expect a response with availability/conflicts, not a state change.
3. Sign in as Club Representative and try `approve`. Expect HTTP 403.
4. Sign in as Admin or Coordinator and approve a different request. Expect the existing deterministic validation and self-approval checks to run.
5. Try to approve a request created by the same account. Expect HTTP 403.

These are manual verification steps; they are not claimed as executed against a running server or live Supabase project.
