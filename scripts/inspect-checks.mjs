import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PDFDocument } from "pdf-lib";

const here = dirname(fileURLToPath(import.meta.url));
const bytes = await readFile(join(here, "..", "src", "lib", "cerfa", "templates", "cerfa_13757_mandat_pro.pdf"));
const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
const form = pdf.getForm();
for (const f of form.getFields()) {
  const type = f.constructor.name;
  if (type.includes("CheckBox")) {
    const H = pdf.getPage(0).getHeight();
    for (const w of f.acroField.getWidgets()) {
      const r = w.getRectangle();
      console.log(`CheckBox ${JSON.stringify(f.getName())}  x=${r.x.toFixed(1)} yTop=${(H - r.y - r.height).toFixed(1)} w=${r.width.toFixed(1)} h=${r.height.toFixed(1)}`);
    }
  }
}
