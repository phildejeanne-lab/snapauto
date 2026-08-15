-- Dénomination commerciale (D.3) du véhicule au livre de police.
alter table public.livre_police
  add column if not exists denom text;
