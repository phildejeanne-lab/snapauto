import Image from "next/image";

// Icône SnapAuto (S connecté + voiture, dégradé bleu→cyan) — extraite du logo de référence.
const RATIO = 650 / 568; // largeur / hauteur de l'image

export function Logo({ size = 34, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="SnapAuto"
      width={Math.round(size * RATIO)}
      height={size}
      className={className}
    />
  );
}

// Logo + nom (Plus Jakarta Sans). Snap = bleu foncé, Auto = bleu plus clair.
export function Brand({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span className="font-display text-xl font-extrabold tracking-tight text-white">
        Snap<span className="bg-gradient-to-r from-cyan-400 to-brand-400 bg-clip-text text-transparent">Auto</span>
      </span>
    </div>
  );
}
