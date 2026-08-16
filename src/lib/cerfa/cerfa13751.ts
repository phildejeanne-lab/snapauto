import type { DrawOp } from "./overlay";
import type { CerfaDossier } from "./types";
import { fillTemplate } from "./overlay";

// Déclaration d'achat (Cerfa 13751*02), PDF plat (version aplatie), overlay.
// Déclarant "Je soussigné(e)" = le PROFESSIONNEL acheteur (org).
// Section "Certificat de vente" (bas) = le vendeur (ancien propriétaire).

const T = 8;
const TC = 9;
const digits = (s?: string | null) => (s ?? "").replace(/\D/g, "");
const alnum = (s?: string | null) => (s ?? "").replace(/[^0-9A-Za-z]/g, "");
// Immatriculation avec espaces autour des tirets : "GF-065-EZ" -> "GF - 065 - EZ"
const plate = (s?: string | null) => (s ?? "").replace(/\s*-\s*/g, " - ");

const op = (x: number, y: number, text: string | null | undefined, size = T): DrawOp => ({ page: 0, x, y, text: text ?? null, size });
const comb = (x: number, pitch: number, y: number, text: string | null | undefined): DrawOp => ({ page: 0, x, y, spacing: pitch, text: text ?? null, size: TC });
const cells = (cs: number[], y: number, text: string | null | undefined): DrawOp => ({ page: 0, cells: cs, y, text: text ?? null, size: TC });

const DATE_ACHAT = [134.55, 148.7, 168.55, 182.7, 202.6, 216.75, 230.9, 245.1];
const SIREN = { x: 470.25, pitch: 11.3 };
const CP = [93.7, 107.9, 122.1, 136.3, 150.5];

export function ops13751(d: CerfaDossier): DrawOp[] {
  const pro = d.pro ?? { kind: "morale" as const };
  const v = d.vehicle;
  const seller = d.cession.seller;

  return [
    // Case "professionnel du commerce de l'automobile"
    op(171, 92, "X", 8),

    // ===== Déclarant = le professionnel =====
    op(108, 114, pro.name),
    comb(SIREN.x, SIREN.pitch, 114, digits(pro.siret).slice(0, 9)),
    op(104, 139, pro.noVoie),
    op(153, 139, pro.extVoie),
    op(203, 139, pro.typeVoie),
    op(281, 139, pro.nomVoie),
    cells(CP, 163, digits(pro.cp)),
    op(185, 163, pro.commune),

    // ===== Date d'achat (aujourd'hui) =====
    cells(DATE_ACHAT, 191, digits(d.cession.date)),
    cells([277.3, 291.45], 191, digits(d.cession.heure)),
    cells([305.6, 319.8], 191, digits(d.cession.min)),

    // ===== Véhicule (champs libres) =====
    op(33, 229, plate(v.immat)),
    op(217, 229, v.vin),
    op(402, 229, v.marque),
    op(33, 255, v.type),
    op(287, 255, v.denom),

    // ===== Présence certificat : OUI + n° de formule =====
    op(236, 286, "X", 8),
    op(326, 309, alnum(v.formule)),

    // ===== Fait à … le … (pro / déclaration) =====
    op(58, 408, pro.commune),
    cells([283.2, 297.4, 317.2, 331.4, 351.2, 365.4, 379.6, 393.75], 408, digits(d.cession.date)),

    // ===== CERTIFICAT DE VENTE (bas) = le vendeur (ancien propriétaire) =====
    op(110, 587, seller.name),
    comb(464.05, 11.3, 587, digits(seller.siret).slice(0, 9)),
    op(90, 617, seller.noVoie),
    op(141, 617, seller.extVoie),
    op(194, 617, seller.typeVoie),
    op(275, 617, seller.nomVoie),
    cells([93.85, 108.05, 122.25, 136.45, 150.65], 645, digits(seller.cp)),
    op(185, 645, seller.commune),
    // "certifie avoir vendu … le [date]"
    cells([365.6, 379.8, 399.6, 413.8, 433.6, 447.8, 462, 476.15], 676, digits(d.cession.date)),
    // "Fait à … le [date]"
    op(55, 711, seller.commune),
    cells([209.4, 223.55, 243.4, 257.55, 277.4, 291.6, 305.75, 319.9], 711, digits(d.cession.date)),
  ];
}

export async function generateCerfa13751(data: CerfaDossier): Promise<Uint8Array> {
  return fillTemplate("cerfa_13751", ops13751(data));
}
