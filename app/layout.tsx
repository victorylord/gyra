import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Gyra — Intelligent. Simplified.",
  description:
    "Gyra is an advanced AI assistant created by Genvia AI Company, owned by Victory Lord. Chat, create, and build with the most intelligent and simplified AI platform.",
  applicationName: "Gyra",
  authors: [{ name: "Victory Lord" }],
  creator: "Victory Lord",
  publisher: "Genvia AI Company",
  metadataBase: new URL("https://gyra.ng"),
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", type: "image/png" },
    ],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="shortcut icon" href="/icon.png" />
      </head>
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}