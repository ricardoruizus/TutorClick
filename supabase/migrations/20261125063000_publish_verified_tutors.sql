create function public.can_read_published_tutor_avatar(p_tutor_user_id text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.user_roles as role
      where role.user_id = auth.uid()
        and role.role = 'alumno'
    )
    and exists (
      select 1
      from public.tutor_profiles as tutor
      where tutor.user_id::text = p_tutor_user_id
        and tutor.verification_status = 'verified'
    );
$$;

revoke all on function public.can_read_published_tutor_avatar(text) from public, anon;
grant execute on function public.can_read_published_tutor_avatar(text) to authenticated;

create policy "Authenticated users can read verified tutor avatars"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tutor-avatars'
    and public.can_read_published_tutor_avatar((storage.foldername(name))[1])
  );

create function public.list_published_tutors()
returns table (
  user_id uuid,
  full_name text,
  avatar_path text,
  biography text,
  subjects text[],
  education_level text,
  hourly_rate_mxn numeric,
  class_modes text[],
  service_zone text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1
    from public.user_roles
    where user_id = current_user_id
      and role = 'alumno'
  ) then
    raise exception 'Student access is required';
  end if;

  return query
    select
      tutor.user_id,
      profile.full_name,
      profile.avatar_path,
      tutor.biography,
      tutor.subjects,
      tutor.education_level,
      tutor.hourly_rate_mxn,
      tutor.class_modes,
      tutor.service_zone
    from public.tutor_profiles as tutor
    join public.profiles as profile on profile.id = tutor.user_id
    where tutor.verification_status = 'verified'
      and nullif(btrim(profile.full_name), '') is not null
      and nullif(btrim(tutor.biography), '') is not null
      and cardinality(tutor.subjects) > 0
      and tutor.hourly_rate_mxn is not null
      and cardinality(tutor.class_modes) > 0
      and nullif(btrim(tutor.service_zone), '') is not null
    order by profile.full_name;
end;
$$;

revoke all on function public.list_published_tutors() from public, anon;
grant execute on function public.list_published_tutors() to authenticated;
