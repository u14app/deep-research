import type { Metadata, Viewport } from "next";
import Script from "next/script";
import ThemeProvider from "@/components/Provider/Theme";
import I18Provider from "@/components/Provider/I18n";
import LanguageAttribute from "@/components/Provider/LanguageAttribute";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const HEAD_SCRIPTS = process.env.HEAD_SCRIPTS as string;

export const metadata: Metadata = {
  title: "Deep Research",
  description: "Deep Rssearch with Google Gemini Models",
  icons: {
    icon: {
      type: "image/svg+xml",
      url: "./logo.svg",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 1.0,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="auto" suppressHydrationWarning>
      <head>
        {HEAD_SCRIPTS ? <Script id="headscript">{HEAD_SCRIPTS}</Script> : null}
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18Provider>{children}</I18Provider>
        </ThemeProvider>
        <Toaster richColors toastOptions={{ duration: 3000 }} />
        <LanguageAttribute />
      </body>
    </html>
  );
}
