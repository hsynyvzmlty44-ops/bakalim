import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Albüm ilk sayfa şiiri vb. */
const poemSerif = Cormorant_Garamond({
  variable: "--font-poem",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "Bakalım, birlikte — Hikâyemiz",
  description: "Bir bakalım’la başlayan, birlikte büyüyen hikâyemiz.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bakalım, birlikte",
  },
};

export const viewport: Viewport = {
  themeColor: "#101925",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${poemSerif.variable} h-full antialiased`}
    >
      <body className="relative min-h-screen min-h-[100dvh] bg-[#0F172A] font-sans text-slate-100">
        <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col items-stretch justify-start">
          {children}
        </div>
      </body>
    </html>
  );
}
