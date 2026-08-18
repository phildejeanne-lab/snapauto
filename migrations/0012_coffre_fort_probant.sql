-- Renforcement du coffre-fort (valeur probante, NON certifié NF Z42-020) :
--  - sha256 : scellement d'intégrité de chaque pièce
--  - retention : 'rgpd_2m' (pièces d'identité, minimisation RGPD) ou 'siv_5y'
--    (dossier d'immatriculation, conservation 5 ans)
--  - document_audit : journal append-only (ajout / consultation / suppression)

alter table public.dossier_documents
  add column if not exists sha256 text,
  add column if not exists retention text;

create table if not exists public.document_audit (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  dossier_id uuid,
  document_id uuid,
  filename text,
  action text not null, -- 'upload' | 'view' | 'delete'
  sha256 text,
  user_id uuid,
  at timestamptz not null default now()
);
create index if not exists document_audit_dossier_idx on public.document_audit(dossier_id);

alter table public.document_audit enable row level security;
drop policy if exists da_select on public.document_audit;
drop policy if exists da_insert on public.document_audit;
create policy da_select on public.document_audit for select using (public.is_org_member(org_id));
create policy da_insert on public.document_audit for insert with check (public.is_org_member(org_id));
-- append-only : aucune policy update/delete (journal inviolable)
