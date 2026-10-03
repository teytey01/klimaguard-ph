import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/common";
import "./globals.css";

// Standard no-flash theme script. This is the ONE accepted exception to the
// no-inline rule: it must run synchronously in <head> BEFORE paint so the
// stored (or OS) theme is applied before React hydrates, avoiding a flash.
// Reads localStorage 'klimaguard-theme', falls back to prefers-color-scheme,
// and defaults to light (adds the `dark` class only when dark resolves).
const NO_FLASH_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('klimaguard-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KlimaGuard PH",
  description:
    "Ang iyong conversational AI katuwang sa panahon, babala sa panganib, at payo sa pagsasaka para sa mga komunidad sa Pilipinas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
