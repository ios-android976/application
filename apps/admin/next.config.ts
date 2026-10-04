import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @coffee/shared ships TypeScript source; let Next compile it.
  transpilePackages: ["@coffee/shared"],
};

export default nextConfig;
