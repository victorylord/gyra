import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media API Documentation — Gyra",
  description:
    "Full documentation for the Gyra Media API — YouTube transcripts, TikTok metadata, Spotify music search, and audio transcription.",
  alternates: { canonical: "https://gyra.ng/docs/media" },
  openGraph: {
    title: "Gyra Media API Documentation",
    description:
      "Transcribe. Search. Understand media. Five endpoints, one key, $0.90 per request.",
    url: "https://gyra.ng/docs/media",
    siteName: "Gyra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra Media API Documentation",
    description:
      "Transcribe. Search. Understand media. Five endpoints, one key, $0.90 per request.",
  },
};

export default function MediaDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}