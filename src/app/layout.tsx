import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liki-Stock Pro",  // ✅ Changé
  description: "Gestion intelligente de stock et de ventes",  // ✅ Changé
  manifest: "/manifest.json",  // ✅ AJOUTÉ
  themeColor: "#7C3AED",  // ✅ AJOUTÉ
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",  // ✅ AJOUTÉ
  appleWebApp: {  // ✅ AJOUTÉ (pour iOS)
    capable: true,
    statusBarStyle: "default",
    title: "Liki-Stock Pro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}