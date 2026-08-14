import { z } from "zod";

// Champ optionnel : chaîne, ou null si absent/illisible sur le document.
const f = z.string().trim().min(1).nullable().default(null);

// ---- Carte grise (certificat d'immatriculation, codes EU 1999/37/CE) ----
export const carteGriseSchema = z.object({
  immatriculation: f, // A
  first_registration: f, // B  (date 1re immatriculation, JJ/MM/AAAA)
  cert_date: f, // I  (date du certificat)
  holder_last_name: f, // C.1 nom du titulaire
  holder_first_names: f, // C.1 prénom(s)
  holder_address: f, // C.3 adresse (ligne complète)
  brand: f, // D.1 marque
  type_variant_version: f, // D.2
  commercial_name: f, // D.3 dénomination commerciale
  vin: f, // E  n° de série (VIN, 17 caractères)
  ptac: f, // F.2
  mass_service: f, // G.1
  displacement_cc: f, // P.1 cylindrée
  power_kw: f, // P.2 puissance nette (kW)
  fuel: f, // P.3 énergie
  fiscal_power: f, // P.6 puissance administrative (CV)
  seats: f, // S.1 nombre de places
  co2: f, // V.7 CO2 (g/km)
  genre: f, // J.1 genre national (VP, CTTE…)
  formula_number: f, // n° de formule du certificat (ex. 2024FD82667)
});
export type CarteGrise = z.infer<typeof carteGriseSchema>;

// ---- Carte nationale d'identité (ancien & nouveau format, MRZ 2021) ----
export const cniSchema = z.object({
  last_name: f, // nom d'usage
  birth_name: f, // nom de naissance (si distinct)
  first_names: f, // prénom(s)
  birth_date: f, // date de naissance (JJ/MM/AAAA)
  birth_place: f, // lieu de naissance (commune)
  sex: f, // M / F
  nationality: f,
  document_type: f, // nature du titre : "CNI", "Passeport", "Permis de conduire"
  document_number: f, // n° du titre
  issuing_authority: f, // autorité de délivrance (ex. Préfecture de la Moselle)
  issue_date: f, // date de délivrance
  address: f, // adresse postale (présente sur ANCIENNE CNI ; absente sur la nouvelle 2021)
  mrz: f, // zone lisible machine (brute) si présente
});
export type Cni = z.infer<typeof cniSchema>;

export type ExtractionKind = "carte_grise" | "cni";

export const schemaFor = {
  carte_grise: carteGriseSchema,
  cni: cniSchema,
} as const;
