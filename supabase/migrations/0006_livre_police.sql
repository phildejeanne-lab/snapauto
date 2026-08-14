-- Livre de police : registre des mouvements de véhicules d'occasion (obligation légale négociant).
-- Journal chronologique numéroté : entrée (achat) / sortie (vente). Snapshot immuable au moment de l'enregistrement.

create table if not exists public.livre_police (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  num           integer not null,                 -- n° d'ordre séquentiel par org
  sens          text not null check (sens in ('entree', 'sortie')),
  dossier_id    uuid references public.dossiers(id) on delete set null,
  recorded_at   timestamptz not null default now(),
  -- Snapshot véhicule
  marque        text,
  type          text,
  vin           text,
  immat         text,
  date_immat    text,     -- date 1re immatriculation
  km            text,
  -- Snapshot contrepartie (le particulier : vendeur si entrée, acheteur si sortie)
  person_name   text,
  person_address text,
  unique (org_id, num)
);
create index if not exists livre_police_org_idx on public.livre_police(org_id, num desc);

alter table public.livre_police enable row level security;
drop policy if exists lp_member_all on public.livre_police;
create policy lp_member_all on public.livre_police for all
  using (public.is_org_member(org_id) or public.is_platform_admin())
  with check (public.is_org_member(org_id));
