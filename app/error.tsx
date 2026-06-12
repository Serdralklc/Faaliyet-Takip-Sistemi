"use client";

import { useEffect } from "react";

/**
 * Kök segment hata sınırı (error boundary).
 * Beklenmeyen runtime hatalarında yedek (fallback) arayüz gösterir.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "var(--bg-active)", border: "1px solid var(--green-muted)" }}
            aria-hidden="true"
          >
            ⚠️
          </div>
        </div>

        <div
          className="rounded-2xl border shadow-xl px-6 py-8 sm:px-8 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h1
            className="text-[20px] font-black mb-2"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
          >
            Bir şeyler ters gitti
          </h1>
          <p
            className="text-[13.5px] mb-6 leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Beklenmeyen bir hata oluştu. Tekrar deneyebilir veya ana sayfaya
            dönebilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors"
              style={{ background: "#0B6B3A", color: "#FFFFFF" }}
            >
              Tekrar Dene
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[14px] font-semibold border transition-colors"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                borderColor: "var(--border)",
              }}
            >
              Ana Sayfa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
