create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references auth.users (id) on delete cascade,
  tutor_user_id uuid not null references auth.users (id) on delete cascade,
  student_name text not null check (length(btrim(student_name)) between 1 and 120),
  tutor_name text not null check (length(btrim(tutor_name)) between 1 and 120),
  subject text not null check (length(btrim(subject)) between 1 and 150),
  linked_session_id text not null default '' check (length(linked_session_id) <= 120),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (student_user_id <> tutor_user_id),
  constraint conversations_participant_pair_unique unique (student_user_id, tutor_user_id)
);

create index conversations_student_activity
  on public.conversations (student_user_id, last_message_at desc);
create index conversations_tutor_activity
  on public.conversations (tutor_user_id, last_message_at desc);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (length(content) <= 4000),
  attachment_name text check (
    attachment_name is null or length(btrim(attachment_name)) between 1 and 255
  ),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint conversation_messages_not_empty check (
    length(btrim(content)) > 0 or attachment_name is not null
  )
);

create index conversation_messages_activity
  on public.conversation_messages (conversation_id, created_at);
create index conversation_messages_unread
  on public.conversation_messages (conversation_id, sender_user_id, read_at)
  where read_at is null;

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "Participants can read their conversations"
  on public.conversations for select to authenticated
  using (
    student_user_id = (select auth.uid())
    or tutor_user_id = (select auth.uid())
  );

create policy "Participants can read conversation messages"
  on public.conversation_messages for select to authenticated
  using (
    exists (
      select 1
      from public.conversations as conversation
      where conversation.id = conversation_id
        and (
          conversation.student_user_id = (select auth.uid())
          or conversation.tutor_user_id = (select auth.uid())
        )
    )
  );

revoke all on public.conversations from anon, authenticated;
grant select on public.conversations to authenticated;
revoke all on public.conversation_messages from anon, authenticated;
grant select on public.conversation_messages to authenticated;

create function public.create_or_get_conversation(
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
  set linked_session_id = case
        when excluded.linked_session_id <> '' then excluded.linked_session_id
    else existing_conversation.linked_session_id
      end
  returning id into conversation_id;

  return conversation_id;
end;
$$;

create function public.send_conversation_message(
  p_conversation_id uuid,
  p_content text,
  p_attachment_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  message_id uuid;
  cleaned_content text := btrim(coalesce(p_content, ''));
  cleaned_attachment text := nullif(btrim(p_attachment_name), '');
begin
  if current_user_id is null or not exists (
    select 1
    from public.conversations as conversation
    where conversation.id = p_conversation_id
      and current_user_id in (conversation.student_user_id, conversation.tutor_user_id)
  ) then
    raise exception 'Conversation participant access is required';
  end if;

  if length(cleaned_content) > 4000
    or (cleaned_content = '' and cleaned_attachment is null)
    or length(coalesce(cleaned_attachment, '')) > 255 then
    raise exception 'Invalid message content';
  end if;

  insert into public.conversation_messages (
    conversation_id,
    sender_user_id,
    content,
    attachment_name
  )
  values (
    p_conversation_id,
    current_user_id,
    cleaned_content,
    cleaned_attachment
  )
  returning id into message_id;

  update public.conversations
  set last_message_at = now()
  where id = p_conversation_id;

  return message_id;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (
    select 1
    from public.conversations as conversation
    where conversation.id = p_conversation_id
      and current_user_id in (conversation.student_user_id, conversation.tutor_user_id)
  ) then
    raise exception 'Conversation participant access is required';
  end if;

  update public.conversation_messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_user_id <> current_user_id
    and read_at is null;
end;
$$;

revoke all on function public.create_or_get_conversation(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.send_conversation_message(uuid, text, text) from public, anon, authenticated;
revoke all on function public.mark_conversation_read(uuid) from public, anon, authenticated;
grant execute on function public.create_or_get_conversation(uuid, uuid, text, text) to authenticated;
grant execute on function public.send_conversation_message(uuid, text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
