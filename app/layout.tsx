import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Use local Geist font (bundled with Next.js) for reliability
// Falls back to system fonts if local font fails
const geist = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  title: "IvyWay - Ivy League Essay Analysis & Coaching",
  description: "Get into your dream Ivy League school with AI-powered essay analysis and expert human review. Trained on successful admits, preserves your authentic voice.",
  keywords: ["college essay", "ivy league", "essay review", "college application", "admission essay", "essay coaching", "common app essay", "personal statement"],
  authors: [{ name: "IvyWay" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ivyway.ai'),
  openGraph: {
    title: "IvyWay - Ivy League Essay Analysis",
    description: "AI analysis trained on successful admits + expert reviewers. See exactly what's missing and how to fix it.",
    type: "website",
    siteName: "IvyWay",
  },
  twitter: {
    card: "summary_large_image",
    title: "IvyWay - Ivy League Essay Analysis",
    description: "AI analysis trained on successful admits + expert reviewers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${geist.variable}`}>
      <body className={`${geist.className} antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
