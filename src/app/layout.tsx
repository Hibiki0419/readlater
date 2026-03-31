import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Read Later",
  description: "あとで読む記事を管理",
  manifest: "/read-later/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Read Later",
  },
};

export const viewport: Viewport = {
  themeColor: "#f0f0f0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
