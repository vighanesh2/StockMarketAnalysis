import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = new URL("https://stock-market-analysis.vercel.app");

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: "Stock Market Analysis",
    template: "%s | Stock Market Analysis",
  },
  description:
    "Production-ready Next.js starter optimized for rapid iteration and zero-config deployment on Vercel.",
  openGraph: {
    title: "Stock Market Analysis",
    description:
      "Launch a secure, performant Next.js application on Vercel with modern tooling and best practices preconfigured.",
    url: baseUrl,
    siteName: "Stock Market Analysis",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Stock Market Analysis"
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stock Market Analysis",
    description:
      "Deploy a modern, typesafe Next.js application to Vercel in minutes.",
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
