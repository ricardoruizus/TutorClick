-- Adjuntos reales en mensajes: el archivo binario se sube a Supabase Storage
-- (bucket privado message-attachments) y solo se guarda su ruta en la base de datos.
-- Aplícala después de 20261125093000_persist_conversations.sql.
-- El nombre del archivo se sigue guardando en attachment_name como antes.

alter table public.conversation_messages
  add column attachment_path text check (
    attachment_path is null or length(btrim(attachment_path)) between 1 and 500
  ),
  add column attachment_type text check (
    attachment_type is null or length(btrim(attachment_type)) between 1 and 100
  ),
  add column attachment_size integer check (
    attachment_size is null or attachment_size between 1 and 10485760
  ),
  add constraint conversation_messages_attachment_consistent check (
    (attachment_path is null and attachment_type is null and attachment_size is null)
    or (attachment_path is not null and attachment_name is not null)
  );

-- El archivo se guarda en message-attachments/<id de la conversación>/<uuid>-<nombre>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'message-attachments',
  'message-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Solo los participantes de la conversación pueden subir, leer o borrar sus archivos.
-- La primera carpeta del archivo es siempre el id de la conversación.
drop policy if exists "Conversation participants can upload message attachments"
  on storage.objects;
create policy "Conversation participants can upload message attachments"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = (storage.foldername(name))[1]::uuid
        and (
          conversation.student_user_id = (select auth.uid())
          or conversation.tutor_user_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Conversation participants can read message attachments"
  on storage.objects;
create policy "Conversation participants can read message attachments"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = (storage.foldername(name))[1]::uuid
        and (
          conversation.student_user_id = (select auth.uid())
          or conversation.tutor_user_id = (select auth.uid())
        )
    )
  );

drop policy if exists "Conversation participants can delete message attachments"
  on storage.objects;
create policy "Conversation participants can delete message attachments"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'message-attachments'
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = (storage.foldername(name))[1]::uuid
        and (
          conversation.student_user_id = (select auth.uid())
          or conversation.tutor_user_id = (select auth.uid())
        )
    )
  );

-- Nueva versión de send_conversation_message: acepta la ruta, el tipo y el tamaño
-- del archivo ya subido. Los tres parámetros tienen valor por defecto, así que las
-- llamadas viejas (solo texto y nombre) siguen funcionando.
drop function if exists public.send_conversation_message(uuid, text, text);

create function public.send_conversation_message(
  p_conversation_id uuid,
  p_content text,
  p_attachment_name text default null,
  p_attachment_path text default null,
  p_attachment_type text default null,
  p_attachment_size integer default null
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
  cleaned_path text := nullif(btrim(p_attachment_path), '');
  cleaned_type text := nullif(btrim(p_attachment_type), '');
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

  if cleaned_path is not null then
    if cleaned_attachment is null
      or cleaned_type is null
      or p_attachment_size is null
      or p_attachment_size < 1
      or p_attachment_size > 10485760
      or length(cleaned_path) > 500
      or cleaned_path not like p_conversation_id::text || '/%'
      or cleaned_type not in (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp'
      ) then
      raise exception 'Invalid message attachment';
    end if;
  end if;

  insert into public.conversation_messages (
    conversation_id,
    sender_user_id,
    content,
    attachment_name,
    attachment_path,
    attachment_type,
    attachment_size
  )
  values (
    p_conversation_id,
    current_user_id,
    cleaned_content,
    cleaned_attachment,
    cleaned_path,
    cleaned_type,
    p_attachment_size
  )
  returning id into message_id;

  update public.conversations
  set last_message_at = now()
  where id = p_conversation_id;

  return message_id;
end;
$$;

revoke all on function public.send_conversation_message(uuid, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.send_conversation_message(uuid, text, text, text, text, integer) to authenticated;
