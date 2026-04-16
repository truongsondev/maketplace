import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AURA - Cửa hàng thời trang",
  description: "Khám phá xu hướng thời trang mới nhất. Bộ sưu tập AURA.",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
