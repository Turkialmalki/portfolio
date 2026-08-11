import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

const TITLE = "Career Privacy | How Turki Almalki Handles Your CV — turkialmalki.com";
const DESCRIPTION =
  "Your CV is private. A clear, human explanation of what Career processes, why, how AI is used, and what we never do with your data.";
const URL = "https://www.turkialmalki.com/career/privacy";

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

export default function Page() {
  return <PrivacyClient />;
}
