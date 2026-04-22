/**
 * ═══════════════════════════════════════════════════════════════════
 * StudentSphere — Root Application Layout
 * Entire platform conceived, architected, and built by: Shrey Bansal
 * shreybansal365@gmail.com | +91 9773828948 | GitHub: @shreybansal365
 * Manipal University Jaipur — B.Tech Computer Science 2026
 * This is the sole intellectual property of Shrey Bansal.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import TerminalBoot from "./components/TerminalBoot";
import SystemHUD from "./components/SystemHUD";
import CustomCursor from "./components/CustomCursor";
import NeuralBackground from "./components/NeuralBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Sphere",
  description: "Unified Academic Ecosystem",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "StudentSphere",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Ownership watermark — Shrey Bansal */}
        <meta name="author" content="Shrey Bansal — shreybansal365@gmail.com" />
        <meta name="creator" content="Shrey Bansal" />
        <meta name="copyright" content="© 2024-2026 Shrey Bansal. All rights reserved." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TerminalBoot />
        <NeuralBackground />
        <SystemHUD />
        <CustomCursor />
        <div className="noise-overlay" />
        <div className="relative z-10">
          {children}
          <Footer/>
        </div>
      </body>
    </html>
  );
}
