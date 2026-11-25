create or replace function public.create_or_get_conversation(
  p_student_user_id uuid,
  p_tutor_user_id uuid,
  p_subject text,
  p_linked_session_id text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  student_name text;
  tutor_name text;
  conversation_id uuid;
begin
  if current_user_id is null
    or current_user_id not in (p_student_user_id, p_tutor_user_id)
    or p_student_user_id = p_tutor_user_id then
    raise exception 'Conversation participant access is required';
  end if;

  if p_subject is null or nullif(btrim(p_subject), '') is null or length(p_subject) > 150
    or length(coalesce(p_linked_session_id, '')) > 120 then
    raise exception 'Invalid conversation details';
  end if;

  if not exists (
    select 1
    from public.user_roles as student_role
    where student_role.user_id = p_student_user_id
      and student_role.role = 'alumno'
  ) or not exists (
    select 1
    from public.user_roles as tutor_role
    where tutor_role.user_id = p_tutor_user_id
      and tutor_role.role = 'tutor'
  ) then
    raise exception 'A student and a tutor are required';
  end if;

  select profile.full_name into student_name
  from public.profiles as profile
  where profile.id = p_student_user_id;

  select profile.full_name into tutor_name
  from public.profiles as profile
  where profile.id = p_tutor_user_id;

  if student_name is null or tutor_name is null then
    raise exception 'Conversation participant profiles were not found';
  end if;

  insert into public.conversations as existing_conversation (
    student_user_id,
    tutor_user_id,
    student_name,
    tutor_name,
    subject,
    linked_session_id
  )
  values (
    p_student_user_id,
    p_tutor_user_id,
    student_name,
    tutor_name,
    btrim(p_subject),
    coalesce(p_linked_session_id, '')
  )
  on conflict (student_user_id, tutor_user_id) do update
  set student_name = excluded.student_name,
      tutor_name = excluded.tutor_name,
      subject = excluded.subject,
      linked_session_id = excluded.linked_session_id
  returning id into conversation_id;

  return conversation_id;
end;
$$;

revoke all on function public.create_or_get_conversation(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_or_get_conversation(uuid, uuid, text, text)
  to authenticated;
