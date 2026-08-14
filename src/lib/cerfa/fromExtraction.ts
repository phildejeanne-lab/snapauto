import type { CarteGrise, Cni } from "../extraction/schema";
import { parseAddress } from "./address";
import type { CerfaDossier, Operation, Person } from "./types";

const join = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(" ").trim() || null;
const up = (s: string | null) => s?.toUpperCase() ?? null;

// Date du jour au format JJ/MM/AAAA (la cession a lieu aujourd'hui par défaut).
function todayFR(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const emptyPro = (): Person => ({
  kind: "morale",
  name: null,
  siret: null,
  noVoie: null,
  extVoie: null,
  typeVoie: null,
  nomVoie: null,
  cp: null,
  commune: null,
});

const sexeFrom = (cni: Cni | null): "M" | "F" | null =>
  cni?.sex === "M" || cni?.sex === "F" ? cni.sex : null;

/**
 * Construit un dossier selon l'opération :
 * - achat : le pro ACHÈTE à un particulier → vendeur = particulier (carte grise + CNI), acheteur = pro.
 * - vente : le pro VEND à un particulier → vendeur = pro, acheteur = particulier (CNI ; adresse à saisir).
 */
export function buildDossierFromExtraction(
  cg: CarteGrise | null,
  cni: Cni | null,
  operation: Operation = "achat",
  pro?: Person,
): CerfaDossier {
  const proPerson: Person = pro ?? emptyPro();

  // Particulier titulaire de la carte grise (cas ACHAT : c'est le vendeur).
  const particulierFromCG: Person = {
    kind: "physique",
    sexe: sexeFrom(cni),
    name: up(join(cg?.holder_last_name, cg?.holder_first_names)),
    birthDate: cni?.birth_date ?? null,
    birthPlace: cni?.birth_place ?? null,
    ...parseAddress(cg?.holder_address),
  };

  // Particulier identifié par la CNI (cas VENTE : c'est l'acheteur).
  // Adresse reprise de la CNI si présente (ancien format) ; sinon à saisir.
  const particulierFromCNI: Person = {
    kind: "physique",
    sexe: sexeFrom(cni),
    name: up(join(cni?.last_name ?? cni?.birth_name, cni?.first_names)),
    birthDate: cni?.birth_date ?? null,
    birthPlace: cni?.birth_place ?? null,
    ...parseAddress(cni?.address),
  };

  const seller = operation === "achat" ? particulierFromCG : proPerson;
  const buyer = operation === "achat" ? proPerson : particulierFromCNI;

  return {
    operation,
    vehicle: {
      immat: cg?.immatriculation ?? null,
      vin: cg?.vin ?? null,
      dateB: cg?.first_registration ?? null,
      marque: cg?.brand ?? null,
      type: cg?.type_variant_version ?? null,
      denom: cg?.commercial_name ?? null,
      km: null,
      formule: cg?.formula_number ?? null,
      certImmat: "oui",
    },
    cession: {
      destination: "cession",
      date: todayFR(),
      heure: null,
      min: null,
      seller,
      buyer,
      lieuFaitSeller: seller.commune ?? null,
      dateFaitSeller: todayFR(),
      lieuFaitBuyer: buyer.commune ?? null,
      dateFaitBuyer: todayFR(),
    },
    pro: proPerson,
  };
}
