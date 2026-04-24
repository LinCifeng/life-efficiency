import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TabBar } from "@/components/TabBar";

export const metadata: Metadata = {
  title: "人生效率清单",
  description: "基于 135 原则的时间与精力追踪",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf7f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col pb-24">
          <main className="flex-1 px-5 pt-8 sm:px-6">{children}</main>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
