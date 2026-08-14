// Dumpe les items de texte (chaîne + position x,y bas-gauche) d'une page de template.
// Usage : node scripts/pdf-text.mjs cerfa_15776 0
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = {
  cerfa_15776: "cerfa_15776_certificat_cession.pdf",
  cerfa_13751: "cerfa_13751_declaration_achat.pdf",
  cerfa_13750: "cerfa_13750_demande_immatriculation.pdf",
  cerfa_13757: "cerfa_13757_mandat_pro.pdf",
};

const [, , key = "cerfa_15776", pageArg = "0"] = process.argv;
const pageNum = Number(pageArg) + 1;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(await readFile(join(here, "..", "src", "lib", "cerfa", "templates", TEMPLATES[key])));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(pageNum);
const vp = page.getViewport({ scale: 1 });
console.log(`# ${key} page ${pageArg} — taille ${Math.round(vp.width)}x${Math.round(vp.height)} pt (origine bas-gauche)\n`);
const content = await page.getTextContent();
for (const it of content.items) {
  if (!it.str || !it.str.trim()) continue;
  const x = Math.round(it.transform[4]);
  const yBottom = Math.round(it.transform[5]);
  const yTop = Math.round(vp.height - yBottom);
  console.log(`x=${String(x).padStart(3)} yTop=${String(yTop).padStart(3)}  ${JSON.stringify(it.str)}`);
}
