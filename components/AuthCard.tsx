"use client";

/** Şifre sıfırlama / e-posta doğrulama sayfaları için ortak kart kabuğu */

import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  backHref = "/",
  backLabel = "Ana Sayfaya Dön",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bg-page)" }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-active)", border: "1px solid var(--green-muted)" }}
          >
            <img src="/logo.svg" alt="" className="w-8 h-8" />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card shadow-xl px-6 py-8 sm:px-8">
          <h1 className="text-[20px] font-black text-heading text-center mb-2" style={{ letterSpacing: "-0.02em" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13.5px] text-muted text-center mb-6 leading-relaxed">{subtitle}</p>
          )}
          {children}
        </div>

        <p className="text-center mt-6">
          <Link href={backHref} className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
            ← {backLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
