import type { Metadata } from "next";
import { Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
import CustomCursor from "@/components/CustomCursor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Turki Al-Malki — Creative Developer & Designer",
  description:
    "Portfolio of Turki Al-Malki — crafting digital experiences at the intersection of design and technology.",
  keywords: [
    "portfolio",
    "creative developer",
    "designer",
    "Next.js",
    "UI/UX",
    "product design",
  ],
  openGraph: {
    title: "Turki Al-Malki — Creative Developer & Designer",
    description: "Crafting digital experiences at the intersection of design and technology.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${greatVibes.variable}`}>
      <body className="bg-black text-white antialiased overflow-x-hidden">
        <LenisProvider>
          <CustomCursor />
          {/* Grain texture overlay */}
          <div className="grain-layer" aria-hidden="true" />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
