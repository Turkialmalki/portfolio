import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";

const TITLE = "Career Services | CV, LinkedIn & Personal Branding — Turki Almalki";
const DESCRIPTION =
  "Premium CV, LinkedIn, and personal branding services by Turki Almalki. Get expert help improving your professional presence and positioning your experience for your next opportunity.";
const URL = "https://www.turkialmalki.com/services";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "website",
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}
