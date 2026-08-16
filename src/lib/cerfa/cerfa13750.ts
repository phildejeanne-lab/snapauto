import type { DrawOp } from "./overlay";
import type { CerfaDossier } from "./types";
import { fillTemplate } from "./overlay";

// Demande de certificat d'immatriculation (Cerfa 13750*07), overlay.
// Titulaire = le nouveau propriétaire (acheteur).

const T = 8;
const TC = 9;
const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");
const alnum = (s?: string | null) => (s ?? "").replace(/[^0-9A-Za-z]/g, "");
const plate = (s?: string | null) => (s ?? "").replace(/\s*-\s*/g, " - ");

const op = (x: number, y: number, text: string | null | undefined, size = T): DrawOp => ({ page: 0, x, y, text: text ?? null, size });
const cells = (cs: number[], y: number, text: string | null | undefined): DrawOp => ({ page: 0, cells: cs, y, text: text ?? null, size: TC });
const comb = (x: number, pitch: number, y: number, text: string | null | undefined): DrawOp => ({ page: 0, x, y, spacing: pitch, text: text ?? null, size: TC });

// Cases dates (JJMMAAAA)
const DATE_ACHAT = [172.35, 186.5, 203.7, 217.9, 235.05, 249.2, 263.4, 277.6];
const DATE_B = [448.35, 462.5, 479.7, 493.9, 511.05, 525.2, 539.4, 553.6];
const NE_LE = [62.25, 73.6, 87.95, 99.3, 113.65, 124.95, 136.3, 147.65];
const CP = [83.9, 98.1, 112.3, 126.5, 140.7];

export function ops13750(d: CerfaDossier): DrawOp[] {
  const v = d.vehicle;
  const t = d.cession.buyer; // titulaire = nouveau propriétaire

  return [
    // ===== VÉHICULE =====
    op(38, 137, plate(v.immat)), // (A) immat actuel (champ libre)
    cells(DATE_ACHAT, 137, digits(d.cession.date)), // date d'achat
    cells(DATE_B, 137, digits(v.dateB)), // (B) 1re immatriculation
    op(38, 189, alnum(v.formule)), // n° de formule
    op(38, 208, v.marque), // Marque D.1
    op(226, 208, v.denom), // Dénomination D.3
    op(38, 229, v.type), // Type variante version D.2
    op(38, 251, v.vin), // N° identification E

    // ===== TITULAIRE (nouveau propriétaire) =====
    op(208, 302, "X", 8), // personne physique
    ...(t.sexe === "M" ? [op(261, 302, "X", 8)] : t.sexe === "F" ? [op(285, 302, "X", 8)] : []),
    op(78, 320, t.name), // Titulaire (nom + prénom)
    cells(NE_LE, 338, digits(t.birthDate)), // Né(e) le
    op(175, 338, t.birthPlace), // à (commune de naissance)
    op(88, 372, t.noVoie), // N° de la voie
    op(193, 372, t.typeVoie), // Type de voie
    op(276, 372, t.nomVoie), // Libellé de voie
    cells(CP, 403, digits(t.cp)), // Code postal
    op(153, 403, t.commune), // Commune

    // ===== Le titulaire, Fait à / Le =====
    op(63, 722, t.commune, 5.5),
    op(122, 722, d.cession.date, 6),
  ];
}

export async function generateCerfa13750(data: CerfaDossier): Promise<Uint8Array> {
  return fillTemplate("cerfa_13750", ops13750(data));
}
