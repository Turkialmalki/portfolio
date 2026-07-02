import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Turki Almalki | Engineering Manager & Digital Innovation Leader",
  description:
    "Learn more about Turki Almalki, an engineering and digital innovation leader based in Riyadh with experience across fintech, banking, government, web, mobile, AI, and product innovation.",
  openGraph: {
    title: "About Turki Almalki | Engineering Manager & Digital Innovation Leader",
    description:
      "Engineering and digital innovation leader based in Riyadh with experience across fintech, banking, government, web, mobile, AI, and product innovation.",
    type: "profile",
  },
};

export default function Page() {
  return <AboutClient />;
}
