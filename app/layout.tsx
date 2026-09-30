import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gyra — Intelligence, Simplified.",
  description:
    "Gyra is a multimodal AI platform for people, developers, and the applications they build. Chat, vision, files, voice, and developer APIs — unified under one intelligence.",
  applicationName: "Gyra",
  authors: [{ name: "Victory Lord", url: "https://gyra.ng/about" }],
  creator: "Victory Lord",
  publisher: "Genvia AI Company",
  metadataBase: new URL("https://gyra.ng"),
  alternates: {
    canonical: "https://gyra.ng",
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Gyra — Intelligent. Simplified.",
    description:
      "An advanced AI assistant created by Genvia AI Company, owned by Victory Lord.",
    url: "https://gyra.ng",
    siteName: "Gyra",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Gyra Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gyra — Intelligent. Simplified.",
    description:
      "An advanced AI assistant created by Genvia AI Company, owned by Victory Lord.",
    images: ["/icon.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ============================================================
// JSON-LD — structured data for Google's Knowledge Graph
// ============================================================
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gyra.ng/#organization",
      name: "Genvia AI Company",
      alternateName: ["Genvia AI", "Genvia"],
      url: "https://gyra.ng",
      logo: {
        "@type": "ImageObject",
        url: "https://gyra.ng/icon.png",
        width: 512,
        height: 512,
      },
      founder: {
        "@id": "https://gyra.ng/#founder",
      },
      foundingDate: "2026",
      description:
        "Genvia AI Company builds Gyra, an intelligent, simplified AI assistant.",
      sameAs: [
        "https://t.me/Gyra_AiBot",
        "https://t.me/GenviaNews",
      ],
    },
    {
      "@type": "Person",
      "@id": "https://gyra.ng/#founder",
      name: "Victory Lord",
      jobTitle: "Founder & CEO",
      worksFor: {
        "@id": "https://gyra.ng/#organization",
      },
      url: "https://gyra.ng/about",
    },
    {
      "@type": "WebSite",
      "@id": "https://gyra.ng/#website",
      url: "https://gyra.ng",
      name: "Gyra",
      publisher: {
        "@id": "https://gyra.ng/#organization",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://gyra.ng/#app",
      name: "Gyra",
      applicationCategory: "AIApplication",
      operatingSystem: "Web, iOS, Android",
      url: "https://gyra.ng",
      description:
        "Gyra is an intelligent, simplified AI assistant built by Genvia AI Company. Chat, vision, files, and voice — unified under one intelligence.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      publisher: {
        "@id": "https://gyra.ng/#organization",
      },
      author: {
        "@id": "https://gyra.ng/#founder",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}