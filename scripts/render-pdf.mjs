// Rasterise une page d'un PDF en PNG. Usage : node scripts/render-pdf.mjs <pdf> [pageIndex] [scale]
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

// Usage : node scripts/render-pdf.mjs <pdf> [page] [scale] [cropXpt cropYpt cropWpt cropHpt]
const [, , pdfPath, pageArg = "0", scaleArg = "2", cx, cyTop, cw, ch] = process.argv;
if (!pdfPath) {
  console.error("Usage: node scripts/render-pdf.mjs <pdf> [page] [scale] [x y w h]");
  process.exit(1);
}
const scale = Number(scaleArg);
const crop = cx !== undefined ? [Number(cx), Number(cyTop), Number(cw), Number(ch)] : null;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(await readFile(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(Number(pageArg) + 1);
const viewport = page.getViewport({ scale });
const full = createCanvas(viewport.width, viewport.height);
const fctx = full.getContext("2d");
await page.render({ canvasContext: fctx, viewport }).promise;

let output = full;
let suffix = `_p${pageArg}`;
if (crop) {
  const [x, y, w, h] = crop.map((v) => Math.round(v * scale));
  const c = createCanvas(w, h);
  c.getContext("2d").drawImage(full, x, y, w, h, 0, 0, w, h);
  output = c;
  suffix = `_p${pageArg}_crop`;
}

const out = join(dirname(pdfPath), basename(pdfPath).replace(/\.pdf$/i, "") + `${suffix}.png`);
await writeFile(out, output.toBuffer("image/png"));
console.log("✅ image :", out);
