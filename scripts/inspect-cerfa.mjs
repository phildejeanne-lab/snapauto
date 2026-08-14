// Inspecte les champs AcroForm des 4 Cerfa. Usage: node scripts/inspect-cerfa.mjs
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PDFDocument } from "pdf-lib";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "src", "lib", "cerfa", "templates");

const files = [
  "cerfa_15776_certificat_cession.pdf",
  "cerfa_13751_declaration_achat.pdf",
  "cerfa_13750_demande_immatriculation.pdf",
  "cerfa_13757_mandat_pro.pdf",
];

for (const f of files) {
  const bytes = await readFile(join(dir, f));
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdf.getPageCount();
  let fields = [];
  try {
    const form = pdf.getForm();
    fields = form.getFields().map((fld) => `${fld.constructor.name.replace("PDF", "")}: ${fld.getName()}`);
  } catch (e) {
    fields = [`<no form: ${e.message}>`];
  }
  console.log(`\n===== ${f} =====`);
  console.log(`pages: ${pages} | champs: ${fields.length}`);
  for (const x of fields.slice(0, 80)) console.log("  " + x);
  if (fields.length > 80) console.log(`  … +${fields.length - 80} autres`);
}
