import type { Metadata } from "next";
import { Lexend, Montserrat, Poppins } from "next/font/google";

import { AlertBanner } from "@/components/alerts";
import { AuthProvider, LanguageProvider, ThemeProvider } from "@/components/common";
import "./globals.css";

// Standard no-flash theme script. This is the ONE accepted exception to the
// no-inline rule: it must run synchronously in <head> BEFORE paint so the
// stored (or OS) theme is applied before React hydrates, avoiding a flash.
// Reads localStorage 'klimaguard-theme', falls back to prefers-color-scheme,
// and defaults to light (adds the `dark` class only when dark resolves).
const NO_FLASH_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('klimaguard-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

// Companion no-flash script for language: set data-lang/lang before paint so
// the first render matches the stored (or browser) language. Defaults to
// Filipino unless the stored value or the browser preference is English.
const NO_FLASH_LANG_SCRIPT = `(function(){try{var l=localStorage.getItem('klimaguard-lang');if(l!=='en'&&l!=='fil'){l=(navigator.language||'').toLowerCase().indexOf('en')===0?'en':'fil';}document.documentElement.setAttribute('data-lang',l);document.documentElement.setAttribute('lang',l==='en'?'en':'fil');}catch(e){}})();`;

// Typography roles:
// - Lexend: body text (built for reading ease — good for outdoor mobile use)
// - Montserrat: headings, brand, titles
// - Poppins: UI accents (buttons, chips, labels, nav)
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

// Poppins is not a variable font, so weights must be listed explicitly.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KlimaGuard PH",
  description:
    "Ang iyong conversational AI katuwang sa panahon, babala sa panganib, at payo sa pagsasaka para sa mga komunidad sa Pilipinas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the no-flash scripts set `dark`/`lang`/`data-lang`
    // on <html> before hydration, which is expected to differ from the server.
    <html
      lang="fil"
      suppressHydrationWarning
      className={`${lexend.variable} ${montserrat.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_LANG_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <AlertBanner />
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
