import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

import { APP_DESCRIPTION, APP_NAME } from "@/core/constants";
import { ConvexClientProvider } from "@/core/providers/convex-provider";
import UiProviders from "@repo/ui/ui-providers";

import type { Metadata } from "next";

import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vercel.com"),
  title: {
    default: `${APP_NAME} | The Operating System for Real-World Asset Tokenization`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["tokenized assets", "stellar network", "blockchain", "enterprise infrastructure"],
  icons: {
    icon: "/sora-logo.png",
    shortcut: "/sora-logo.png",
    apple: "/sora-logo.png",
  },
  openGraph: {
    siteName: APP_NAME,
    title: `${APP_NAME} | Real-World Asset Tokenization Infrastructure`,
    description: APP_DESCRIPTION,
    images: "/sora-og-image.png",
    type: "website",
  },
  twitter: {
    title: `${APP_NAME} | Real-World Asset Tokenization Infrastructure`,
    description: APP_DESCRIPTION,
    images: "/sora-og-image.png",
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={[hankenGrotesk.variable, inter.variable, jetbrainsMono.variable].join(" ")}>
        <ConvexClientProvider>
          <UiProviders>{children}</UiProviders>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
