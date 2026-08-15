-- Conformité livre de police (v2) :
--  - destination de sortie (vente / dépôt-vente / restitution / destruction)
--  - contrepartie professionnelle (raison sociale via person_name + SIRET)
--  - mécanisme d'annulation (écriture d'annulation, jamais de modif/suppression)

alter table public.livre_police
  add column if not exists destination text,
  add column if not exists person_siret text,
  add column if not exists person_is_pro boolean not null default false,
  add column if not exists cancels_id uuid references public.livre_police(id) on delete restrict,
  add column if not exists motif text;

-- Autoriser le sens "annulation" (écriture qui annule une ligne antérieure).
alter table public.livre_police drop constraint if exists livre_police_sens_check;
alter table public.livre_police add constraint livre_police_sens_check
  check (sens = any (array['entree'::text, 'sortie'::text, 'annulation'::text]));

-- Inviolabilité inchangée : lp_select + lp_insert seulement (aucun UPDATE/DELETE).
-- L'annulation est une nouvelle écriture INSERT, pas une modification.
