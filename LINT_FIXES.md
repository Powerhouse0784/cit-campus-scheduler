# Lint and Type Safety Fixes

This update addresses the lint output shared for the Phase 1 project:

- Replaced explicit `any` annotations with domain types for the dataset, schedule, timetable grid, dashboard statistics, booking data, and event cards.
- Typed the disruption payload conversion and schedule preview handling.
- Removed unused imports and unused state setters reported by ESLint.
- Stabilised the Exams module `exams` array with `useMemo` so its dependent hooks do not receive a new array on every render.
- Removed the unused catch binding in the AI parse route.
- Changed the lint command from deprecated `next lint` to the ESLint CLI, scoped to application source files and configured to fail on warnings.

## Dependency versions

The package manifest targets Next.js 15.5.28 and uses ESLint 8.57.1 with eslint-config-next 15.5.28.

The package-lock file is intentionally not included in this source patch because the build environment could not reach the npm registry to regenerate it. If applying this ZIP over the working project, keep the locally generated `package-lock.json` from your successful dependency installation. If installing into a fresh folder, run `npm install` once to generate a matching lockfile before using `npm ci` in subsequent installs.

## Verification limitation

The source environment used to prepare this patch had no npm registry access and no local `node_modules`. Therefore ESLint, full TypeScript, and production build could not be rerun here. The reported lint findings were addressed in source, but a clean lint/build result must be confirmed after installing dependencies locally.
