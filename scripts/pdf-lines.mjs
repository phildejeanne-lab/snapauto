// Extrait les segments verticaux (séparateurs de cases) d'une page, avec suivi du CTM.
// Usage : node scripts/pdf-lines.mjs cerfa_15776 0 [yTopMin] [yTopMax]
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
const [, , key = "cerfa_15776", pageArg = "0", yMinArg = "0", yMaxArg = "842"] = process.argv;
const yMin = Number(yMinArg), yMax = Number(yMaxArg);

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const { OPS } = pdfjs;
const data = new Uint8Array(await readFile(join(here, "..", "src", "lib", "cerfa", "templates", TEMPLATES[key])));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const page = await doc.getPage(Number(pageArg) + 1);
const H = page.getViewport({ scale: 1 }).height;
const opList = await page.getOperatorList();

const mul = (m, n) => [
  m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4], m[4] * n[1] + m[5] * n[3] + n[5],
];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

let ctm = [1, 0, 0, 1, 0, 0];
const stack = [];
const verts = []; // {x, yTop1, yTop2}

function addSeg(x1, y1, x2, y2) {
  const [ax, ay] = apply(ctm, x1, y1);
  const [bx, by] = apply(ctm, x2, y2);
  if (Math.abs(ax - bx) < 0.8 && Math.abs(ay - by) > 1.5) {
    const yt1 = H - ay, yt2 = H - by;
    verts.push({ x: (ax + bx) / 2, yTop1: Math.min(yt1, yt2), yTop2: Math.max(yt1, yt2) });
  }
}

for (let i = 0; i < opList.fnArray.length; i++) {
  const fn = opList.fnArray[i];
  const args = opList.argsArray[i];
  if (fn === OPS.save) stack.push(ctm.slice());
  else if (fn === OPS.restore) ctm = stack.pop() || ctm;
  else if (fn === OPS.transform) ctm = mul(args, ctm);
  else if (fn === OPS.constructPath) {
    // Format compact pdfjs v6 : args[1][0] = séquence [op, coords..., op, ...]
    // codes : 0=moveTo(2), 1=lineTo(2), 2=curveTo(6), 4=closePath(0)
    const seq = Array.from(args[1]?.[0] ?? []);
    let c = 0, cx = 0, cy = 0, sx = 0, sy = 0;
    while (c < seq.length) {
      const op = seq[c++];
      if (op === 0) { cx = sx = seq[c++]; cy = sy = seq[c++]; }
      else if (op === 1) { const nx = seq[c++], ny = seq[c++]; addSeg(cx, cy, nx, ny); cx = nx; cy = ny; }
      else if (op === 2) { c += 4; cx = seq[c++]; cy = seq[c++]; }
      else if (op === 4) { addSeg(cx, cy, sx, sy); cx = sx; cy = sy; }
      else break; // code inconnu : on arrête ce chemin
    }
  }
}

// Regrouper par bande de ligne (yTop arrondi) dans la fenêtre demandée.
const inWin = verts.filter((v) => v.yTop2 >= yMin && v.yTop1 <= yMax);
const rows = new Map();
for (const v of inWin) {
  const krow = Math.round(v.yTop1 / 4) * 4;
  if (!rows.has(krow)) rows.set(krow, { xs: [], y1: Infinity, y2: -Infinity });
  const r = rows.get(krow);
  r.xs.push(Math.round(v.x * 10) / 10);
  r.y1 = Math.min(r.y1, v.yTop1);
  r.y2 = Math.max(r.y2, v.yTop2);
}
console.log(`# ${key} p${pageArg} — ${verts.length} segments verticaux, fenêtre yTop ${yMin}..${yMax}\n`);
for (const [row, r] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
  const u = [...new Set(r.xs)].sort((a, b) => a - b);
  const pitch = u.length > 1 ? Math.round((u[u.length - 1] - u[0]) / (u.length - 1) * 10) / 10 : 0;
  const y1 = Math.round(r.y1 * 10) / 10, y2 = Math.round(r.y2 * 10) / 10;
  console.log(`cases yTop ${y1}..${y2} (h=${Math.round((y2 - y1) * 10) / 10}, ${u.length} traits, pas~${pitch}) : ${u.join(", ")}`);
}
