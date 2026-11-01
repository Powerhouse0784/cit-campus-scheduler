-- Manual integration smoke test for Supabase SQL Editor.
-- Run only after migrations 202611010001 and 202611010002.
-- Uses isolated __cit_test_* state keys and rolls all test data back.
begin;

do $$
declare
  v_result jsonb;
  v_state jsonb;
begin
  insert into public.cit_app_state(state_key, state_value)
  values ('__cit_test_schedule.json', '{"fest_week":{"bookings":[{"request_id":"fixture-existing","status":"approved","room_id":"R1","day":"MON","start_period":2,"end_period":3}]}}'::jsonb)
  on conflict (state_key) do update set state_value = excluded.state_value;
  insert into public.cit_app_state(state_key, state_value)
  values ('__cit_test_user_bookings.json', '[]'::jsonb)
  on conflict (state_key) do update set state_value = excluded.state_value;

  -- A non-overlapping booking can be submitted.
  v_result := public.cit_submit_booking(
    '{"request_id":"__cit_test_booking_a","status":"pending","room_id":"R1","day":"MON","start_period":4,"end_period":5}'::jsonb,
    '__cit_test_user_bookings.json', '__cit_test_schedule.json');
  if coalesce((v_result->>'success')::boolean, false) is not true then
    raise exception 'Expected first booking to submit successfully: %', v_result;
  end if;

  -- Inclusive period overlap must be rejected (period 5 overlaps).
  v_result := public.cit_submit_booking(
    '{"request_id":"__cit_test_booking_b","status":"pending","room_id":"R1","day":"MON","start_period":5,"end_period":6}'::jsonb,
    '__cit_test_user_bookings.json', '__cit_test_schedule.json');
  if coalesce((v_result->>'success')::boolean, false) is not false then
    raise exception 'Expected overlapping booking to be rejected: %', v_result;
  end if;

  -- A valid pending -> approved transition succeeds.
  v_result := public.cit_transition_booking(
    '__cit_test_booking_a', 'pending', 'approved', 'integration test approval',
    '__cit_test_user_bookings.json', '__cit_test_schedule.json');
  if coalesce((v_result->>'success')::boolean, false) is not true then
    raise exception 'Expected pending -> approved to succeed: %', v_result;
  end if;

  -- A stale expected status must not overwrite the newer state.
  v_result := public.cit_transition_booking(
    '__cit_test_booking_a', 'pending', 'cancelled', 'stale integration test',
    '__cit_test_user_bookings.json', '__cit_test_schedule.json');
  if coalesce((v_result->>'success')::boolean, false) is not false then
    raise exception 'Expected stale transition to fail: %', v_result;
  end if;

  -- Approved -> cancelled succeeds and updates both persisted documents.
  v_result := public.cit_transition_booking(
    '__cit_test_booking_a', 'approved', 'cancelled', 'integration test cancellation',
    '__cit_test_user_bookings.json', '__cit_test_schedule.json');
  if coalesce((v_result->>'success')::boolean, false) is not true then
    raise exception 'Expected approved -> cancelled to succeed: %', v_result;
  end if;

  select state_value into v_state from public.cit_app_state where state_key = '__cit_test_user_bookings.json';
  if not exists (select 1 from jsonb_array_elements(v_state) b where b->>'request_id' = '__cit_test_booking_a' and b->>'status' = 'cancelled') then
    raise exception 'Booking state was not updated to cancelled: %', v_state;
  end if;
  select state_value into v_state from public.cit_app_state where state_key = '__cit_test_schedule.json';
  if not exists (select 1 from jsonb_array_elements(v_state#>'{fest_week,bookings}') b where b->>'request_id' = '__cit_test_booking_a' and b->>'status' = 'cancelled') then
    raise exception 'Schedule mirror was not updated to cancelled: %', v_state;
  end if;
end $$;

rollback;
