-- Provisionnement auto à l'inscription : profil + organisation + membership owner.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (user_id) do nothing;

  insert into public.organizations (name, created_by)
  values (coalesce(nullif(new.raw_user_meta_data->>'org_name', ''), 'Mon garage'), new.id)
  returning id into v_org;

  insert into public.memberships (org_id, user_id, role)
  values (v_org, new.id, 'owner')
  on conflict (org_id, user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
