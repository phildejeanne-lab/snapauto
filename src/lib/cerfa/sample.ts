import type { DrawOp, TemplateKey } from "./overlay";
import type { CerfaDossier } from "./types";
import { ops15776 } from "./cerfa15776";
import { parseAddress } from "./address";

// Dossier d'exemple (vraie carte grise Fiat 500 + CNI COLLIN) pour la calibration.
const sellerAddr = parseAddress("1 RUE DU CHATEAU 54730 GORCY");
const buyerAddr = parseAddress("12 RUE DE LA REPUBLIQUE 54350 MONT-SAINT-MARTIN");

export const SAMPLE_DOSSIER: CerfaDossier = {
  operation: "achat",
  vehicle: {
    immat: "GF-065-EZ",
    vin: "ZFACF1CJ1NJF88461",
    dateB: "16/03/2022",
    marque: "FIAT",
    type: "312AYD1BE25ACM",
    denom: "FIAT 500",
    km: "45000",
    formule: "2024FD82667",
    certImmat: "oui",
  },
  cession: {
    destination: "cession",
    date: "13/08/2026",
    heure: "14",
    min: "00",
    seller: {
      kind: "physique",
      sexe: "F",
      name: "TRAMOY LAETITIA",
      ...sellerAddr,
    },
    buyer: {
      kind: "physique",
      sexe: "M",
      name: "COLLIN PHILIPPE, PATRICK",
      birthDate: "03/04/1981",
      birthPlace: "MONT-SAINT-MARTIN",
      ...buyerAddr,
    },
    lieuFaitSeller: "GORCY",
    dateFaitSeller: "13/08/2026",
    lieuFaitBuyer: "MONT-SAINT-MARTIN",
    dateFaitBuyer: "13/08/2026",
  },
  pro: {
    kind: "morale",
    name: "GARAGE SNAPAUTO SARL",
    siret: "90123456700018",
    noVoie: "5",
    typeVoie: "AVENUE",
    nomVoie: "DE LA GARE",
    cp: "54400",
    commune: "LONGWY",
  },
};

export function buildOps(key: TemplateKey): DrawOp[] {
  if (key !== "cerfa_15776") return [];
  return ops15776(SAMPLE_DOSSIER);
}
