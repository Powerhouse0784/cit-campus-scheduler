import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
}
function fileContains(file, patterns) {
  const full = path.join(root, file);
  if (!existsSync(full)) return { ok: false, detail: `missing ${file}` };
  const source = readFileSync(full, 'utf8');
  const missing = patterns.filter((p) => !source.includes(p));
  return { ok: missing.length === 0, detail: missing.length ? `missing markers: ${missing.join(', ')}` : 'required markers found' };
}

for (const file of [
  'README.md', '.env.example', 'AI_USAGE.md', 'THIRD_PARTY.md',
  'exports/schedule.json', 'exports/schedule_after.json',
  'data/sample_disruption.json',
  'supabase/migrations/202611010001_cit_app_state.sql',
  'supabase/migrations/202611010002_atomic_booking_workflow.sql',
  'supabase/tests/atomic_booking_workflow.sql', 'SPECTRA_ACCESS_HARDENING.md',
]) check(`required file: ${file}`, existsSync(path.join(root, file)));

check('booking submit is atomically persisted', fileContains('app/api/cit/bookings/route.ts', ['submitBookingAtomically', 'requester_id', 'status = "pending"']).ok,
  fileContains('app/api/cit/bookings/route.ts', ['submitBookingAtomically', 'requester_id', 'status = "pending"']).detail);
check('rescheduling publish gate requires clean validation', fileContains('app/api/cit/disruption/route.ts', ['solver_success', 'hard_violations']).ok,
  fileContains('app/api/cit/disruption/route.ts', ['solver_success', 'hard_violations']).detail);
check('booking list requires authenticated campus role', fileContains('app/api/cit/bookings/route.ts', ['authorizeRoles(req, [\"admin\", \"department_coordinator\", \"faculty\", \"club\"])']).ok,
  fileContains('app/api/cit/bookings/route.ts', ['authorizeRoles(req, [\"admin\", \"department_coordinator\", \"faculty\", \"club\"])']).detail);
check('disruption proposal read requires scheduler role', fileContains('app/api/cit/disruption/route.ts', ['authorizeRoles(req, SCHEDULER_ROLES)']).ok,
  fileContains('app/api/cit/disruption/route.ts', ['authorizeRoles(req, SCHEDULER_ROLES)']).detail);
check('Spectra POST rejects guest/student sessions before loading booking details', fileContains('app/api/cit/spectra/route.ts', ['decision lookups as well as mutations', 'if (session.role === "student")', 'status: 401']).ok,
  fileContains('app/api/cit/spectra/route.ts', ['decision lookups as well as mutations', 'if (session.role === "student")', 'status: 401']).detail);
check('Spectra approval retains admin/coordinator and self-approval guards', fileContains('app/api/cit/spectra/route.ts', ['Only Admin or Department Coordinator accounts may approve events.', 'Nobody can approve their own request']).ok,
  fileContains('app/api/cit/spectra/route.ts', ['Only Admin or Department Coordinator accounts may approve events.', 'Nobody can approve their own request']).detail);
for (const file of ['app/api/cit/stats/route.ts', 'app/api/schedule/route.ts', 'app/api/cit/timetable/route.ts']) {
  const result = fileContains(file, ['export const dynamic = "force-dynamic"']);
  check(`dynamic API route: ${file}`, result.ok, result.detail);
}

for (const [label, args] of [
  ['baseline schedule validator', ['validator.py', '--data', 'data/cit_public.json', '--schedule', 'exports/schedule.json']],
  ['disruption schedule validator', ['validator.py', '--data', 'data/cit_public.json', '--schedule', 'exports/schedule_after.json', '--disruption', 'data/sample_disruption.json', '--baseline', 'exports/schedule.json']],
]) {
  const result = spawnSync('python', args, { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
  const ok = result.status === 0 && /Hard violations:\s+0/.test(output);
  check(label, ok, output.replace(/\s+/g, ' ').slice(0, 500) || `exit ${result.status}`);
}

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
check('release verification script is wired into package.json', pkg.scripts?.['verify:release'] === 'node scripts/verify-release.mjs');

console.log(`\nRelease checks: ${checks.filter((c) => c.ok).length}/${checks.length} passed.`);
if (failures.length) {
  console.error(`Needs attention: ${failures.join('; ')}`);
  process.exitCode = 1;
}
