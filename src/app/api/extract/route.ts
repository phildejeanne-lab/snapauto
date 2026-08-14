import { NextResponse, type NextRequest } from "next/server";
import { extractDocument, type SupportedMedia } from "@/lib/extraction/extract";
import { buildDossierFromExtraction } from "@/lib/cerfa/fromExtraction";
import { parseAddress } from "@/lib/cerfa/address";
import { getUserAndOrg } from "@/lib/org";
import type { CarteGrise, Cni } from "@/lib/extraction/schema";
import type { Person, Operation } from "@/lib/cerfa/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED: SupportedMedia[] = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

async function toBase64(file: File): Promise<{ base64: string; media: SupportedMedia }> {
  const media = file.type as SupportedMedia;
  if (!ALLOWED.includes(media)) {
    throw new Error(`Format non supporté : ${file.type || "inconnu"} (JPG, PNG, WEBP ou PDF).`);
  }
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return { base64, media };
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const cgFile = form.get("carteGrise");
    const cniFile = form.get("cni");

    let carteGrise: CarteGrise | null = null;
    let cni: Cni | null = null;

    if (cgFile instanceof File && cgFile.size > 0) {
      const { base64, media } = await toBase64(cgFile);
      carteGrise = await extractDocument("carte_grise", base64, media);
    }
    if (cniFile instanceof File && cniFile.size > 0) {
      const { base64, media } = await toBase64(cniFile);
      cni = await extractDocument("cni", base64, media);
    }

    if (!carteGrise && !cni) {
      return NextResponse.json({ error: "Aucun document fourni." }, { status: 400 });
    }

    // Pré-remplir le pro depuis le profil de l'org connectée.
    const { org } = await getUserAndOrg();
    const pro: Person | undefined = org
      ? {
          kind: "morale",
          name: org.name,
          siret: org.siren,
          ...parseAddress([org.address_line, org.postal_code, org.city].filter(Boolean).join(" ")),
        }
      : undefined;

    const operation: Operation = form.get("operation") === "vente" ? "vente" : "achat";
    const dossier = buildDossierFromExtraction(carteGrise, cni, operation, pro);
    return NextResponse.json({ carteGrise, cni, dossier });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur d'extraction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
