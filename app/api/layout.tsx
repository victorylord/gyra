import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer API — Gyra",
  description:
    "One API for chat, media intelligence, network tools, and utilities. OpenAI-compatible. Free to start. Built for Nigeria and the world.",
  alternates: { canonical: "https://gyra.ng/api" },
  openGraph: {
    title: "Gyra Developer API",
    description:
      "Four APIs, one platform. AI, Media, Network, and Utilities under one brand.",
    url: "https://gyra.ng/api",
    siteName: "Gyra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra Developer API",
    description:
      "Four APIs, one platform. AI, Media, Network, and Utilities under one brand.",
  },
};

export default function ApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}