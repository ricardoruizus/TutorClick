alter table public.class_bookings
  drop constraint class_bookings_status_check,
  add constraint class_bookings_status_check
    check (status in (
      'pending_confirmation',
      'confirmed',
      'rejected',
      'cancelled',
      'reschedule_pending',
      'completed'
    )),
  add column cancelled_by uuid references auth.users (id) on delete set null,
  add column cancellation_reason text check (
    cancellation_reason is null or length(cancellation_reason) <= 500
  ),
  add column completed_at timestamptz,
  add column reschedule_proposed_by uuid references auth.users (id) on delete set null,
  add column proposed_starts_at timestamptz,
  add column proposed_ends_at timestamptz,
  add column proposed_mode text check (
    proposed_mode is null or proposed_mode in ('Presencial', 'En línea')
  ),
  add column proposed_location text check (
    proposed_location is null or length(proposed_location) <= 300
  ),
  add constraint class_bookings_reschedule_proposal_check check (
    (
      status = 'reschedule_pending'
      and reschedule_proposed_by is not null
      and proposed_starts_at is not null
      and proposed_ends_at is not null
      and proposed_ends_at = proposed_starts_at + interval '1 hour'
      and proposed_mode is not null
      and (
        (proposed_mode = 'Presencial' and nullif(btrim(proposed_location), '') is not null)
        or (proposed_mode = 'En línea' and proposed_location is null)
      )
    )
    or (
      status <> 'reschedule_pending'
      and reschedule_proposed_by is null
      and proposed_starts_at is null
      and proposed_ends_at is null
      and proposed_mode is null
      and proposed_location is null
    )
  );

drop index public.class_bookings_active_tutor_slot;
create unique index class_bookings_active_tutor_slot
  on public.class_bookings (tutor_user_id, starts_at)
  where status in ('pending_confirmation', 'confirmed', 'reschedule_pending');

create unique index class_bookings_proposed_tutor_slot
  on public.class_bookings (tutor_user_id, proposed_starts_at)
  where status = 'reschedule_pending';

create table public.class_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.class_bookings (id) on delete cascade,
  recipient_user_id uuid not null references auth.users (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (event_type in (
    'request_received',
    'request_confirmed',
    'request_rejected',
    'booking_cancelled',
    'reschedule_proposed',
    'reschedule_accepted',
    'reschedule_rejected',
    'class_completed'
  )),
  title text not null check (length(btrim(title)) between 1 and 120),
  message text not null check (length(btrim(message)) between 1 and 500),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index class_notifications_recipient_created
  on public.class_notifications (recipient_user_id, created_at desc);

alter table public.class_notifications enable row level security;

create policy "Users can read their class notifications"
  on public.class_notifications for select to authenticated
  using (recipient_user_id = (select auth.uid()));

create policy "Users can mark their class notifications read"
  on public.class_notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()))
  with check (
    recipient_user_id = (select auth.uid())
    and read_at is not null
  );

revoke all on public.class_notifications from anon, authenticated;
grant select on public.class_notifications to authenticated;
grant update (read_at) on public.class_notifications to authenticated;

create function public.write_class_notification(
  p_booking_id uuid,
  p_recipient_user_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_title text,
  p_message text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.class_notifications (
    booking_id,
    recipient_user_id,
    actor_user_id,
    event_type,
    title,
    message
  )
  values (
    p_booking_id,
    p_recipient_user_id,
    p_actor_user_id,
    p_event_type,
    p_title,
    p_message
  );
$$;

create or replace function public.list_tutor_available_slots(
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
          and booking.status in ('pending_confirmation', 'confirmed', 'reschedule_pending')
          and (
            booking.starts_at = (
              (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
            )
            or booking.proposed_starts_at = (
              (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
            )
          )
      )
    order by (
      (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
    );
end;
$$;

create or replace function public.request_class_booking(
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

  perform 1
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
  for update of tutor;
  if not found then
    raise exception 'Verified tutor access is required';
  end if;

  if not exists (
    select 1
    from public.tutor_weekly_availability as availability
    where availability.tutor_user_id = p_tutor_user_id
      and availability.weekday = extract(dow from local_start)::smallint
      and availability.start_time = local_start::time
      and availability.mode = p_mode
  ) then
    raise exception 'The requested time is no longer available';
  end if;

  if exists (
    select 1 from public.class_bookings as booking
    where booking.tutor_user_id = p_tutor_user_id
      and booking.status in ('pending_confirmation', 'confirmed', 'reschedule_pending')
      and (
        booking.starts_at = p_starts_at
        or booking.proposed_starts_at = p_starts_at
      )
  ) then
    raise exception 'Ese horario acaba de ser solicitado por otra persona. Elige otro horario.';
  end if;

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

  perform public.write_class_notification(
    booking_id,
    p_tutor_user_id,
    current_user_id,
    'request_received',
    'Nueva solicitud de clase',
    'Un Alumno solicitó una clase. Revisa la fecha y confirma o rechaza la solicitud.'
  );

  return booking_id;
end;
$$;

drop function public.list_my_class_bookings();
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
  status text,
  cancellation_reason text,
  cancelled_by uuid,
  reschedule_proposed_by uuid,
  proposed_starts_at timestamptz,
  proposed_mode text,
  proposed_location text
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
      booking.status,
      booking.cancellation_reason,
      booking.cancelled_by,
      booking.reschedule_proposed_by,
      booking.proposed_starts_at,
      booking.proposed_mode,
      booking.proposed_location
    from public.class_bookings as booking
    join public.profiles as tutor_profile on tutor_profile.id = booking.tutor_user_id
    join public.profiles as student_profile on student_profile.id = booking.student_user_id
    where booking.tutor_user_id = current_user_id
      or booking.student_user_id = current_user_id
    order by booking.starts_at desc;
end;
$$;

create or replace function public.respond_to_class_booking(
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
  booking public.class_bookings%rowtype;
  notification_title text;
  notification_message text;
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

  select * into booking
  from public.class_bookings
  where id = p_booking_id
    and tutor_user_id = current_user_id
    and status = 'pending_confirmation'
  for update;
  if not found then
    raise exception 'The pending booking was not found';
  end if;

  update public.class_bookings
  set status = p_status
  where id = p_booking_id;

  if p_status = 'confirmed' then
    notification_title := 'Solicitud confirmada';
    notification_message := 'El Tutor confirmó tu solicitud de clase.';
  else
    notification_title := 'Solicitud rechazada';
    notification_message := 'El Tutor no pudo aceptar tu solicitud. Puedes elegir otro horario.';
  end if;
  perform public.write_class_notification(
    p_booking_id,
    booking.student_user_id,
    current_user_id,
    case when p_status = 'confirmed' then 'request_confirmed' else 'request_rejected' end,
    notification_title,
    notification_message
  );
end;
$$;

create function public.cancel_class_booking(
  p_booking_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  booking public.class_bookings%rowtype;
  other_user_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role in ('alumno', 'tutor')
  ) then
    raise exception 'Authenticated student or tutor access is required';
  end if;

  select * into booking
  from public.class_bookings as class_booking
  where class_booking.id = p_booking_id
    and (
      class_booking.student_user_id = current_user_id
      or class_booking.tutor_user_id = current_user_id
    )
    and status in ('pending_confirmation', 'confirmed', 'reschedule_pending')
  for update;
  if not found then
    raise exception 'The active class booking was not found';
  end if;

  if booking.starts_at <= now() + interval '24 hours' then
    raise exception 'La clase solo se puede cancelar con más de 24 horas de anticipación.';
  end if;
  if p_reason is not null and length(btrim(p_reason)) > 500 then
    raise exception 'La razón de cancelación no puede superar 500 caracteres.';
  end if;

  other_user_id := case
    when booking.student_user_id = current_user_id then booking.tutor_user_id
    else booking.student_user_id
  end;
  update public.class_bookings
  set status = 'cancelled',
      cancelled_by = current_user_id,
      cancellation_reason = nullif(btrim(p_reason), ''),
      reschedule_proposed_by = null,
      proposed_starts_at = null,
      proposed_ends_at = null,
      proposed_mode = null,
      proposed_location = null
  where id = p_booking_id;

  perform public.write_class_notification(
    p_booking_id,
    other_user_id,
    current_user_id,
    'booking_cancelled',
    'Clase cancelada',
    'La otra persona canceló la clase programada.'
  );
end;
$$;

create function public.list_class_reschedule_slots(p_booking_id uuid)
returns table (starts_at timestamptz, mode text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  booking public.class_bookings%rowtype;
  local_today date := (now() at time zone 'America/Merida')::date;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role in ('alumno', 'tutor')
  ) then
    raise exception 'Authenticated student or tutor access is required';
  end if;

  select * into booking
  from public.class_bookings
  where id = p_booking_id
    and (student_user_id = current_user_id or tutor_user_id = current_user_id);
  if not found then
    raise exception 'The class booking was not found';
  end if;
  if booking.status <> 'confirmed' then
    raise exception 'Only confirmed classes can be rescheduled';
  end if;
  if booking.starts_at <= now() + interval '24 hours' then
    raise exception 'La clase solo se puede reprogramar con más de 24 horas de anticipación.';
  end if;

  return query
    select
      (generated_days.local_day + availability.start_time) at time zone 'America/Merida',
      availability.mode
    from generate_series(
      local_today::timestamp,
      (local_today + 29)::timestamp,
      interval '1 day'
    ) as generated_days(local_day)
    join public.tutor_weekly_availability as availability
      on availability.tutor_user_id = booking.tutor_user_id
      and availability.weekday = extract(dow from generated_days.local_day)::smallint
    where ((generated_days.local_day + availability.start_time) at time zone 'America/Merida') > now()
      and (
        (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
      ) <> booking.starts_at
      and not exists (
        select 1
        from public.class_bookings as other_booking
        where other_booking.id <> booking.id
          and other_booking.tutor_user_id = booking.tutor_user_id
          and other_booking.status in ('pending_confirmation', 'confirmed', 'reschedule_pending')
          and (
            other_booking.starts_at = (
              (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
            )
            or other_booking.proposed_starts_at = (
              (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
            )
          )
      )
    order by (
      (generated_days.local_day + availability.start_time) at time zone 'America/Merida'
    );
end;
$$;

create function public.propose_class_reschedule(
  p_booking_id uuid,
  p_starts_at timestamptz,
  p_mode text,
  p_location text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  booking public.class_bookings%rowtype;
  local_start timestamp;
  other_user_id uuid;
  tutor_user_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role in ('alumno', 'tutor')
  ) then
    raise exception 'Authenticated student or tutor access is required';
  end if;
  if p_starts_at is null
    or p_mode is null
    or p_mode not in ('Presencial', 'En línea')
    or (p_mode = 'Presencial' and (
      nullif(btrim(p_location), '') is null or length(p_location) > 300
    ))
    or (p_mode = 'En línea' and p_location is not null) then
    raise exception 'Invalid reschedule details';
  end if;

  select class_booking.tutor_user_id into tutor_user_id
  from public.class_bookings as class_booking
  where class_booking.id = p_booking_id
    and (class_booking.student_user_id = current_user_id or class_booking.tutor_user_id = current_user_id);
  if not found then
    raise exception 'The class booking was not found';
  end if;

  perform 1
  from public.tutor_profiles as tutor
  where tutor.user_id = tutor_user_id
    and tutor.verification_status = 'verified'
  for update;
  if not found then
    raise exception 'Verified tutor access is required';
  end if;

  select * into booking
  from public.class_bookings as class_booking
  where class_booking.id = p_booking_id
    and (
      class_booking.student_user_id = current_user_id
      or class_booking.tutor_user_id = current_user_id
    )
  for update;
  if not found then
    raise exception 'The class booking was not found';
  end if;
  if booking.status <> 'confirmed' then
    raise exception 'Only confirmed classes can be rescheduled';
  end if;
  if booking.starts_at <= now() + interval '24 hours' then
    raise exception 'La clase solo se puede reprogramar con más de 24 horas de anticipación.';
  end if;

  local_start := p_starts_at at time zone 'America/Merida';
  if p_starts_at <= now()
    or local_start::date > ((now() at time zone 'America/Merida')::date + 29)
    or local_start <> date_trunc('hour', local_start)
    or p_starts_at = booking.starts_at then
    raise exception 'The proposed time is outside the booking window';
  end if;

  if not exists (
    select 1
    from public.tutor_weekly_availability as availability
    where availability.tutor_user_id = booking.tutor_user_id
      and availability.weekday = extract(dow from local_start)::smallint
      and availability.start_time = local_start::time
      and availability.mode = p_mode
  ) then
    raise exception 'El horario propuesto ya no está disponible.';
  end if;

  if exists (
    select 1
    from public.class_bookings as other_booking
    where other_booking.id <> booking.id
      and other_booking.tutor_user_id = booking.tutor_user_id
      and other_booking.status in ('pending_confirmation', 'confirmed', 'reschedule_pending')
      and (
        other_booking.starts_at = p_starts_at
        or other_booking.proposed_starts_at = p_starts_at
      )
  ) then
    raise exception 'El horario propuesto ya está ocupado.';
  end if;

  other_user_id := case
    when booking.student_user_id = current_user_id then booking.tutor_user_id
    else booking.student_user_id
  end;
  update public.class_bookings
  set status = 'reschedule_pending',
      reschedule_proposed_by = current_user_id,
      proposed_starts_at = p_starts_at,
      proposed_ends_at = p_starts_at + interval '1 hour',
      proposed_mode = p_mode,
      proposed_location = case when p_mode = 'Presencial' then btrim(p_location) else null end
  where id = p_booking_id;

  perform public.write_class_notification(
    p_booking_id,
    other_user_id,
    current_user_id,
    'reschedule_proposed',
    'Propuesta de cambio de horario',
    'La otra persona propuso un nuevo horario. La fecha actual sigue reservada hasta que respondas.'
  );
end;
$$;

create function public.respond_to_class_reschedule(
  p_booking_id uuid,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  booking public.class_bookings%rowtype;
  proposer_name text;
  booking_tutor_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role in ('alumno', 'tutor')
  ) then
    raise exception 'Authenticated student or tutor access is required';
  end if;
  if p_response is null or p_response not in ('accept', 'reject') then
    raise exception 'Unsupported reschedule response';
  end if;

  select class_booking.tutor_user_id into booking_tutor_id
  from public.class_bookings as class_booking
  where class_booking.id = p_booking_id
    and (class_booking.student_user_id = current_user_id or class_booking.tutor_user_id = current_user_id)
    and class_booking.status = 'reschedule_pending';
  if not found then
    raise exception 'The pending reschedule proposal was not found';
  end if;

  perform 1
  from public.tutor_profiles as tutor
  where tutor.user_id = booking_tutor_id
  for update;

  select * into booking
  from public.class_bookings as class_booking
  where class_booking.id = p_booking_id
    and (
      class_booking.student_user_id = current_user_id
      or class_booking.tutor_user_id = current_user_id
    )
    and class_booking.status = 'reschedule_pending'
  for update;
  if not found then
    raise exception 'The pending reschedule proposal was not found';
  end if;
  if booking.reschedule_proposed_by = current_user_id then
    raise exception 'The proposer cannot accept their own reschedule proposal';
  end if;

  if p_response = 'accept' then
    update public.class_bookings
    set starts_at = proposed_starts_at,
        ends_at = proposed_ends_at,
        mode = proposed_mode,
        location = proposed_location,
        status = 'confirmed',
        reschedule_proposed_by = null,
        proposed_starts_at = null,
        proposed_ends_at = null,
        proposed_mode = null,
        proposed_location = null
    where id = p_booking_id;
  else
    update public.class_bookings
    set status = 'confirmed',
        reschedule_proposed_by = null,
        proposed_starts_at = null,
        proposed_ends_at = null,
        proposed_mode = null,
        proposed_location = null
    where id = p_booking_id;
  end if;

  proposer_name := case
    when booking.reschedule_proposed_by = booking.student_user_id then 'El Alumno'
    else 'El Tutor'
  end;
  perform public.write_class_notification(
    p_booking_id,
    booking.reschedule_proposed_by,
    current_user_id,
    case when p_response = 'accept' then 'reschedule_accepted' else 'reschedule_rejected' end,
    case when p_response = 'accept' then 'Cambio de horario aceptado' else 'Cambio de horario rechazado' end,
    case
      when p_response = 'accept' then proposer_name || ' aceptó el nuevo horario.'
      else proposer_name || ' rechazó el nuevo horario. La clase conserva su fecha original.'
    end
  );
end;
$$;

create function public.complete_class_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  booking public.class_bookings%rowtype;
begin
  if current_user_id is null or not exists (
    select 1 from public.user_roles
    where user_id = current_user_id and role = 'tutor'
  ) then
    raise exception 'Tutor access is required';
  end if;

  select * into booking
  from public.class_bookings
  where id = p_booking_id
    and tutor_user_id = current_user_id
    and status = 'confirmed'
  for update;
  if not found then
    raise exception 'The confirmed class booking was not found';
  end if;
  if booking.ends_at > now() then
    raise exception 'La clase solo puede marcarse como realizada después de su hora de término.';
  end if;

  update public.class_bookings
  set status = 'completed',
      completed_at = now()
  where id = p_booking_id;

  perform public.write_class_notification(
    p_booking_id,
    booking.student_user_id,
    current_user_id,
    'class_completed',
    'Clase marcada como realizada',
    'El Tutor marcó la clase como realizada.'
  );
end;
$$;

revoke all on function public.write_class_notification(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.list_class_reschedule_slots(uuid) from public, anon;
revoke all on function public.propose_class_reschedule(uuid, timestamptz, text, text) from public, anon;
revoke all on function public.respond_to_class_reschedule(uuid, text) from public, anon;
revoke all on function public.cancel_class_booking(uuid, text) from public, anon;
revoke all on function public.complete_class_booking(uuid) from public, anon;
grant execute on function public.list_class_reschedule_slots(uuid) to authenticated;
grant execute on function public.propose_class_reschedule(uuid, timestamptz, text, text) to authenticated;
grant execute on function public.respond_to_class_reschedule(uuid, text) to authenticated;
grant execute on function public.cancel_class_booking(uuid, text) to authenticated;
grant execute on function public.complete_class_booking(uuid) to authenticated;
grant execute on function public.list_my_class_bookings() to authenticated;
