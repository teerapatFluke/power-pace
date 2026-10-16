import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-plex",
  display: "swap",
});

const barlow = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PowerPace - สมุดบันทึกเวทเทรนนิ่ง",
  description: "แอปบันทึกน้ำหนักเวทเทรนนิ่ง รองรับทั้ง Machine แผ่นที่ และ Free Weight กิโลกรัม",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PowerPace",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e4e4df",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`h-full ${plex.variable} ${barlow.variable}`}>
      <body className="min-h-full flex flex-col font-sans bg-concrete text-ink">
        {children}
      </body>
    </html>
  );
}
