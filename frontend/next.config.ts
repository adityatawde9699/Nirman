import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
  output: "standalone",
  experimental:
    process.env.NIRMAN_OFFLINE_GRAPH === "1"
      ? { useTypeScriptCli: false }
      : undefined,
  typescript: {
    tsconfigPath:
      process.env.NIRMAN_OFFLINE_GRAPH === "1"
        ? "tsconfig.offline.json"
        : "tsconfig.json",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
  webpack(config) {
    if (process.env.NIRMAN_OFFLINE_GRAPH === "1") {
      config.resolve.alias["@radix-ui/react-slot$"] = path.resolve(
        process.cwd(),
        "src/components/offline-primitives.tsx",
      );
      config.resolve.alias["class-variance-authority$"] = path.resolve(
        process.cwd(),
        "src/components/offline-primitives.tsx",
      );
      config.resolve.alias["@xyflow/react$"] = path.resolve(
        process.cwd(),
        "src/components/offline-flow.tsx",
      );
      config.resolve.alias["@xyflow/react/dist/style.css"] = path.resolve(
        process.cwd(),
        "src/components/offline-flow.css",
      );
    }
    return config;
  },
};
export default nextConfig;
