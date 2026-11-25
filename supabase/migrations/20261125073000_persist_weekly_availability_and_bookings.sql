create table public.tutor_weekly_availability (
  id uuid primary key default gen_random_uuid(),
  tutor_user_id uuid not null references auth.users (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  mode text not null check (mode in ('Presencial', 'En línea')),
  created_at timestamptz not null default now(),
  unique (tutor_user_id, weekday, start_time)
);

create table public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  tutor_user_id uuid not null references auth.users (id) on delete cascade,
  student_user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (length(btrim(subject)) between 1 and 150),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null check (mode in ('Presencial', 'En línea')),
  location text,
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  check (ends_at = starts_at + interval '1 hour'),
  check (
    (mode = 'Presencial' and nullif(btrim(location), '') is not null)
    or (mode = 'En línea' and location is null)
  ),
  check (location is null or length(location) <= 300),
  check (tutor_user_id <> student_user_id)
);

create unique index class_bookings_active_tutor_slot
  on public.class_bookings (tutor_user_id, starts_at)
  where status in ('pending_confirmation', 'confirmed');

alter table public.tutor_weekly_availability enable row level security;
alter table public.class_bookings enable row level security;

create policy "Tutors manage their own weekly availability"
  on public.tutor_weekly_availability for all to authenticated
  using (
    tutor_user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'tutor'
    )
  )
  with check (
    tutor_user_id = (select auth.uid())
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'tutor'
    )
  );

create policy "Participants can read their class bookings"
  on public.class_bookings for select to authenticated
  using (
    student_user_id = (select auth.uid())
    or tutor_user_id = (select auth.uid())
  );

revoke all on public.tutor_weekly_availability from anon, authenticated;
grant select, insert, update, delete on public.tutor_weekly_availability to authenticated;
revoke all on public.class_bookings from anon, authenticated;
grant select on public.class_bookings to authenticated;

create function public.save_tutor_weekly_availability(
  p_weekdays smallint[],
  p_start_time time,
  p_end_time time,
  p_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'tutor'
  ) then
    raise exception 'Tutor access is required';
  end if;

  if coalesce(cardinality(p_weekdays), 0) = 0
    or exists (select 1 from unnest(p_weekdays) as weekday where weekday not between 0 and 6)
    or p_start_time is null
    or p_end_time is null
    or p_start_time >= p_end_time
    or extract(minute from p_start_time) <> 0
    or extract(second from p_start_time) <> 0
    or extract(minute from p_end_time) <> 0
    or extract(second from p_end_time) <> 0
    or p_mode is null
    or p_mode not in ('Presencial', 'En línea') then
    raise exception 'Invalid weekly availability rule';
  end if;

  insert into public.tutor_weekly_availability (tutor_user_id, weekday, start_time, mode)
  select current_user_id, selected_days.weekday, generated_slots.start_time::time, p_mode
  from (
    select distinct unnest(p_weekdays) as weekday
  ) as selected_days
  cross join lateral generate_series(
    date '2000-01-01' + p_start_time,
    date '2000-01-01' + p_end_time - interval '1 hour',
    interval '1 hour'
  ) as generated_slots(start_time)
  on conflict (tutor_user_id, weekday, start_time)
  do update set mode = excluded.mode;
end;
$$;

create function public.list_tutor_available_slots(
  p_tutor_user_id uuid,
  p_days integer default 30
)
returns table (starts_at timestamptz, mode text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  local_today date := (now() at time zone 'America/Merida')::date;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'alumno'
  ) then
    raise exception 'Student access is required';
  end if;

  if p_days is null or p_days < 1 or p_days > 60 then
    raise exception 'Availability horizon must be between 1 and 60 days';
  end if;

  if not exists (
    select 1
    from public.tutor_profiles as tutor
    join public.profiles as profile on profile.id = tutor.user_id
    where tutor.user_id = p_tutor_user_id
      and tutor.verification_status = 'verified'
      and nullif(btrim(profile.full_name), '') is not null
      and nullif(btrim(tutor.biography), '') is not null
      and cardinality(tutor.subjects) > 0
      and tutor.hourly_rate_mxn is not null
      and cardinality(tutor.class_modes) > 0
      and nullif(btrim(tutor.service_zone), '') is not null
  ) then
    raise exception 'Verified tutor access is required';
  end if;

  return query
    select
      (generated_days.local_day + availability.start_time) at time zone 'America/Merida',
      availability.mode
    from generate_series(
      local_today::timestamp,
      (local_today + p_days - 1)::timestamp,
      interval '1 day'
    ) as generated_days(local_day)
    join public.tutor_weekly_availability as availability
      on availability.tutor_user_id = p_tutor_user_id
      and availability.weekday = extract(dow from generated_days.local_day)::smallint
    where ((generated_days.local_day + availability.start_time) at time zone 'America/Merida') > now()
      and not exists (
        select 1
        from public.class_bookings as booking
        where booking.tutor_user_id = p_tutor_user_id
          and booking.starts_at = (
            (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
          )
          and booking.status in ('pending_confirmation', 'confirmed')
      )
    order by (
      (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
    );
end;
$$;

create function public.request_class_booking(
  p_tutor_user_id uuid,
  p_starts_at timestamptz,
  p_subject text,
  p_mode text,
  p_location text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  local_start timestamp;
  booking_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'alumno'
  ) then
    raise exception 'Student access is required';
  end if;

  if p_starts_at is null or p_subject is null or nullif(btrim(p_subject), '') is null
    or length(p_subject) > 150
    or p_mode is null
    or p_mode not in ('Presencial', 'En línea')
    or (p_mode = 'Presencial' and (
      nullif(btrim(p_location), '') is null or length(p_location) > 300
    ))
    or (p_mode = 'En línea' and p_location is not null) then
    raise exception 'Invalid class booking details';
  end if;

  local_start := p_starts_at at time zone 'America/Merida';
  if p_starts_at <= now()
    or local_start::date > ((now() at time zone 'America/Merida')::date + 29)
    or local_start <> date_trunc('hour', local_start) then
    raise exception 'The requested time is outside the booking window';
  end if;

  if not exists (
    select 1
    from public.tutor_profiles as tutor
    join public.profiles as profile on profile.id = tutor.user_id
    join public.tutor_weekly_availability as availability
      on availability.tutor_user_id = tutor.user_id
    where tutor.user_id = p_tutor_user_id
      and tutor.verification_status = 'verified'
      and nullif(btrim(profile.full_name), '') is not null
      and nullif(btrim(tutor.biography), '') is not null
      and cardinality(tutor.subjects) > 0
      and tutor.hourly_rate_mxn is not null
      and cardinality(tutor.class_modes) > 0
      and nullif(btrim(tutor.service_zone), '') is not null
      and btrim(p_subject) = any(tutor.subjects)
      and availability.weekday = extract(dow from local_start)::smallint
      and availability.start_time = local_start::time
      and availability.mode = p_mode
  ) then
    raise exception 'The requested time is no longer available';
  end if;

  begin
    insert into public.class_bookings (
      tutor_user_id,
      student_user_id,
      subject,
      starts_at,
      ends_at,
      mode,
      location
    )
    values (
      p_tutor_user_id,
      current_user_id,
      btrim(p_subject),
      p_starts_at,
      p_starts_at + interval '1 hour',
      p_mode,
      case when p_mode = 'Presencial' then btrim(p_location) else null end
    )
    returning id into booking_id;
  exception
    when unique_violation then
      raise exception 'Ese horario acaba de ser solicitado por otra persona. Elige otro horario.';
  end;

  return booking_id;
end;
$$;

create function public.list_my_class_bookings()
returns table (
  id uuid,
  tutor_user_id uuid,
  student_user_id uuid,
  tutor_name text,
  student_name text,
  subject text,
  starts_at timestamptz,
  ends_at timestamptz,
  mode text,
  location text,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role in ('alumno', 'tutor')
  ) then
    raise exception 'Authenticated student or tutor access is required';
  end if;

  return query
    select booking.id,
      booking.tutor_user_id,
      booking.student_user_id,
      tutor_profile.full_name,
      student_profile.full_name,
      booking.subject,
      booking.starts_at,
      booking.ends_at,
      booking.mode,
      booking.location,
      booking.status
    from public.class_bookings as booking
    join public.profiles as tutor_profile on tutor_profile.id = booking.tutor_user_id
    join public.profiles as student_profile on student_profile.id = booking.student_user_id
    where booking.tutor_user_id = current_user_id
      or booking.student_user_id = current_user_id
    order by booking.starts_at desc;
end;
$$;

create function public.respond_to_class_booking(
  p_booking_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'tutor'
  ) then
    raise exception 'Tutor access is required';
  end if;

  if p_status is null or p_status not in ('confirmed', 'rejected') then
    raise exception 'Unsupported booking response';
  end if;

  update public.class_bookings
  set status = p_status
  where id = p_booking_id
    and tutor_user_id = current_user_id
    and status = 'pending_confirmation';

  if not found then
    raise exception 'The pending booking was not found';
  end if;
end;
$$;

revoke all on function public.save_tutor_weekly_availability(smallint[], time, time, text) from public, anon;
revoke all on function public.list_tutor_available_slots(uuid, integer) from public, anon;
revoke all on function public.request_class_booking(uuid, timestamptz, text, text, text) from public, anon;
revoke all on function public.list_my_class_bookings() from public, anon;
revoke all on function public.respond_to_class_booking(uuid, text) from public, anon;
grant execute on function public.save_tutor_weekly_availability(smallint[], time, time, text) to authenticated;
grant execute on function public.list_tutor_available_slots(uuid, integer) to authenticated;
grant execute on function public.request_class_booking(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.list_my_class_bookings() to authenticated;
grant execute on function public.respond_to_class_booking(uuid, text) to authenticated;
