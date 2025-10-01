import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dream Weaver AI - AI-Powered Anime Story Generator",
  description: "Transform your stories into beautiful anime with AI. Generate complete narratives with multi-scene image generation, character consistency, and style customization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {children}
      </body>
    </html>
  );
}