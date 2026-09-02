import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    /* The hero and footer plates are deliberately requested above the default
       75 — declaring the set they use is what next/image asks for, and stops
       it warning once per image on every load. */
    qualities: [75, 90, 92, 100],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
