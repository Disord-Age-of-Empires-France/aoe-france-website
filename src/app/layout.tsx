import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollToTop from "@/components/ScrollToTop";
import InactivityTracker from "@/components/InactivityTracker";
import LoginModal from "@/components/LoginModal";

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Age of Empires France — Communauté Francophone AoE2, AoE3, AoE4, AoM",
  description:
    "La communauté française Age of Empires. Rejoignez des milliers de joueurs passionnés par AoE II, AoE III, AoE IV et Age of Mythology: Retold. Guides, tournois, actualités et Discord francophone.",
  keywords: [
    "Age of Empires France",
    "AoE France",
    "communauté Age of Empires",
    "AoE2 français",
    "AoE4 français",
    "Age of Mythology Retold",
    "tournoi Age of Empires",
    "guide AoE",
    "Discord AoE francophone",
  ],
  authors: [{ name: "Age of Empires France" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Age of Empires France — Communauté Francophone",
    description:
      "La communauté française Age of Empires. Guides, tournois, actualités et Discord francophone.",
    siteName: "Age of Empires France",
  },
  twitter: {
    card: "summary_large_image",
    title: "Age of Empires France",
    description: "La communauté française Age of Empires",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${rajdhani.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* No-FOUC: set theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('aoe-theme');if(s==='light'){document.documentElement.classList.add('light')}else if(!s&&!window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          {children}
          <ScrollToTop />
          <InactivityTracker />
          <LoginModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
