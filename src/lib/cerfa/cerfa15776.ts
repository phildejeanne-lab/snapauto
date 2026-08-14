import type { DrawOp } from "./overlay";
import type { CerfaDossier, Person } from "./types";

// Coordonnées calibrées sur les traits vectoriels du PDF (origine haut-gauche, A4 595x842).
// Le 15776 = 2 exemplaires identiques (pages 0 et 1). Champs à cases = mode "peigne".

const T = 8; // taille texte libre
const TC = 9; // taille texte en case
const X = 8; // taille croix

const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");
const alnum = (s?: string | null) => (s ?? "").replace(/[^0-9A-Za-z]/g, "");

// ---- Cases véhicule (identiques sur les 2 exemplaires) ----
const IMMAT = { x: 42.85, pitch: 14.17, y: 124 }; // 9 cases (lettres, chiffres et tirets)
const VIN = { x: 180.85, pitch: 14.17, y: 124 }; // 17 cases
const DATE_B = { cells: [446.5, 457.8, 472.1, 483.5, 497.8, 509.2, 520.5, 531.8], y: 124 };
const FORMULE = { cells: [177.7, 191.8, 206, 220.1, 234.3, 248.4, 262.6, 276.7, 290.9], y: 202 }; // après "20" préimprimé

// ---- Cases propriétaire (offset par bloc) ----
const CP_CELLS = [114.85, 129, 143.15, 157.3, 171.45]; // 5 cases code postal
const SIRET_START = 400.45;
const SIRET_PITCH = 11.31; // 14 cases

function op(page: number, x: number, y: number, text: string | null | undefined, size = T): DrawOp {
  return { page, x, y, text: text ?? null, size };
}
function comb(page: number, x: number, pitch: number, y: number, text: string | null | undefined): DrawOp {
  return { page, x, y, spacing: pitch, text: text ?? null, size: TC };
}
function combCells(page: number, cells: number[], y: number, text: string | null | undefined): DrawOp {
  return { page, cells, y, text: text ?? null, size: TC };
}

function sexeTick(page: number, yBase: number, person: Person): DrawOp[] {
  if (person.sexe === "M") return [op(page, 281, yBase + 4, "X", X)];
  if (person.sexe === "F") return [op(page, 305, yBase + 4, "X", X)];
  return [];
}

function exemplaire(page: number, d: CerfaDossier): DrawOp[] {
  const { vehicle: v, cession: c } = d;
  const S = c.seller;
  const B = c.buyer;

  return [
    // ===== LE VÉHICULE =====
    comb(page, IMMAT.x, IMMAT.pitch, IMMAT.y, v.immat),
    comb(page, VIN.x, VIN.pitch, VIN.y, v.vin),
    combCells(page, DATE_B.cells, DATE_B.y, digits(v.dateB)),
    op(page, 40, 145, v.marque),
    op(page, 178, 145, v.type),
    op(page, 446, 145, v.denom),
    op(page, 210, 172, v.km),
    combCells(page, FORMULE.cells, FORMULE.y, alnum(v.formule).replace(/^20/, "")),
    v.certImmat === "non" ? op(page, 683, 203, "X", X) : op(page, 38, 203, "X", X),

    // ===== ANCIEN PROPRIÉTAIRE (yBase 269) =====
    op(page, 38, S.kind === "morale" ? 283 : 273, "X", X),
    ...sexeTick(page, 269, S),
    op(page, 150, 301, S.name),
    comb(page, SIRET_START, SIRET_PITCH, 301, digits(S.siret)),
    op(page, 112, 331, S.noVoie),
    op(page, 214,331, S.typeVoie),
    op(page, 284, 331, S.nomVoie),
    combCells(page, CP_CELLS, 352, digits(S.cp)),
    op(page, 195, 352, S.commune),
    c.destination === "destruction" ? op(page, 238, 379, "X", X) : op(page, 186, 379, "X", X),
    combCells(page, [52.7, 64.05, 78.35, 89.7, 104.05, 115.4, 126.75, 138.05], 394, digits(c.date)),
    combCells(page, [158.8, 170.15], 394, digits(c.heure)),
    combCells(page, [192.75, 204.1], 394, digits(c.min)),
    op(page, 62, 511, c.lieuFaitSeller),
    op(page, 265, 511, c.dateFaitSeller),

    // ===== NOUVEAU PROPRIÉTAIRE (yBase 600) =====
    op(page, 38, B.kind === "morale" ? 614 : 604, "X", X),
    ...sexeTick(page, 600, B),
    op(page, 150, 632, B.name),
    comb(page, SIRET_START, SIRET_PITCH, 632, digits(B.siret)),
    combCells(page, [76.65, 87.95, 102.3, 113.65, 128, 139.35, 150.65, 162], 655, digits(B.birthDate)),
    op(page, 185, 655, B.birthPlace),
    op(page, 112, 672, B.noVoie),
    op(page, 214,672, B.typeVoie),
    op(page, 284, 672, B.nomVoie),
    combCells(page, CP_CELLS, 696, digits(B.cp)),
    op(page, 195, 696, B.commune),
    op(page, 38, 735, "X", X), // acquérir le véhicule
    op(page, 62, 766, c.lieuFaitBuyer),
    op(page, 265, 766, c.dateFaitBuyer),
  ];
}

// Décalage vertical global (pt) : remonte tout le texte pour le centrer dans les cases / sur les lignes.
const Y_SHIFT = 4;

export function ops15776(d: CerfaDossier): DrawOp[] {
  const raw = [...exemplaire(0, d), ...exemplaire(1, d)];
  return raw.map((o) => ({ ...o, y: o.y - Y_SHIFT }));
}
