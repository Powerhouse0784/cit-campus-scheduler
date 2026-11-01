# CIT Campus Scheduler

A Next.js application for campus timetable viewing, room/event booking, Spectra booking workflows, exam planning, schedule validation, and disruption rescheduling. The repository also includes the sample dataset, a deterministic schedule validator, a schedule-generation script, Supabase persistence migration(s), and SQL workflow tests.

## Requirements

- Node.js 20 or newer (Node 18.18+ may work with Next.js 14, but Node 20 LTS is recommended)
- npm
- Python 3.10+ for `validator.py`
- A Supabase project for persistent production state and atomic booking RPCs

## Run locally

1. Extract the project and open a terminal in the project root.
2. Install packages: `npm ci`
3. Copy `.env.example` to `.env.local` and fill in your own values. Do not commit `.env.local` or share secret keys.
4. In Supabase SQL Editor, apply the SQL migration(s) in `supabase/migrations/` in filename order. The atomic booking flow requires the migration that defines `cit_submit_booking` and `cit_transition_booking`, if supplied in your copy.
5. Start the app: `npm run dev`
6. Open `http://localhost:3000`.

Local development can use the checked-in sample JSON files as a fallback when Supabase credentials are not configured. Production writes require configured Supabase storage; booking transitions require the matching RPC migration.

## Demo accounts

These built-in accounts are for local/demo evaluation only; do not reuse these passwords in a public production deployment. Configure a strong `CIT_AUTH_SECRET` for any hosted demo.

| Role | Email | Password |
|---|---|---|
| Admin (Dean's Office) | `admin@cit.edu` | `CITAdmin2024!` |
| Department Coordinator | `coordinator@cit.edu` | `CITCoord2024!` |
| Faculty | `faculty@cit.edu` | `CITFaculty2024!` |
| Club Representative | `clubrep@cit.edu` | `CITClub2024!` |

Admin demo reset: use the Admin-only reset control in the app, backed by `POST /api/cit/reset`. It restores the saved baseline schedule and clears transient booking/Spectra/disruption records. Verify the button and database behavior in the deployed environment before judging.

## Environment variables

- `SUPABASE_URL`: server-side Supabase project URL.
- `SUPABASE_SECRET_KEY`: preferred server-only Supabase secret key. Keep it out of browser/client code and never prefix it with `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY`: legacy alternative supported by the persistence helper. Use one server-side key, not both.
- `NEXT_PUBLIC_SUPABASE_URL`: optional public project URL for client-side features. It is not a secret.
- `GROQ_API_KEY`: optional key for AI parsing/assistant features where configured.
- `CIT_AUTH_SECRET`: optional app authentication secret. Use a strong random value for deployments.

Do not paste secrets into issues, chat, source files, or commits. `.env.example` contains placeholders only.

## Useful commands

```bash
npm run dev
npm run typecheck
npm run build
npm run lint
npm run generate:schedules
python validator.py --data data/cit_public.json --schedule exports/schedule.json
python validator.py --data data/cit_public.json --schedule exports/schedule_after.json --disruption data/sample_disruption.json --baseline exports/schedule.json
```

The validator commands expect the relevant schedule JSON files to exist in `exports/`. Run the generator or use a schedule file produced by the application first. Build currently skips linting as configured in `next.config.mjs`; run `npm run lint` separately to review lint warnings.

## Project layout

- `app/`: Next.js pages and API routes.
- `components/`: dashboard, timetable, venue booking, Spectra, exams, AI assistant, and rescheduling UI.
- `data/`: sample campus dataset and CSV inputs.
- `solver/`: schedule generation logic.
- `validator.py`, `validator.mjs`: deterministic validation utilities.
- `supabase/migrations/`: database schema/RPC migrations.
- `supabase/tests/`: SQL tests and test instructions for atomic booking workflows.
- `examples/`: sample request and disruption payloads.

## Deployment notes

- Configure the environment variables in your hosting provider; do not upload `.env.local`.
- Apply all required Supabase migrations before testing booking approval/rejection and persistent state.
- Confirm the deployed runtime can reach Supabase and that the server-side key has the required table/RPC permissions.
- Verify the main flows end-to-end: sign-in/roles, timetable filters, venue request parsing and editing, conflict handling, booking approval/cancellation, disruption preview/approval, exams, and import/export.
- Treat AI output as a proposal only. Run deterministic validation before accepting generated or rescheduled schedules.

## Security

Server-side Supabase keys must never be exposed through `NEXT_PUBLIC_*` variables. Use least-privilege access where possible, rotate any key that was accidentally disclosed, and keep local environment files out of version control.

### Release smoke checks

Run `npm run verify:release` before packaging a submission. This checks required deliverables, confirms key booking/rescheduling safeguards are present, and runs the official baseline and disruption validators. It does **not** replace `npm run typecheck`, `npm run build`, the Supabase SQL smoke test, or a live concurrent-booking test; those still need to be run in the configured environment.


## Known limitations / release caveats

- The included credentials are static demo accounts, not a production identity provider; rotate or replace them before real-world use.
- Live Supabase persistence, SQL RPC permissions, reset behavior, and concurrent booking behavior must be tested against the target Supabase project.
- `npm run verify:release` and the official validator do not replace `npm run typecheck`, `npm run build`, browser-based role checks, or deployed smoke tests.
- The schedule generator is deterministic and heuristic; a successful result is validated, but the search is not guaranteed to find a globally optimal schedule.

### Live API smoke checks

With the app already running (`npm run dev` or `npm run start`), run `npm run smoke:api`. The script checks that public read endpoints respond and that booking writes, dataset writes, and demo reset reject unauthenticated requests. For a deployed instance, set `BASE_URL=https://your-host.example` before running it. These checks do not replace authenticated end-to-end tests for each role.
