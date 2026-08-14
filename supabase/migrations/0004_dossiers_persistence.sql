-- Persistance des dossiers : stockage du CerfaDossier + colonnes de listing + lien reprise.

alter table public.dossiers
  add column if not exists operation text check (operation in ('achat', 'vente')),
  add column if not exists immat text,
  add column if not exists data jsonb,
  add column if not exists linked_dossier_id uuid references public.dossiers(id) on delete set null;

create index if not exists dossiers_created_idx on public.dossiers(org_id, created_at desc);
