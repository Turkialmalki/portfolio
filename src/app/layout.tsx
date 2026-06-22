import type { Metadata } from "next";
import { Inter, Dancing_Script, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
import Analytics from "@/components/Analytics";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing-script",
  display: "swap",
  weight: ["700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-naskh",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Turki Al-Malki — Creative Developer & Product Designer",
  description:
    "Portfolio of Turki Al-Malki — crafting intuitive and impactful digital products that seamlessly bridge user needs and business goals.",
  keywords: ["portfolio", "creative developer", "product designer", "Next.js", "UI/UX"],
  openGraph: {
    title: "Turki Al-Malki — Creative Developer & Product Designer",
    description:
      "Crafting intuitive and impactful digital products that seamlessly bridge user needs and business goals.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dancingScript.variable} ${notoNaskhArabic.variable}`}>
      <body className="antialiased overflow-x-hidden">
        {/* GTM noscript — must be first child of body */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
<LenisProvider>{children}</LenisProvider>
        <Analytics />
      </body>
    </html>
  );
}
