-- Pièces jointes d'un dossier (permis, justificatif de domicile, CNI, mandat…).
-- Archivées puis purgées automatiquement ~2 mois après l'opération.

create table if not exists public.dossier_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  type text not null default 'autre',
  filename text not null,
  storage_path text not null,
  mime text,
  size bigint,
  purge_after timestamptz not null default (now() + interval '2 months'),
  created_at timestamptz not null default now()
);

create index if not exists dossier_documents_dossier_idx on public.dossier_documents(dossier_id);
create index if not exists dossier_documents_purge_idx on public.dossier_documents(purge_after);

alter table public.dossier_documents enable row level security;

drop policy if exists dd_select on public.dossier_documents;
drop policy if exists dd_insert on public.dossier_documents;
drop policy if exists dd_delete on public.dossier_documents;

create policy dd_select on public.dossier_documents
  for select using (public.is_org_member(org_id));
create policy dd_insert on public.dossier_documents
  for insert with check (public.is_org_member(org_id));
create policy dd_delete on public.dossier_documents
  for delete using (public.is_org_member(org_id));

-- Bucket privé pour les pièces. Chemin : {org_id}/{dossier_id}/{uuid}-{nom}.
insert into storage.buckets (id, name, public)
values ('dossier-docs', 'dossier-docs', false)
on conflict (id) do nothing;

drop policy if exists dossier_docs_select on storage.objects;
drop policy if exists dossier_docs_insert on storage.objects;
drop policy if exists dossier_docs_delete on storage.objects;

create policy dossier_docs_select on storage.objects
  for select to authenticated
  using (bucket_id = 'dossier-docs'
         and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy dossier_docs_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dossier-docs'
              and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy dossier_docs_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'dossier-docs'
         and public.is_org_member(((storage.foldername(name))[1])::uuid));
