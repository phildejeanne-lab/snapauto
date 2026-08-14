import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export const TEMPLATES_DIR = join(process.cwd(), "src", "lib", "cerfa", "templates");

export const TEMPLATE_FILES = {
  cerfa_15776: "cerfa_15776_certificat_cession.pdf",
  cerfa_13751: "cerfa_13751_declaration_achat.pdf",
  cerfa_13750: "cerfa_13750_demande_immatriculation.pdf",
  cerfa_13757: "cerfa_13757_mandat_pro.pdf",
} as const;

export type TemplateKey = keyof typeof TEMPLATE_FILES;

// Une opération de dessin. Coordonnées avec origine EN HAUT À GAUCHE (comme à l'écran),
// converties en interne vers le repère pdf-lib (origine bas-gauche).
export type DrawOp = {
  page: number; // index 0-based
  x?: number; // depuis la gauche (pt) — texte simple, ou 1er centre de case si spacing
  y: number; // depuis le HAUT (pt)
  text: string | null | undefined;
  size?: number; // défaut 9
  spacing?: number; // mode "peigne" uniforme : centre chaque caractère à x + i*spacing
  cells?: number[]; // mode "peigne" explicite : centre x de chaque case (JJ/MM/AAAA, etc.)
};

async function loadTemplate(key: TemplateKey) {
  const bytes = await readFile(join(TEMPLATES_DIR, TEMPLATE_FILES[key]));
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

function drawOp(page: PDFPage, font: PDFFont, op: DrawOp) {
  if (op.text == null || op.text === "") return;
  const size = op.size ?? 9;
  const height = page.getHeight();
  const yPdf = height - op.y; // conversion origine haut → bas
  const text = String(op.text);
  const draw = (ch: string, x: number) =>
    page.drawText(ch, { x, y: yPdf, size, font, color: rgb(0, 0, 0) });

  // Centre un caractère dans une case dont le centre x est connu.
  const centerAt = (ch: string, cx: number) =>
    draw(ch, cx - font.widthOfTextAtSize(ch, size) / 2);

  if (op.cells && op.cells.length) {
    // Peigne explicite : un caractère par centre de case fourni.
    const chars = [...text];
    for (let i = 0; i < chars.length && i < op.cells.length; i++) {
      centerAt(chars[i], op.cells[i]);
    }
  } else if (op.spacing && op.spacing > 0) {
    // Peigne uniforme : op.x = centre de la 1re case, pas régulier.
    const x0 = op.x ?? 0;
    [...text].forEach((ch, i) => centerAt(ch, x0 + i * op.spacing!));
  } else {
    // Texte libre aligné à gauche.
    draw(text, op.x ?? 0);
  }
}

/** Remplit un template par overlay et renvoie les octets du PDF. */
export async function fillTemplate(key: TemplateKey, ops: DrawOp[]): Promise<Uint8Array> {
  const pdf = await loadTemplate(key);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  for (const op of ops) {
    const page = pages[op.page];
    if (page) drawOp(page, font, op);
  }
  return pdf.save();
}

/** Remplit un formulaire AcroForm par nom de champ (texte + cases à cocher), puis aplatit. */
export async function fillAcroForm(
  key: TemplateKey,
  values: Record<string, string | null | undefined>,
  checks: Record<string, boolean> = {},
  overlayOps: DrawOp[] = [],
): Promise<Uint8Array> {
  const bytes = await readFile(join(TEMPLATES_DIR, TEMPLATE_FILES[key]));
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    if (value == null || value === "") continue;
    try {
      form.getTextField(name).setText(String(value));
    } catch {
      // champ absent ou non textuel : ignoré
    }
  }
  for (const [name, on] of Object.entries(checks)) {
    if (!on) continue;
    try {
      form.getCheckBox(name).check();
    } catch {
      // ignoré
    }
  }

  form.updateFieldAppearances(font);
  form.flatten(); // fige les valeurs (rendu identique dans tous les lecteurs)

  // Overlay après aplatissement (ex. cocher une case XFA dont le "on value" est vide).
  const pages = pdf.getPages();
  for (const op of overlayOps) {
    const page = pages[op.page];
    if (page) drawOp(page, font, op);
  }

  return pdf.save();
}

/** Génère le template avec une grille de calibration (repères tous les 25 pt, labels tous les 50 pt). */
export async function gridOverlay(key: TemplateKey): Promise<Uint8Array> {
  const pdf = await loadTemplate(key);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.getPages().forEach((page) => {
    const w = page.getWidth();
    const h = page.getHeight();
    const line = (x1: number, y1: number, x2: number, y2: number, c: number) =>
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.4, color: rgb(1, 0, 0), opacity: c });
    for (let x = 0; x <= w; x += 25) {
      line(x, 0, x, h, x % 50 === 0 ? 0.35 : 0.15);
      if (x % 50 === 0) page.drawText(String(x), { x: x + 1, y: h - 10, size: 6, font, color: rgb(1, 0, 0) });
    }
    for (let yTop = 0; yTop <= h; yTop += 25) {
      const y = h - yTop;
      line(0, y, w, y, yTop % 50 === 0 ? 0.35 : 0.15);
      if (yTop % 50 === 0) page.drawText(String(yTop), { x: 2, y: y + 1, size: 6, font, color: rgb(1, 0, 0) });
    }
  });
  return pdf.save();
}
