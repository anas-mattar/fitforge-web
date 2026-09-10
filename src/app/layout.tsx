import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/shell/BottomNav";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
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
      <body className="flex min-h-full flex-col font-sans">
        <Header />

        {/* VI-001: 220px sidebar column, fluid content column, 1rem gap. Below 1024px
            the grid collapses to one column and BottomNav takes the sidebar's place. */}
        <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-4 px-4 py-6 lg:grid-cols-[220px_1fr]">
          <Sidebar />
          <main className="min-w-0">{children}</main>
        </div>

        <BottomNav />
      </body>
    </html>
  );
}
