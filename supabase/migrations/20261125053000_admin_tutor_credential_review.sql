alter table public.tutor_profiles
  add column credential_submitted_at timestamptz,
  add column verification_reviewed_at timestamptz,
  add column verification_reviewed_by uuid references auth.users (id) on delete set null,
  add column verification_rejection_reason text
    check (
      verification_rejection_reason is null
      or length(verification_rejection_reason) <= 1000
    );

update public.tutor_profiles
set credential_submitted_at = coalesce(updated_at, created_at)
where credential_submitted_at is null
  and (title_document_path is not null or license_document_path is not null);

create policy "Admins can read tutor profiles for credential review"
  on public.tutor_profiles for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
  );

create policy "Admins can read tutor identities for credential review"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    )
    and exists (
      select 1
      from public.tutor_profiles
      where user_id = profiles.id
    )
  );

create or replace function public.reset_tutor_verification_on_credential_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.title_document_path is distinct from old.title_document_path
    or new.license_document_path is distinct from old.license_document_path then
    new.verification_status := 'pending';
    new.credential_submitted_at := now();
    new.verification_reviewed_at := null;
    new.verification_reviewed_by := null;
    new.verification_rejection_reason := null;
  end if;
  return new;
end;
$$;

create function public.review_tutor_credentials(
  p_tutor_user_id uuid,
  p_status text,
  p_rejection_reason text
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
    select 1
    from public.user_roles
    where user_id = current_user_id
      and role = 'admin'
  ) then
    raise exception 'Admin access is required';
  end if;

  if p_status is null or p_status not in ('verified', 'rejected') then
    raise exception 'Unsupported credential review status';
  end if;

  if p_status = 'rejected'
    and (nullif(btrim(p_rejection_reason), '') is null or length(p_rejection_reason) > 1000) then
    raise exception 'A rejection reason of at most 1000 characters is required';
  end if;

  update public.tutor_profiles
  set verification_status = p_status,
      verification_reviewed_at = now(),
      verification_reviewed_by = current_user_id,
      verification_rejection_reason = case
        when p_status = 'rejected' then btrim(p_rejection_reason)
        else null
      end
  where user_id = p_tutor_user_id
    and (title_document_path is not null or license_document_path is not null)
    and (
      p_status <> 'verified'
      or (title_document_path is not null and license_document_path is not null)
    );

  if not found then
    raise exception 'Tutor credentials were not found or are incomplete';
  end if;
end;
$$;

revoke all on function public.review_tutor_credentials(uuid, text, text) from public, anon;
grant execute on function public.review_tutor_credentials(uuid, text, text) to authenticated;
