import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Evita que Next use C:\Users\TecnoUsuario1\ (package-lock padre) como raíz del monorepo. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
