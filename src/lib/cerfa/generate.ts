import { fillTemplate, fillAcroForm, type TemplateKey } from "./overlay";
import { ops15776 } from "./cerfa15776";
import { fields13757 } from "./cerfa13757";
import { generateCerfa13751 } from "./cerfa13751";
import { generateCerfa13750 } from "./cerfa13750";
import type { CerfaDossier } from "./types";

/** Génère le Certificat de cession (Cerfa 15776) rempli — overlay. */
export async function generateCerfa15776(data: CerfaDossier): Promise<Uint8Array> {
  return fillTemplate("cerfa_15776", ops15776(data));
}

/** Génère le Mandat (Cerfa 13757) rempli — AcroForm. */
export async function generateCerfa13757(data: CerfaDossier): Promise<Uint8Array> {
  const { values, checks, overlays } = fields13757(data);
  return fillAcroForm("cerfa_13757", values, checks, overlays);
}

/** Dispatcher par clé de template. */
export async function generateCerfa(key: TemplateKey, data: CerfaDossier): Promise<Uint8Array> {
  switch (key) {
    case "cerfa_15776":
      return generateCerfa15776(data);
    case "cerfa_13757":
      return generateCerfa13757(data);
    case "cerfa_13751":
      return generateCerfa13751(data);
    case "cerfa_13750":
      return generateCerfa13750(data);
    default:
      throw new Error(`Génération non implémentée pour ${key}`);
  }
}
