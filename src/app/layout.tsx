import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PowerPace - สมุดบันทึกเวทเทรนนิ่ง",
  description: "แอปบันทึกน้ำหนักเวทเทรนนิ่ง รองรับทั้ง Machine แผ่นที่ และ Free Weight กิโลกรัม",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PowerPace",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090c10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full bg-[#090c10] text-[#f0f3f6]">
      <body className="min-h-full flex flex-col font-sans antialiased bg-[#090c10] text-[#f0f3f6]">
        {children}
      </body>
    </html>
  );
}
