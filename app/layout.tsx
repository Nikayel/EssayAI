import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EssayEdge AI - Ivy League Essay Analysis & Coaching",
  description: "Get into your dream Ivy League school with AI-powered essay analysis and expert human review. Trained on successful admits, preserves your authentic voice.",
  keywords: ["college essay", "ivy league", "essay review", "college application", "admission essay", "essay coaching"],
  authors: [{ name: "EssayEdge AI" }],
  openGraph: {
    title: "EssayEdge AI - Ivy League Essay Analysis",
    description: "AI analysis trained on successful admits + expert reviewers. See exactly what's missing and how to fix it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
