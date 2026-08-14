import { NextResponse, type NextRequest } from "next/server";
import { generateCerfa } from "@/lib/cerfa/generate";
import type { TemplateKey } from "@/lib/cerfa/overlay";
import type { CerfaDossier } from "@/lib/cerfa/types";

export const runtime = "nodejs";

const NAMES: Record<string, TemplateKey> = {
  "15776": "cerfa_15776",
  "13751": "cerfa_13751",
  "13750": "cerfa_13750",
  "13757": "cerfa_13757",
};

export async function POST(request: NextRequest, ctx: RouteContext<"/api/cerfa/[key]">) {
  try {
    const { key } = await ctx.params;
    const templateKey = NAMES[key];
    if (!templateKey) {
      return NextResponse.json({ error: `Cerfa inconnu : ${key}` }, { status: 404 });
    }
    const data = (await request.json()) as CerfaDossier;
    if (!data?.vehicle || !data?.cession) {
      return NextResponse.json({ error: "Dossier invalide." }, { status: 400 });
    }
    const bytes = await generateCerfa(templateKey, data);
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${templateKey}.pdf"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
