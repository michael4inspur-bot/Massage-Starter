import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvidenceTuina · 循证推拿实验室",
  description:
    "面向零基础用户的现代循证推拿（手法治疗）速成训练：解剖定位 → 安全筛查 → 物理参数化实操 → 机制文献内化。",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
