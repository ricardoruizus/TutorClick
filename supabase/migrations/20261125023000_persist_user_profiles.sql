create table public.student_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  career text,
  preferred_mode text check (
    preferred_mode is null
    or preferred_mode in ('Presencial', 'En línea', 'Presencial y en línea')
  ),
  service_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  biography text check (biography is null or length(biography) <= 500),
  subjects text[] not null default '{}',
  education_level text,
  hourly_rate_mxn numeric(10, 2) check (
    hourly_rate_mxn is null or hourly_rate_mxn between 100 and 1000
  ),
  class_modes text[] not null default '{}'
    check (class_modes <@ array['Presencial', 'En línea']::text[]),
  service_zone text,
  travel_radius_km smallint check (
    travel_radius_km is null or travel_radius_km between 1 and 30
  ),
  title_document_path text,
  license_document_path text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'in_review', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;
alter table public.tutor_profiles enable row level security;

create policy "Students can read their own profile"
  on public.student_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can update their own profile"
  on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Tutors can read their own profile"
  on public.tutor_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Tutors can update their own profile"
  on public.tutor_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.student_profiles from anon, authenticated;
grant select on public.student_profiles to authenticated;
grant update (career, preferred_mode, service_zone) on public.student_profiles to authenticated;

revoke all on public.tutor_profiles from anon, authenticated;
grant select on public.tutor_profiles to authenticated;
grant update (
  biography,
  subjects,
  education_level,
  hourly_rate_mxn,
  class_modes,
  service_zone,
  travel_radius_km,
  title_document_path,
  license_document_path
) on public.tutor_profiles to authenticated;

create trigger student_profiles_set_updated_at
  before update on public.student_profiles
  for each row execute function public.set_updated_at();

create trigger tutor_profiles_set_updated_at
  before update on public.tutor_profiles
  for each row execute function public.set_updated_at();

create function public.reset_tutor_verification_on_credential_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title_document_path is distinct from old.title_document_path
    or new.license_document_path is distinct from old.license_document_path then
    new.verification_status := 'pending';
  end if;
  return new;
end;
$$;

create trigger tutor_credentials_reset_verification
  before update of title_document_path, license_document_path on public.tutor_profiles
  for each row execute function public.reset_tutor_verification_on_credential_change();

create function public.update_student_account(
  p_user_id uuid,
  profile_name text,
  profile_career text,
  profile_preferred_mode text,
  profile_service_zone text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if p_user_id is distinct from current_user_id then
    raise exception 'Cannot update another student profile';
  end if;

  if profile_preferred_mode not in ('Presencial', 'En línea', 'Presencial y en línea') then
    raise exception 'Invalid preferred mode';
  end if;

  update public.profiles
  set full_name = nullif(btrim(profile_name), '')
  where id = current_user_id;

  update public.student_profiles
  set career = nullif(btrim(profile_career), ''),
      preferred_mode = profile_preferred_mode,
      service_zone = nullif(btrim(profile_service_zone), '')
  where user_id = current_user_id;

  if not found then
    raise exception 'Student profile not found';
  end if;
end;
$$;

revoke all on function public.update_student_account(uuid, text, text, text, text) from public, anon;
grant execute on function public.update_student_account(uuid, text, text, text, text) to authenticated;

insert into public.student_profiles (user_id)
select user_id from public.user_roles where role = 'alumno'
on conflict (user_id) do nothing;

insert into public.tutor_profiles (user_id)
select user_id from public.user_roles where role = 'tutor'
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
  profile_name text;
  preferred_mode text;
  requested_subjects text[];
  requested_modes text[];
  requested_rate numeric(10, 2);
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'tutor' then 'tutor'::public.app_role
    else 'alumno'::public.app_role
  end;
  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario'
  );

  insert into public.profiles (id, full_name)
  values (new.id, profile_name);

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  if requested_role = 'alumno' then
    preferred_mode := case new.raw_user_meta_data ->> 'preferred_mode'
      when 'Presencial' then 'Presencial'
      when 'En línea' then 'En línea'
      when 'Híbrida' then 'Presencial y en línea'
      when 'Presencial y en línea' then 'Presencial y en línea'
      else null
    end;

    insert into public.student_profiles (user_id, career, preferred_mode)
    values (
      new.id,
      nullif(btrim(new.raw_user_meta_data ->> 'career'), ''),
      preferred_mode
    );
  else
    select coalesce(array_agg(value), '{}'::text[])
    into requested_subjects
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.raw_user_meta_data -> 'subjects') = 'array'
          then new.raw_user_meta_data -> 'subjects'
        else '[]'::jsonb
      end
    ) as item(value)
    where length(btrim(value)) between 1 and 80;

    select coalesce(array_agg(value), '{}'::text[])
    into requested_modes
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(new.raw_user_meta_data -> 'class_modes') = 'array'
          then new.raw_user_meta_data -> 'class_modes'
        else '[]'::jsonb
      end
    ) as item(value)
    where value in ('Presencial', 'En línea');

    if (new.raw_user_meta_data ->> 'hourly_rate_mxn') ~ '^\d{1,8}(\.\d{1,2})?$' then
      requested_rate := (new.raw_user_meta_data ->> 'hourly_rate_mxn')::numeric(10, 2);
    end if;

    insert into public.tutor_profiles (
      user_id,
      biography,
      subjects,
      education_level,
      hourly_rate_mxn,
      class_modes,
      service_zone,
      travel_radius_km
    )
    values (
      new.id,
      nullif(left(btrim(new.raw_user_meta_data ->> 'biography'), 500), ''),
      requested_subjects,
      nullif(btrim(new.raw_user_meta_data ->> 'education_level'), ''),
      requested_rate,
      requested_modes,
      nullif(btrim(new.raw_user_meta_data ->> 'service_zone'), ''),
      case
        when (new.raw_user_meta_data ->> 'travel_radius_km') ~ '^\d{1,2}$'
          then (new.raw_user_meta_data ->> 'travel_radius_km')::smallint
        else null
      end
    );
  end if;

  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutor-credentials',
  'tutor-credentials',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Tutors can upload their own credentials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tutor-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Tutors and admins can read credentials"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tutor-credentials'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.user_roles
        where user_id = (select auth.uid())
          and role = 'admin'
      )
    )
  );

create policy "Tutors can delete their own credentials"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tutor-credentials'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
