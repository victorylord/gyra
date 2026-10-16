import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Products — Gyra",
  description:
    "Four APIs. One platform. AI, Media, Network, and Utilities — all under one developer account.",
  alternates: { canonical: "https://gyra.ng/products" },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}