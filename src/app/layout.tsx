import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";

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
    <html lang="en" className={`${inter.variable} ${dancingScript.variable}`}>
      <body className="antialiased overflow-x-hidden">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
