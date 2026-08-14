import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Racine du projet (évite que Turbopack remonte au package-lock.json parent).
  turbopack: { root: __dirname },
  // Inclure les templates Cerfa dans le tracing des routes (lecture fs à l'exécution).
  outputFileTracingIncludes: {
    "/api/cerfa/**": ["./src/lib/cerfa/templates/**"],
  },
};

export default nextConfig;
