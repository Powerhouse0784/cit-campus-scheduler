# Security and deployment audit notes

## Fixed in this update
- Removed the unauthenticated role-switch path from `POST /api/cit/auth/session`; a role name alone cannot create a session.
- Removed the demo password field from the public `GET /api/cit/auth/login` response.
- Removed the predictable signing-secret fallback in production. `CIT_AUTH_SECRET` must be configured with at least 32 characters or session issuance fails closed.
- Documented the persistence limitations and required production configuration in README and `.env.example`.

## Still required before production/hackathon claims
- Replace JSON/memory/`/tmp` storage with durable shared storage (Supabase/Neon/etc.) and migrate all write paths.
- Run full build/typecheck/official validator and browser smoke tests in the target deployment environment.
- Review all role guards on every mutating API route; UI hiding is not authorization.
- Review rescheduling, analytics, explanations, and dataset/exam flows against actual judge data. Bundled reports and UI labels alone are not proof of live functionality.
- Add real deployment/repository URLs and demo video only after they exist.
