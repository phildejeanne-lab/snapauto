-- Conformité livre de police (v3) — éléments légaux restants :
--  - date de délivrance de la pièce d'identité du fournisseur
--  - date réelle du mouvement (entrée au parc / sortie), distincte de la
--    date d'enregistrement (recorded_at, qui reste l'horodatage inviolable).

alter table public.livre_police
  add column if not exists id_issue_date text,
  add column if not exists date_mouvement text;
