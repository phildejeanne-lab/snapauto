-- CRM : fiches clients (contacts) + lien dossier → client.

create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  kind        text not null default 'physique' check (kind in ('physique', 'morale')),
  name        text,              -- "TRAMOY LAETITIA" ou raison sociale
  birth_date  text,
  cp          text,
  commune     text,
  siren       text,
  data        jsonb,             -- le Person complet (pour pré-remplissage)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists contacts_org_idx on public.contacts(org_id);
-- Aide au dédoublonnage (nom + date de naissance par org)
create index if not exists contacts_dedup_idx on public.contacts(org_id, lower(name), coalesce(birth_date, ''));

alter table public.dossiers
  add column if not exists contact_id uuid references public.contacts(id) on delete set null;

-- updated_at auto
drop trigger if exists trg_contacts_touch on public.contacts;
create trigger trg_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();

-- RLS : accès par membre de l'org
alter table public.contacts enable row level security;
drop policy if exists contacts_member_all on public.contacts;
create policy contacts_member_all on public.contacts for all
  using (public.is_org_member(org_id) or public.is_platform_admin())
  with check (public.is_org_member(org_id));
