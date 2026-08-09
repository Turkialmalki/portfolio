import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LenisProvider from "@/providers/LenisProvider";
import Analytics from "@/components/Analytics";
import { LanguageProvider } from "@/i18n/LanguageProvider";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Thmanyah Sans — the single brand typeface (Arabic + Latin).
// next/font self-hosts, preloads, and generates size-adjusted fallbacks (no CLS).
const thmanyah = localFont({
  src: [
    { path: "../../public/fonts/thmanyahsans-Light.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/thmanyahsans-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-thmanyah",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Tahoma", "sans-serif"],
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
      <body className={`antialiased overflow-x-hidden ${thmanyah.variable}`}>
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
      </body>
    </html>
  );
}
