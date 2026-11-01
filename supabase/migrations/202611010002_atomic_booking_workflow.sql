-- Atomic booking reservation and status transitions. Run after 202611010001_cit_app_state.sql.
-- All operations lock schedule first and booking state second to use a consistent lock order.
create or replace function public.cit_submit_booking(
  p_booking jsonb,
  p_bookings_key text default 'user_bookings.json',
  p_schedule_key text default 'schedule.json'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule jsonb;
  v_bookings jsonb;
  v_booking jsonb := p_booking;
  v_conflict jsonb;
  v_room text;
  v_day text;
  v_start int;
  v_end int;
begin
  if coalesce(p_booking->>'request_id', '') = '' then
    return jsonb_build_object('success', false, 'error', 'Booking request_id is required.');
  end if;
  insert into public.cit_app_state(state_key, state_value) values (p_schedule_key, '{}'::jsonb) on conflict (state_key) do nothing;
  insert into public.cit_app_state(state_key, state_value) values (p_bookings_key, '[]'::jsonb) on conflict (state_key) do nothing;
  select state_value into v_schedule from public.cit_app_state where state_key = p_schedule_key for update;
  select state_value into v_bookings from public.cit_app_state where state_key = p_bookings_key for update;
  if jsonb_typeof(v_bookings) <> 'array' then
    return jsonb_build_object('success', false, 'error', 'Booking state is not an array.');
  end if;
  if exists (select 1 from jsonb_array_elements(v_bookings) b where b->>'request_id' = p_booking->>'request_id') then
    return jsonb_build_object('success', false, 'conflict', 'duplicate_id', 'error', 'Booking request already exists.');
  end if;

  v_room := p_booking->>'room_id'; v_day := p_booking->>'day';
  v_start := (p_booking->>'start_period')::int; v_end := (p_booking->>'end_period')::int;
  if coalesce(p_booking->>'status', '') in ('pending', 'approved') then
    select x into v_conflict from (
      select b as x from jsonb_array_elements(coalesce(v_schedule#>'{fest_week,bookings}', '[]'::jsonb)) b
      where b->>'request_id' is distinct from p_booking->>'request_id'
        and b->>'status' in ('approved', 'scheduled') and b->>'room_id' = v_room and b->>'day' = v_day
        and coalesce((b->>'start_period')::int, 0) <= v_end and coalesce((b->>'end_period')::int, 0) >= v_start
      union all
      select b as x from jsonb_array_elements(v_bookings) b
      where b->>'request_id' is distinct from p_booking->>'request_id'
        and b->>'status' in ('pending', 'approved') and b->>'room_id' = v_room and b->>'day' = v_day
        and coalesce((b->>'start_period')::int, 0) <= v_end and coalesce((b->>'end_period')::int, 0) >= v_start
    ) conflicts limit 1;
    if v_conflict is not null then
      return jsonb_build_object('success', false, 'conflict', v_conflict, 'error', 'Room/time slot was reserved by another request. Refresh availability and try again.');
    end if;
  end if;
  update public.cit_app_state set state_value = jsonb_build_array(v_booking) || v_bookings, updated_at = now() where state_key = p_bookings_key;
  return jsonb_build_object('success', true, 'booking', v_booking);
end;
$$;

create or replace function public.cit_transition_booking(
  p_request_id text,
  p_expected_status text,
  p_new_status text,
  p_reason text,
  p_bookings_key text default 'user_bookings.json',
  p_schedule_key text default 'schedule.json'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_schedule jsonb;
  v_bookings jsonb;
  v_target jsonb;
  v_updated jsonb;
  v_conflict jsonb;
  v_day text;
  v_room text;
  v_start int;
  v_end int;
  v_schedule_bookings jsonb;
begin
  if p_new_status not in ('approved', 'cancelled') then
    return jsonb_build_object('success', false, 'error', 'Unsupported booking transition.');
  end if;
  insert into public.cit_app_state(state_key, state_value) values (p_schedule_key, '{}'::jsonb) on conflict (state_key) do nothing;
  insert into public.cit_app_state(state_key, state_value) values (p_bookings_key, '[]'::jsonb) on conflict (state_key) do nothing;
  select state_value into v_schedule from public.cit_app_state where state_key = p_schedule_key for update;
  select state_value into v_bookings from public.cit_app_state where state_key = p_bookings_key for update;
  select b into v_target from jsonb_array_elements(coalesce(v_bookings, '[]'::jsonb)) b where b->>'request_id' = p_request_id limit 1;
  if v_target is null then return jsonb_build_object('success', false, 'error', 'Booking not found.', 'status_code', 404); end if;
  if v_target->>'status' is distinct from p_expected_status then
    return jsonb_build_object('success', false, 'error', 'Booking status changed; refresh and retry.', 'status_code', 409, 'current_status', v_target->>'status');
  end if;

  v_day := v_target->>'day'; v_room := v_target->>'room_id';
  v_start := (v_target->>'start_period')::int; v_end := (v_target->>'end_period')::int;
  if p_new_status = 'approved' then
    select x into v_conflict from (
      select b as x from jsonb_array_elements(coalesce(v_schedule#>'{fest_week,bookings}', '[]'::jsonb)) b
      where b->>'request_id' is distinct from p_request_id and b->>'status' in ('approved', 'scheduled')
        and b->>'room_id' = v_room and b->>'day' = v_day
        and coalesce((b->>'start_period')::int, 0) <= v_end and coalesce((b->>'end_period')::int, 0) >= v_start
      union all
      select b as x from jsonb_array_elements(coalesce(v_bookings, '[]'::jsonb)) b
      where b->>'request_id' is distinct from p_request_id and b->>'status' in ('pending', 'approved')
        and b->>'room_id' = v_room and b->>'day' = v_day
        and coalesce((b->>'start_period')::int, 0) <= v_end and coalesce((b->>'end_period')::int, 0) >= v_start
    ) conflicts limit 1;
    if v_conflict is not null then
      return jsonb_build_object('success', false, 'error', 'Room/time slot was reserved by another request.', 'status_code', 409, 'conflict', v_conflict);
    end if;
  end if;

  v_updated := jsonb_set(jsonb_set(v_target, '{status}', to_jsonb(p_new_status)), '{reason}', to_jsonb(p_reason));
  select coalesce(jsonb_agg(case when b->>'request_id' = p_request_id then v_updated else b end order by ord), '[]'::jsonb)
    into v_bookings from jsonb_array_elements(coalesce(v_bookings, '[]'::jsonb)) with ordinality as t(b, ord);
  update public.cit_app_state set state_value = v_bookings, updated_at = now() where state_key = p_bookings_key;

  v_schedule := jsonb_set(coalesce(v_schedule, '{}'::jsonb), '{fest_week}', coalesce(v_schedule->'fest_week', '{}'::jsonb), true);
  v_schedule_bookings := coalesce(v_schedule#>'{fest_week,bookings}', '[]'::jsonb);
  if exists (select 1 from jsonb_array_elements(v_schedule_bookings) b where b->>'request_id' = p_request_id) then
    select coalesce(jsonb_agg(case when b->>'request_id' = p_request_id then jsonb_set(jsonb_set(b, '{status}', to_jsonb(p_new_status)), '{reason}', to_jsonb(p_reason)) else b end), '[]'::jsonb)
      into v_schedule_bookings from jsonb_array_elements(v_schedule_bookings) b;
  elsif p_new_status = 'approved' then
    v_schedule_bookings := v_schedule_bookings || jsonb_build_array(jsonb_build_object(
      'request_id', p_request_id, 'status', p_new_status, 'day', v_day,
      'start_period', v_start, 'end_period', v_end, 'room_id', v_room, 'reason', p_reason));
  end if;
  v_schedule := jsonb_set(v_schedule, '{fest_week,bookings}', v_schedule_bookings, true);
  update public.cit_app_state set state_value = v_schedule, updated_at = now() where state_key = p_schedule_key;
  return jsonb_build_object('success', true, 'booking', v_updated);
end;
$$;

revoke all on function public.cit_submit_booking(jsonb, text, text) from public, anon, authenticated;
revoke all on function public.cit_transition_booking(text, text, text, text, text, text) from public, anon, authenticated;
-- Server-side secret/service-role credentials execute these RPCs; never expose them in client code.
grant execute on function public.cit_submit_booking(jsonb, text, text) to service_role;
grant execute on function public.cit_transition_booking(text, text, text, text, text, text) to service_role;
