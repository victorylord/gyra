import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Gyra",
  description:
    "Complete documentation for the Gyra platform — chat, vision, files, voice, media intelligence, and developer APIs.",
  alternates: { canonical: "https://gyra.ng/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="antialiased selection:bg-blue-500/30">{children}</div>;
}