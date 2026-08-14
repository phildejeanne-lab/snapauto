// Génère un Cerfa (grille de calibration ou rempli avec données d'exemple).
// Usage :
//   node --import tsx scripts/test-cerfa.mjs grid cerfa_15776
//   node --import tsx scripts/test-cerfa.mjs fill cerfa_15776
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "out");
await mkdir(outDir, { recursive: true });

const [, , mode = "grid", key = "cerfa_15776"] = process.argv;

let bytes;
if (mode === "grid") {
  const { gridOverlay } = await import("../src/lib/cerfa/overlay.ts");
  bytes = await gridOverlay(key);
} else {
  const { generateCerfa } = await import("../src/lib/cerfa/generate.ts");
  const { SAMPLE_DOSSIER } = await import("../src/lib/cerfa/sample.ts");
  bytes = await generateCerfa(key, SAMPLE_DOSSIER);
}

const out = join(outDir, `${key}_${mode}.pdf`);
await writeFile(out, bytes);
console.log("✅ écrit :", out);
