import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { FloatingBottomNav } from "@/components/floating-bottom-nav";
import { PwaRegister } from "@/components/pwa-register";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "UKK Servis & Katalog Laptop",
  description: "Sistem Layanan Servis & Katalog Laptop Terpadu",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UKK Servis",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col pb-28">
            {children}
          </div>
          <FloatingBottomNav />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
