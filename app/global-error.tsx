"use client";

import { useEffect } from "react";

/**
 * Kök layout'u saran global hata sınırı.
 * Aktif olduğunda kök layout'un yerini alır; bu yüzden kendi
 * <html>/<body> etiketlerini içermek ZORUNDADIR. CSS yüklenmemiş
 * olabileceğinden inline stil kullanılır.
 */
export default function GlobalError({
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
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 16px",
          background: "#F6F8F5",
          color: "#0F172A",
          fontFamily:
            "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 24px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              background: "#EBF5EF",
              border: "1px solid #C8E6D5",
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              padding: "32px 28px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
          >
            <h1
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
                color: "#0F172A",
              }}
            >
              Bir şeyler ters gitti
            </h1>
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "#64748B",
                margin: "0 0 24px",
              }}
            >
              Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
            </p>

            <button
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 24px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                background: "#0B6B3A",
                color: "#FFFFFF",
              }}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
