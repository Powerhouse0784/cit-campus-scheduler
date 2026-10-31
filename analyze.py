import json

sched = json.load(open('exports/schedule.json'))
data = json.load(open('data/cit_public.json'))
sess_map = {s['id']:s for s in data['sessions']}

# Compute S3 and S4 contributors
from collections import defaultdict

grp_day_hours = defaultdict(int)
grp_day_course = defaultdict(int)
grp_day_periods = defaultdict(set)
seen_basket = set()

for entry in sched['sessions']:
    s = sess_map.get(entry['session_id'])
    if not s:
        continue
    day = entry['day']
    sp = entry['start_period']
    dur = s['duration']
    periods = list(range(sp, sp + dur))
    
    for g in s['groups']:
        for p in periods:
            grp_day_periods[(g, day)].add(p)
        
        if s.get('basket_slot'):
            if (g, s['basket_slot']) in seen_basket:
                continue
            seen_basket.add((g, s['basket_slot']))
        
        grp_day_hours[(g, day)] += dur
        if s['kind'] == 'lecture' and not s.get('basket_slot'):
            grp_day_course[(g, day, s['course_id'])] += 1

print('=== S3 violations (>6 hours/day) ===')
total_s3 = 0
for (g, day), h in sorted(grp_day_hours.items(), key=lambda x: -x[1]):
    if h > 6:
        excess = h - 6
        pen = 3 * excess
        total_s3 += pen
        print(f"  {g} {day}: {h} hours (excess={excess}, penalty={pen})")
print(f"Total S3: {total_s3}")

print()
print('=== S4 violations (same course twice/day) ===')
total_s4 = 0
for (g, day, course), count in sorted(grp_day_course.items(), key=lambda x: -x[1]):
    if count > 1:
        pen = 3 * (count - 1)
        total_s4 += pen
        print(f"  {g} {day} {course}: {count}x (penalty={pen})")

# Also basket course duplicates
bc = defaultdict(int)
for entry in sched['sessions']:
    s = sess_map.get(entry['session_id'])
    if s and s.get('basket_slot'):
        bc[(s['course_id'], entry['day'])] += 1
for (course, day), c in bc.items():
    if c > 1:
        pen = 3 * (c - 1)
        total_s4 += pen
        print(f"  basket {course} {day}: {c}x (penalty={pen})")
print(f"Total S4: {total_s4}")

print()
print('=== S2 (gap hours) ===')
total_s2 = 0
for (g, day), ps in grp_day_periods.items():
    gaps = sum(1 for p in range(min(ps), max(ps)+1) if p not in ps)
    if gaps > 0:
        total_s2 += gaps
        print(f"  {g} {day}: periods={sorted(ps)}, gaps={gaps}")
print(f"Total S2: {total_s2}")

print()
print('=== S6 (P9 sessions) ===')
total_s6 = 0
for entry in sched['sessions']:
    s = sess_map.get(entry['session_id'])
    if not s:
        continue
    periods = list(range(entry['start_period'], entry['start_period'] + s['duration']))
    if 9 in periods:
        total_s6 += 1
        print(f"  {entry['session_id']} {entry['day']} P{entry['start_period']}")
print(f"Total S6: {total_s6}")
