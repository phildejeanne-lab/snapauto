import type { CerfaDossier } from "./types";
import type { DrawOp } from "./overlay";

// Mandat à un professionnel de l'automobile (Cerfa 13757*03) — formulaire AcroForm.
// Mandant = le client (nouveau propriétaire qui mandate le pro).
// Mandataire = le professionnel (org).

const P = "topmostSubform[0].Page1[0].";
const f = (name: string) => P + name + "[0]";

export function fields13757(d: CerfaDossier): {
  values: Record<string, string | null | undefined>;
  checks: Record<string, boolean>;
  overlays: DrawOp[];
} {
  const m = d.cession.buyer; // mandant = nouveau propriétaire
  const pro = d.pro;
  const [jj, mm, aaaa] = (d.cession.date ?? "").split("/");

  return {
    values: {
      [f("txt_IdentitéMandant")]: m.name,
      [f("num_VoieAdresse")]: m.noVoie,
      [f("txt_ExtensionAdresse")]: m.extVoie,
      [f("txt_TypeVoieAdresse")]: m.typeVoie,
      [f("txt_NomVoieAdresse")]: m.nomVoie,
      [f("num_CodePostalAdresse")]: m.cp,
      [f("txt_CommuneAdresse")]: m.commune,
      [f("txt_PaysAdresse")]: "FRANCE",
      [f("num_SIRETMandant")]: m.siret,

      [f("txt_IdentitéMandataire")]: pro?.name,
      [f("num_SIRETMandataire")]: pro?.siret,

      [f("txt_NatureOpération")]: "Changement de titulaire",
      [f("txt_MarqueVéhicule")]: d.vehicle.marque,
      [f("txt_MarqueImmatriculation")]: (d.vehicle.immat ?? "").replace(/\s*-\s*/g, " - ") || null,
      [f("txt_NumVinVéhicule")]: d.vehicle.vin,
      [f("txt_LieuDéclaration")]: pro?.commune ?? m.commune,
      [f("num_DateJourDéclaration")]: jj,
      [f("num_DateMoisDéclaration")]: mm,
      [f("num_DateAnnéeDéclaration")]: aaaa,
    },
    checks: {},
    // La case "Je suis informé(e)… assurance" (à x~34.6/yTop~537) a un "on value" vide
    // côté XFA → on la coche par overlay. (Case du bas = opposition prospection : laissée vide.)
    overlays: [{ page: 0, x: 37, y: 545, text: "X", size: 8 }],
  };
}
