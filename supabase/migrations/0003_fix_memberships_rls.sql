-- Corrige la récursion infinie des policies memberships :
-- les sous-requêtes directes sur memberships DANS une policy de memberships bouclent.
-- Solution : passer par une fonction SECURITY DEFINER (contourne la RLS en interne).

create or replace function public.is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.role in ('owner','admin')
  );
$$;

-- memberships : un user lit SES appartenances ; les admins gèrent via is_org_admin.
drop policy if exists memberships_read on public.memberships;
create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists memberships_manage on public.memberships;
create policy memberships_manage on public.memberships for all
  using (public.is_org_admin(org_id) or public.is_platform_admin())
  with check (public.is_org_admin(org_id) or public.is_platform_admin());

-- organizations : update sans sous-requête récursive.
drop policy if exists orgs_admin_update on public.organizations;
create policy orgs_admin_update on public.organizations for update
  using (public.is_org_admin(id) or public.is_platform_admin());
