# Supabase durable-state write troubleshooting

This update improves server-side Supabase credential selection and exposes the REST API error body in server logs/API error handling. It does not disable Row Level Security.

## Required server-only environment variables

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` containing the project's actual Supabase **secret** API key (`sb_secret_...`), OR `SUPABASE_SERVICE_ROLE_KEY` containing the legacy service-role JWT.

If both are set, the legacy `SUPABASE_SERVICE_ROLE_KEY` is preferred. Do not use a publishable/anon key as either privileged variable, and never expose secret/service-role keys via `NEXT_PUBLIC_*` variables or client-side code. Restart `npm run dev` after editing `.env`.

## If `/api/cit/reset` still returns 500

Read the Next.js dev-server terminal. The updated handler reports the Supabase response body so the actual PostgREST error is visible. A `new row violates row-level security policy` response generally means the request is not reaching Postgres with a role permitted to write. Confirm the key belongs to the same project as `SUPABASE_URL` and is a real secret/service-role credential. Do not disable RLS globally or add anon write policies as a workaround.

The migration `supabase/migrations/202611010001_cit_app_state.sql` intentionally creates no anon/authenticated write policies; privileged server-side access is required.
