import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Console — Gyra",
  description:
    "Manage your Gyra API keys, wallets, and request history. One console for AI, Media, Network, and Utilities APIs.",
  alternates: { canonical: "https://gyra.ng/console" },
  openGraph: {
    title: "Gyra Developer Console",
    description:
      "Wallets, keys, usage, and activity — all in one dashboard.",
    url: "https://gyra.ng/console",
    siteName: "Gyra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra Developer Console",
    description:
      "Wallets, keys, usage, and activity — all in one dashboard.",
  },
};

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}