// Dumpe les annotations (widgets de champs) d'une page : positions exactes des cases.
// Usage : node scripts/pdf-annots.mjs cerfa_15776 0
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

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(await readFile(join(here, "..", "src", "lib", "cerfa", "templates", TEMPLATES[key])));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(Number(pageArg) + 1);
const vp = page.getViewport({ scale: 1 });
const annots = await page.getAnnotations();
console.log(`# ${key} p${pageArg} — ${annots.length} annotations — page ${Math.round(vp.width)}x${Math.round(vp.height)}\n`);
for (const a of annots) {
  const r = a.rect || [];
  const x1 = Math.round(r[0]), x2 = Math.round(r[2]);
  const yTop = Math.round(vp.height - r[3]), yBot = Math.round(vp.height - r[1]);
  const w = x2 - x1, h = yBot - yTop;
  console.log(
    `${(a.fieldType||a.subtype||"?").padEnd(10)} x=${String(x1).padStart(3)} yTop=${String(yTop).padStart(3)} w=${String(w).padStart(3)} h=${String(h).padStart(2)} ` +
    `comb=${a.comb?("["+a.maxLen+"]"):"-"} name=${JSON.stringify(a.fieldName||"")}`
  );
}
