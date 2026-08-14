-- SnapAuto — schéma initial (public)
-- Modèle "dossier au centre" : organizations / memberships / dossiers / vehicles / parties / documents
-- Multi-tenant avec RLS. À appliquer via `node scripts/db.mjs` ou l'éditeur SQL Supabase.

----------------------------------------------------------------------
-- Extensions
----------------------------------------------------------------------
create extension if not exists "pgcrypto";

----------------------------------------------------------------------
-- profiles : 1 ligne par utilisateur
----------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now()
);

----------------------------------------------------------------------
-- organizations : le client pro (garage / mandataire)
----------------------------------------------------------------------
create table if not exists public.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  siren          text,                 -- SIREN/SIRET du pro (Cerfa déclaration d'achat, mandat)
  agrement       text,                 -- n° d'agrément professionnel automobile
  address_line   text,
  postal_code    text,
  city           text,
  country        text not null default 'France',
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);

----------------------------------------------------------------------
-- memberships : lien user ↔ org, avec rôle
----------------------------------------------------------------------
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_org_idx  on public.memberships(org_id);

----------------------------------------------------------------------
-- platform_admins : super-admin back-office (toi)
----------------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

----------------------------------------------------------------------
-- dossiers : LA colonne vertébrale (une transaction achat-vente)
----------------------------------------------------------------------
create table if not exists public.dossiers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  reference   text,                    -- réf interne lisible (ex. SA-2026-0001)
  label       text,                    -- libellé libre (ex. "Peugeot 208 - M. Durand")
  status      text not null default 'draft'
              check (status in ('draft','ready','generated','archived')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists dossiers_org_idx on public.dossiers(org_id);

----------------------------------------------------------------------
-- vehicles : données véhicule (issues de la carte grise, codes EU 1999/37/CE)
----------------------------------------------------------------------
create table if not exists public.vehicles (
  id                    uuid primary key default gen_random_uuid(),
  dossier_id            uuid not null unique references public.dossiers(id) on delete cascade,
  immatriculation       text,   -- A
  first_registration    text,   -- B  (date 1re immatriculation)
  cert_date             text,   -- I  (date du certificat)
  brand                 text,   -- D.1 marque
  type_variant_version  text,   -- D.2
  commercial_name       text,   -- D.3 dénomination commerciale
  vin                   text,   -- E  n° de série
  ptac                  text,   -- F.2 masse en charge max admissible
  mass_service          text,   -- G.1 masse en service
  displacement_cc       text,   -- P.1 cylindrée
  power_kw              text,   -- P.2 puissance nette max
  fuel                  text,   -- P.3 énergie
  fiscal_power          text,   -- P.6 puissance administrative (CV)
  seats                 text,   -- S.1 nombre de places
  co2                   text,   -- V.7 CO2
  raw                   jsonb,  -- extraction brute complète
  created_at            timestamptz not null default now()
);

----------------------------------------------------------------------
-- parties : personnes de la transaction (état civil ← CNI ; adresse ← CG)
----------------------------------------------------------------------
create table if not exists public.parties (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.dossiers(id) on delete cascade,
  role          text not null check (role in ('vendeur','acheteur','mandant','mandataire')),
  kind          text not null default 'personne_physique'
                check (kind in ('personne_physique','personne_morale')),
  civility      text,
  last_name     text,
  birth_name    text,          -- nom de naissance (CNI)
  first_names   text,
  birth_date    text,          -- CNI
  birth_place   text,          -- CNI
  raison_sociale text,         -- personne morale
  siren         text,
  address_line  text,
  postal_code   text,
  city          text,
  country       text default 'France',
  raw           jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists parties_dossier_idx on public.parties(dossier_id);

----------------------------------------------------------------------
-- documents : scans sources + Cerfa générés
----------------------------------------------------------------------
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.dossiers(id) on delete cascade,
  kind          text not null check (kind in (
                  'source_carte_grise','source_cni',
                  'cerfa_15776','cerfa_13751','cerfa_13750','cerfa_13757')),
  storage_path  text,          -- chemin dans le bucket Supabase Storage
  extracted     jsonb,         -- résultat d'extraction (pour les sources)
  generated     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists documents_dossier_idx on public.documents(dossier_id);

----------------------------------------------------------------------
-- updated_at auto sur dossiers
----------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_dossiers_touch on public.dossiers;
create trigger trg_dossiers_touch before update on public.dossiers
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------------
-- Helpers RLS
----------------------------------------------------------------------
create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

-- membership d'un dossier (via son org)
create or replace function public.can_access_dossier(p_dossier uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.dossiers d
    join public.memberships m on m.org_id = d.org_id
    where d.id = p_dossier and m.user_id = auth.uid()
  );
$$;

----------------------------------------------------------------------
-- RLS
----------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.organizations   enable row level security;
alter table public.memberships     enable row level security;
alter table public.platform_admins enable row level security;
alter table public.dossiers        enable row level security;
alter table public.vehicles        enable row level security;
alter table public.parties         enable row level security;
alter table public.documents       enable row level security;

-- profiles : chacun le sien
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- organizations : visibles par leurs membres (ou platform admin)
drop policy if exists orgs_member_read on public.organizations;
create policy orgs_member_read on public.organizations for select
  using (public.is_org_member(id) or public.is_platform_admin());

drop policy if exists orgs_insert on public.organizations;
create policy orgs_insert on public.organizations for insert
  with check (created_by = auth.uid());

drop policy if exists orgs_admin_update on public.organizations;
create policy orgs_admin_update on public.organizations for update
  using (exists (select 1 from public.memberships m
    where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner','admin'))
    or public.is_platform_admin());

-- memberships : un user voit ses appartenances ; owners/admins gèrent l'org
drop policy if exists memberships_read on public.memberships;
create policy memberships_read on public.memberships for select
  using (user_id = auth.uid() or public.is_org_member(org_id) or public.is_platform_admin());

drop policy if exists memberships_manage on public.memberships;
create policy memberships_manage on public.memberships for all
  using (exists (select 1 from public.memberships m
    where m.org_id = memberships.org_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
    or public.is_platform_admin())
  with check (exists (select 1 from public.memberships m
    where m.org_id = memberships.org_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
    or public.is_platform_admin());

-- platform_admins : lecture seule par soi (géré hors app)
drop policy if exists platform_admins_self on public.platform_admins;
create policy platform_admins_self on public.platform_admins for select
  using (user_id = auth.uid());

-- dossiers : membres de l'org
drop policy if exists dossiers_member_all on public.dossiers;
create policy dossiers_member_all on public.dossiers for all
  using (public.is_org_member(org_id) or public.is_platform_admin())
  with check (public.is_org_member(org_id));

-- vehicles / parties / documents : via le dossier
drop policy if exists vehicles_via_dossier on public.vehicles;
create policy vehicles_via_dossier on public.vehicles for all
  using (public.can_access_dossier(dossier_id))
  with check (public.can_access_dossier(dossier_id));

drop policy if exists parties_via_dossier on public.parties;
create policy parties_via_dossier on public.parties for all
  using (public.can_access_dossier(dossier_id))
  with check (public.can_access_dossier(dossier_id));

drop policy if exists documents_via_dossier on public.documents;
create policy documents_via_dossier on public.documents for all
  using (public.can_access_dossier(dossier_id))
  with check (public.can_access_dossier(dossier_id));

----------------------------------------------------------------------
-- Storage : buckets privés (scans sources + PDF générés)
----------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scans','scans',false), ('generated','generated',false)
on conflict (id) do nothing;
