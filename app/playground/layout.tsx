import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Playground — Gyra",
  description:
    "Test any Gyra API endpoint in real time. Paste a key, run requests, see responses — no account required.",
  alternates: { canonical: "https://gyra.ng/playground" },
  openGraph: {
    title: "Gyra Live Playground",
    description:
      "Test any Gyra API endpoint in real time — media, chat, and network tools.",
    url: "https://gyra.ng/playground",
    siteName: "Gyra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra Live Playground",
    description:
      "Test any Gyra API endpoint in real time — media, chat, and network tools.",
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}