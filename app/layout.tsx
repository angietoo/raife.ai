import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "RAIFE — Governed Lead Routing";
const description =
  "A deterministic lead-routing prototype with versioned policy, agent availability, and auditable decision traces.";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const forwardedProtocol = incoming.get("x-forwarded-proto")?.split(",")[0];
  const protocol = forwardedProtocol ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
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
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "RAIFE — Every route has a reason." }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

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
