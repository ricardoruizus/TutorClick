create function public.save_tutor_onboarding_availability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_days jsonb := new.raw_user_meta_data -> 'availability_weekdays';
  requested_start_text text := new.raw_user_meta_data ->> 'availability_start_time';
  requested_end_text text := new.raw_user_meta_data ->> 'availability_end_time';
  requested_mode text := new.raw_user_meta_data ->> 'availability_mode';
  requested_start time;
  requested_end time;
begin
  if new.raw_user_meta_data ->> 'role' is distinct from 'tutor' then
    return new;
  end if;

  if jsonb_typeof(requested_days) is distinct from 'array' then
    raise exception 'Tutor availability days are required';
  end if;
  if jsonb_array_length(requested_days) = 0 then
    raise exception 'Tutor availability days are required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(requested_days) as selected_day(day)
    where selected_day.day !~ '^[0-6]$'
  ) then
    raise exception 'Invalid tutor availability day';
  end if;

  if requested_start_text is null
    or requested_start_text !~ '^([01][0-9]|2[0-3]):00$'
    or requested_end_text is null
    or requested_end_text !~ '^([01][0-9]|2[0-3]):00$' then
    raise exception 'Tutor availability must use whole-hour times';
  end if;

  requested_start := requested_start_text::time;
  requested_end := requested_end_text::time;
  if requested_start >= requested_end then
    raise exception 'Tutor availability end must follow its start';
  end if;

  if requested_mode is null
    or requested_mode not in ('Presencial', 'En línea')
    or not exists (
      select 1
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(new.raw_user_meta_data -> 'class_modes') = 'array'
            then new.raw_user_meta_data -> 'class_modes'
          else '[]'::jsonb
        end
      ) as selected_mode(mode)
      where selected_mode.mode = requested_mode
    ) then
    raise exception 'Tutor availability mode must be one of the selected class modes';
  end if;

  insert into public.tutor_weekly_availability (
    tutor_user_id,
    weekday,
    start_time,
    mode
  )
  select
    new.id,
    selected_days.weekday,
    generated_slots.slot_start::time,
    requested_mode
  from (
    select distinct selected_day.day::smallint as weekday
    from jsonb_array_elements_text(requested_days) as selected_day(day)
  ) as selected_days
  cross join lateral generate_series(
    date '2000-01-01' + requested_start,
    date '2000-01-01' + requested_end - interval '1 hour',
    interval '1 hour'
  ) as generated_slots(slot_start);

  return new;
end;
$$;

revoke all on function public.save_tutor_onboarding_availability()
  from public, anon, authenticated;

create trigger on_auth_user_created_tutor_availability
  after insert on auth.users
  for each row execute function public.save_tutor_onboarding_availability();
