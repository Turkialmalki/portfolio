import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
import Analytics from "@/components/Analytics";
import CareerHealthProbe from "@/components/CareerHealthProbe";
import { LanguageProvider } from "@/i18n/LanguageProvider";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Thmanyah Sans — the single brand typeface for BOTH scripts. Every weight the
 * site uses (300/400/500/700/900) is a real file, so nothing is ever synthesised.
 *
 * · woff2, not otf: the same five faces go from ~1.17 MB to ~374 KB total, which
 *   is what actually keeps Arabic from flashing in a fallback face on first paint.
 * · `adjustFontFallback: false`: next/font's automatic fallback is derived from
 *   ARIAL's metrics. Arial's vertical metrics are nothing like an Arabic face's
 *   (this font is 1000/-250 per em), so the generated `size-adjust` mis-scales
 *   every Arabic glyph for as long as the fallback is on screen. Better to have
 *   no synthetic face at all and fall straight through to a real Arabic system
 *   font for the few milliseconds before the woff2 lands.
 */
const thmanyah = localFont({
  src: [
    { path: "../../public/fonts/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-thmanyah",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  // Arabic-capable system faces only — never a Latin-only default.
  fallback: [
    "SF Arabic",
    "Geeza Pro",
    "Segoe UI",
    "Noto Sans Arabic",
    "Tahoma",
    "system-ui",
    "sans-serif",
  ],
});

// Applies persisted language before first paint to avoid an RTL/LTR flash
const LANG_INIT = `(function(){try{var l=localStorage.getItem("portfolio-lang");if(l!=="en"&&l!=="ar")l="ar";var d=document.documentElement;d.lang=l;d.dir=l==="ar"?"rtl":"ltr";d.setAttribute("data-lang",l);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "تركي المالكي — قائد هندسة برمجيات ومستشار تقني",
  description:
    "الموقع الرسمي لتركي المالكي — قائد هندسة برمجيات ومستشار تقني معتمد، أساعد الشركات والمنشآت على بناء منتجات رقمية قابلة للتوسع وعالية الأثر.",
  keywords: [
    "تركي المالكي",
    "مستشار تقني",
    "هندسة برمجيات",
    "استشارات تقنية",
    "Turki Almalki",
    "engineering leader",
    "technology consultant",
    "Next.js",
    "React",
  ],
  openGraph: {
    title: "تركي المالكي — قائد هندسة برمجيات ومستشار تقني",
    description:
      "أساعد الشركات والمنشآت على بناء منتجات رقمية قابلة للتوسع وعالية الأثر — استشارات، مراجعات، وبناء منتجات.",
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={thmanyah.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />
      </head>
      <body className={`antialiased ${thmanyah.variable}`}>
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
        <LanguageProvider>
          <LenisProvider>{children}</LenisProvider>
        </LanguageProvider>
        <Analytics />
        <CareerHealthProbe />
      </body>
    </html>
  );
}
