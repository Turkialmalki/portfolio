import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  /*
    The hero's composition variant, so it can be set the way it reads —
    `HERO_VISUAL_VARIANT=meaningful npm run dev` — rather than only through the
    NEXT_PUBLIC_ name the browser bundle needs. Both spellings resolve to the
    same build-time constant; src/config/heroVariant.ts is the only thing that
    reads it. Unset means the shipped composition, at every width.
  */
  env: {
    NEXT_PUBLIC_HERO_VISUAL_VARIANT:
      process.env.NEXT_PUBLIC_HERO_VISUAL_VARIANT ??
      process.env.HERO_VISUAL_VARIANT ??
      "",
  },
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
