import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anime Maker - AI-Powered Anime Generator",
  description: "Generate beautiful anime scenes with AI using the latest Gemini models",
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