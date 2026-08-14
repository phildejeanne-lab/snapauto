// Teste l'extraction sur une vraie photo, sans UI.
// Usage : node --import tsx scripts/test-extract.mjs <chemin_image> <carte_grise|cni>
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { config as loadEnv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(here, "..", ".env.local") });

const [, , filePath, kind = "carte_grise"] = process.argv;
if (!filePath) {
  console.error("Usage: node --import tsx scripts/test-extract.mjs <image> <carte_grise|cni>");
  process.exit(1);
}

const MEDIA = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf",
};
const mediaType = MEDIA[extname(filePath).toLowerCase()];
if (!mediaType) {
  console.error("Format non supporté (jpg, png, webp, pdf).");
  process.exit(1);
}

const { extractDocument } = await import("../src/lib/extraction/extract.ts");

const base64 = (await readFile(filePath)).toString("base64");
console.log(`▶ Extraction ${kind} depuis ${filePath} …\n`);
const t0 = Date.now();
const data = await extractDocument(kind, base64, mediaType);
console.log(JSON.stringify(data, null, 2));
console.log(`\n✅ ${Date.now() - t0} ms`);
