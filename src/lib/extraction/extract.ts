import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  carteGriseSchema,
  cniSchema,
  type CarteGrise,
  type Cni,
  type ExtractionKind,
} from "./schema";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modèle par type de document : carte grise = Sonnet 5 (dense, fiabilité),
// CNI = Haiku 4.5 (parfait, moins cher). ANTHROPIC_EXTRACTION_MODEL force les deux (utile en test).
const MODELS: Record<ExtractionKind, string> = {
  carte_grise: process.env.ANTHROPIC_MODEL_CARTE_GRISE ?? "claude-sonnet-5",
  cni: process.env.ANTHROPIC_MODEL_CNI ?? "claude-haiku-4-5-20251001",
};
const modelFor = (kind: ExtractionKind) =>
  process.env.ANTHROPIC_EXTRACTION_MODEL ?? MODELS[kind];

export type SupportedMedia =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

const PROMPTS: Record<ExtractionKind, string> = {
  carte_grise:
    "Photo d'un certificat d'immatriculation français (carte grise). " +
    "Recopie EXACTEMENT chaque valeur imprimée, sans interpréter les codes ni reformater. " +
    "Correspondance code → champ :\n" +
    "- immatriculation = A\n" +
    "- first_registration = B\n" +
    "- cert_date = I\n" +
    "- holder_last_name = nom de naissance du titulaire (C.1), le nom légal, PAS le nom d'usage/marital éventuel\n" +
    "- holder_first_names = prénom(s) du titulaire (C.1) UNIQUEMENT, sans nom d'usage\n" +
    "- holder_address = C.3 (rue + code postal + commune)\n" +
    "- brand = D.1\n- type_variant_version = D.2\n- commercial_name = D.3\n- vin = E\n" +
    "- ptac = F.2\n- mass_service = G.1\n- displacement_cc = P.1\n- power_kw = P.2\n" +
    "- fuel = P.3 (garder le code exact, ex. EH)\n- fiscal_power = P.6\n- seats = S.1\n" +
    "- co2 = V.7 (NE PAS confondre avec Y.6)\n" +
    "- genre = J.1 (genre national, ex. VP, CTTE, CAM)\n" +
    "- formula_number = numéro de formule du certificat (ex. 2024FD82667, format AAAA + lettres/chiffres), imprimé sur le document (souvent près du code-barres ou sur le coupon détachable en bas)\n" +
    "Mets null pour tout champ absent ou illisible.",
  cni:
    "Tu reçois la photo d'une pièce d'identité française : carte nationale d'identité (ancien ou nouveau format) OU passeport. " +
    "Extrais l'état civil du titulaire. Utilise la zone MRZ (2 lignes sur un passeport, 3 lignes sur la nouvelle CNI) si présente pour fiabiliser. " +
    "`document_type` = nature du titre : \"CNI\", \"Passeport\" ou \"Permis de conduire\". " +
    "`document_number` = n° de la CNI ou n° du passeport selon le document. " +
    "`issuing_authority` = autorité de délivrance si visible (ex. \"Préfecture de la Moselle\", \"Ministère de l'Intérieur\"). " +
    "`issue_date` = date de délivrance si visible. " +
    "Pour `address` : recopie l'adresse postale UNIQUEMENT si elle figure sur le document (ancienne CNI). " +
    "Absente sur la nouvelle CNI 2021 ET sur les passeports → mets null. " +
    "Recopie exactement ; mets null pour tout champ absent ou illisible.",
};

const SCHEMAS = { carte_grise: carteGriseSchema, cni: cniSchema } as const;

function toJsonSchema(kind: ExtractionKind) {
  // Description des champs pour l'outil (les clés = propriétés du schéma Zod).
  const shape =
    kind === "carte_grise" ? carteGriseSchema.shape : cniSchema.shape;
  const properties: Record<string, unknown> = {};
  for (const key of Object.keys(shape)) {
    properties[key] = {
      type: ["string", "null"],
      description: "Valeur imprimée, ou null si absente/illisible.",
    };
  }
  return {
    type: "object",
    properties,
    required: Object.keys(shape),
  };
}

type ExtractResult<K extends ExtractionKind> = K extends "carte_grise"
  ? CarteGrise
  : Cni;

/**
 * Extrait les données structurées d'une photo de document.
 * Force une sortie JSON via un outil, puis valide avec Zod.
 */
export async function extractDocument<K extends ExtractionKind>(
  kind: K,
  base64: string,
  mediaType: SupportedMedia,
): Promise<ExtractResult<K>> {
  const isPdf = mediaType === "application/pdf";

  const message = await anthropic.messages.create({
    model: modelFor(kind),
    max_tokens: 1024,
    tools: [
      {
        name: "enregistrer_champs",
        description: "Enregistre les champs extraits du document.",
        input_schema: toJsonSchema(kind) as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "enregistrer_champs" },
    messages: [
      {
        role: "user",
        content: [
          isPdf
            ? {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 },
              }
            : {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
          { type: "text", text: PROMPTS[kind] },
        ],
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Extraction: aucune sortie structurée renvoyée par le modèle.");
  }

  const schema = SCHEMAS[kind] as z.ZodTypeAny;
  const parsed = schema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      "Extraction: sortie invalide, " + JSON.stringify(parsed.error.flatten()),
    );
  }
  return parsed.data as ExtractResult<K>;
}
