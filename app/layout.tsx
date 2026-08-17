import type { Metadata } from "next";
import "./globals.css";

const title = "RAIFE — Governed Lead Routing";
const description =
  "A deterministic lead-routing prototype with versioned policy, agent availability, and auditable decision traces.";

export const metadata: Metadata = {
  metadataBase: new URL("https://raife.ai"),
  title,
  description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "RAIFE — Every route has a reason.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
