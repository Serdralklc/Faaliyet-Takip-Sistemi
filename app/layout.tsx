import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Serhendi Gençlik - Faaliyet Takip Sistemi",
  description: "Bölge ve il bazında faaliyet takip sistemi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full" suppressHydrationWarning>
      <body className="min-h-full antialiased" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
