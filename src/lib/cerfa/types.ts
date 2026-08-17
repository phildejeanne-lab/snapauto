// Modèle de données pour la génération des Cerfa (indépendant du schéma DB).

export type Person = {
  kind: "physique" | "morale";
  sexe?: "M" | "F" | null;
  name?: string | null; // "NOM PRÉNOM" (physique) ou raison sociale (morale)
  siret?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  // Adresse décomposée (cases du Cerfa)
  noVoie?: string | null;
  extVoie?: string | null;
  typeVoie?: string | null;
  nomVoie?: string | null;
  cp?: string | null;
  commune?: string | null;
  // Pièce d'identité (livre de police)
  idType?: string | null; // CNI, Passeport, Permis
  idNumber?: string | null;
  idAuthority?: string | null;
  idDate?: string | null; // date de délivrance de la pièce
};

export type Vehicle = {
  immat?: string | null;
  vin?: string | null;
  dateB?: string | null; // 1re immatriculation
  marque?: string | null;
  type?: string | null; // D.2
  denom?: string | null; // D.3
  km?: string | null;
  formule?: string | null; // n° de formule
  certImmat?: "oui" | "non" | null;
  genre?: string | null; // J.1 (VP, CTTE…)
  couleur?: string | null; // saisie manuelle (absent de la carte grise)
};

export type Cession = {
  destination?: "cession" | "destruction";
  // Destination de sortie au livre de police (distinct du Cerfa).
  sortieDestination?: "vente" | "depot_vente" | "restitution" | "destruction" | null;
  // Date réelle du mouvement au livre de police (entrée au parc / sortie).
  dateMouvement?: string | null;
  date?: string | null; // date de cession
  heure?: string | null;
  min?: string | null;
  prix?: string | null; // prix d'achat (achat) / revente TTC (vente)
  paiement?: string | null; // mode de paiement / règlement
  seller: Person; // ancien propriétaire
  buyer: Person; // nouveau propriétaire
  lieuFaitSeller?: string | null;
  dateFaitSeller?: string | null;
  lieuFaitBuyer?: string | null;
  dateFaitBuyer?: string | null;
};

export type Operation = "achat" | "vente";

export type Provenance = "france" | "belgique" | "luxembourg" | "autre_ue";

export type CerfaDossier = {
  operation: Operation; // achat = le pro achète ; vente = le pro vend
  provenance?: Provenance | null; // pays d'achat (import intracommunautaire)
  vehicle: Vehicle;
  cession: Cession;
  pro?: Person; // le professionnel, profil de l'org
};
