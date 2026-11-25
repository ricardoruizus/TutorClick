-- Tiempo real: permite que Supabase Realtime avise cuando llega un mensaje nuevo,
-- cambia una reserva o llega una notificación de clase, sin recargar la página.
-- Aplícala después de 20261125100000_message_attachments.sql.
-- replica identity full es necesario para que Realtime incluya la fila completa
-- también en los eventos de actualización y borrado.

alter table public.conversation_messages replica identity full;
alter table public.conversations replica identity full;
alter table public.class_bookings replica identity full;
alter table public.class_notifications replica identity full;

-- Añade las tablas a la publicación de Realtime solo si todavía no están.
-- (Si alguna ya estaba, el bloque no falla y no la duplica.)
do $$
declare
  table_name text;
begin
  for table_name in
    select unnest(array[
      'conversation_messages',
      'conversations',
      'class_bookings',
      'class_notifications'
    ]::text[])
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
