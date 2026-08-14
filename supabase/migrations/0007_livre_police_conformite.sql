-- Mise en conformité du Livre de Police (décret 88-1040) :
-- champs supplémentaires + INVIOLABILITÉ (insertion seule, ni update ni delete côté utilisateur).

alter table public.livre_police
  add column if not exists genre        text,   -- J.1 (VP, CTTE…)
  add column if not exists couleur      text,
  add column if not exists prix         text,   -- prix d'achat (entrée) / revente (sortie)
  add column if not exists paiement     text,   -- mode de paiement / règlement
  add column if not exists id_type      text,   -- nature de la pièce d'identité
  add column if not exists id_number    text,   -- n° de la pièce
  add column if not exists id_authority text;   -- autorité de délivrance

-- INVIOLABILITÉ : on remplace la policy "for all" par SELECT + INSERT uniquement.
-- (Sans policy UPDATE/DELETE, ces opérations sont refusées → registre non modifiable / non effaçable.)
drop policy if exists lp_member_all on public.livre_police;

drop policy if exists lp_select on public.livre_police;
create policy lp_select on public.livre_police for select
  using (public.is_org_member(org_id) or public.is_platform_admin());

drop policy if exists lp_insert on public.livre_police;
create policy lp_insert on public.livre_police for insert
  with check (public.is_org_member(org_id));
