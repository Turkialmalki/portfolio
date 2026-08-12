import type { Metadata } from "next";
import CareerClient from "./CareerClient";

const TITLE = "CV Review & Career Analysis | Turki Almalki — تحليل ومراجعة السيرة الذاتية";
const DESCRIPTION =
  "Upload your CV and see what recruiters see: a clear score, the issues holding it back, what already works, and the first thing to improve. Private analysis, PDF or DOCX.";
const URL = "https://www.turkialmalki.com/career";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "website",
  },
};

export default function CareerPage() {
  return <CareerClient />;
}
