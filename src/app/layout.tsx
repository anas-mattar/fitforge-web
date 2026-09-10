import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { THEME_SCRIPT } from "@/components/shell/theme-script";
import "./globals.css";

/**
 * VI-010. The visual reference loads Inter from a CDN because a single HTML file has no
 * other option; the application self-hosts it at build time instead of adding a
 * third-party request to every page load (plan §4.6). The fallback stack is real, so a
 * font that fails to load never leaves the page in a serif.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitForge",
  description: "Plan your training, log your sets, and see what changed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint, not after hydration — see theme-script.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* The shell used to live here. It moved to (app)/layout.tsx in feature 002 phase
          7 so that VI-015 — no shell on sign-in — is a structural fact rather than a
          conditional somebody has to keep correct. */}
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
