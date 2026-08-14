// Découpe une adresse française d'une ligne en composants du Cerfa.
// "1 RUE DU CHATEAU 54730 GORCY" -> { noVoie:"1", typeVoie:"RUE", nomVoie:"DU CHATEAU", cp:"54730", commune:"GORCY" }

const VOIE_TYPES = new Set([
  "RUE", "AVENUE", "AV", "BOULEVARD", "BD", "IMPASSE", "IMP", "ALLEE", "ALLÉE",
  "CHEMIN", "CHE", "ROUTE", "RTE", "PLACE", "PL", "QUAI", "COURS", "PASSAGE",
  "SENTIER", "SQUARE", "LOTISSEMENT", "RESIDENCE", "RÉSIDENCE", "CITE", "CITÉ",
  "FAUBOURG", "MONTEE", "VOIE", "RAMPE", "HAMEAU", "LIEU-DIT", "LIEUDIT", "CHAUSSEE",
]);

export type AddressParts = {
  noVoie: string | null;
  extVoie: string | null;
  typeVoie: string | null;
  nomVoie: string | null;
  cp: string | null;
  commune: string | null;
};

export function parseAddress(line: string | null | undefined): AddressParts {
  const empty: AddressParts = { noVoie: null, extVoie: null, typeVoie: null, nomVoie: null, cp: null, commune: null };
  if (!line) return empty;

  // Les virgules séparent (ex. "1, rue des bois") → on les traite comme des espaces.
  const clean = line.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // Code postal (5 chiffres) : sépare rue / (cp + commune)
  const cpMatch = clean.match(/\b(\d{5})\b/);
  let streetPart = clean;
  let cp: string | null = null;
  let commune: string | null = null;
  if (cpMatch) {
    cp = cpMatch[1];
    const idx = clean.indexOf(cp);
    streetPart = clean.slice(0, idx).trim().replace(/[,;]$/, "").trim();
    commune = clean.slice(idx + cp.length).trim().replace(/^[,;]/, "").trim() || null;
  }

  const tokens = streetPart.split(" ").filter(Boolean);
  let noVoie: string | null = null;
  let extVoie: string | null = null;
  let typeVoie: string | null = null;

  if (tokens.length && /^\d+$/.test(tokens[0])) {
    noVoie = tokens.shift()!;
    // extension éventuelle (bis, ter, quater, B...)
    if (tokens.length && /^(bis|ter|quater|[a-z])$/i.test(tokens[0])) {
      extVoie = tokens.shift()!;
    }
  }
  if (tokens.length && VOIE_TYPES.has(tokens[0].toUpperCase())) {
    typeVoie = tokens.shift()!;
  }
  const nomVoie = tokens.join(" ") || null;

  return { noVoie, extVoie, typeVoie, nomVoie, cp, commune };
}
