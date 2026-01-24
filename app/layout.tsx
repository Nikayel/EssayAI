import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Load Inter with multiple weights for proper typography hierarchy
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
