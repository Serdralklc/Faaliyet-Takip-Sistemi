"use client";

/**
 * Gönüllü doküman görüntüleyici — /gonullu/panel/dokumanlar
 * erisimGonullu=true klasör ve dosyaları salt okunur gezdirir (indir tek eylem).
 */

import { useEffect, useState } from "react";
import { BRAND, useColors } from "@/lib/theme";

interface Klasor {
  id: string;
  ad: string;
  _count: { children: number; dokumanlar: number };
}

interface Dosya {
  id: string;
  ad: string;
  url: string;
  boyut: number;
  uzanti: string;
  createdAt: string;
}

interface Yanit {
  klasorlar: Klasor[];
  dosyalar: Dosya[];
  breadcrumb: { id: string; ad: string }[];
}

function formatBoyut(boyut: number): string {
  if (boyut >= 1024 * 1024) return `${(boyut / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(boyut / 1024))} KB`;
}

const KlasorIkon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const DosyaIkon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export default function GonulluDokumanlarPage() {
  const c = useColors();
  const [klasorId, setKlasorId] = useState<string | null>(null);
  const [veri, setVeri] = useState<Yanit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gonullu/dokumanlar${klasorId ? `?klasorId=${klasorId}` : ""}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: Yanit) => setVeri(d))
      .catch(() => setVeri({ klasorlar: [], dosyalar: [], breadcrumb: [] }))
      .finally(() => setLoading(false));
  }, [klasorId]);

  const bos = !loading && veri && veri.klasorlar.length === 0 && veri.dosyalar.length === 0;

  const crumbSt = (aktif: boolean): React.CSSProperties => ({
    background: "none", border: "none", padding: 0, fontSize: "13px",
    fontWeight: aktif ? 700 : 500,
    color: aktif ? c.h : c.mu,
    cursor: aktif ? "default" : "pointer",
  });

  return (
    <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: BRAND.gold, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>Gönüllü Paneli</p>
        <h1 style={{ color: c.h, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.025em" }}>Dokümanlar</h1>
      </div>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        <button style={crumbSt(!klasorId)} onClick={() => klasorId && setKlasorId(null)}>
          Dokümanlar
        </button>
        {(veri?.breadcrumb ?? []).map((b, i, arr) => {
          const sonuncu = i === arr.length - 1;
          return (
            <span key={b.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: c.mu, fontSize: "12px" }}>/</span>
              <button style={crumbSt(sonuncu)} onClick={() => !sonuncu && setKlasorId(b.id)}>
                {b.ad}
              </button>
            </span>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color: c.mu, fontSize: "14px" }}>Yükleniyor...</p>
      ) : bos ? (
        <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1.25rem", padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: c.bg2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <KlasorIkon color={c.mu} />
          </div>
          <p style={{ color: c.h, fontWeight: 600, fontSize: "15px" }}>
            {klasorId ? "Bu klasör boş." : "Sizinle paylaşılmış doküman yok."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Klasör kartları */}
          {veri && veri.klasorlar.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {veri.klasorlar.map(k => (
                <button
                  key={k.id}
                  onClick={() => setKlasorId(k.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
                    background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem",
                    padding: "14px 16px", cursor: "pointer",
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "10px", background: BRAND.green + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <KlasorIkon color={BRAND.green} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: c.h, fontWeight: 700, fontSize: "13.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.ad}</p>
                    <p style={{ color: c.mu, fontSize: "11.5px", marginTop: "2px" }}>
                      {k._count.children} klasör · {k._count.dokumanlar} dosya
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Dosya satırları */}
          {veri && veri.dosyalar.length > 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.br}`, borderRadius: "1rem", overflow: "hidden" }}>
              {veri.dosyalar.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                    borderTop: i === 0 ? "none" : `1px solid ${c.br}`,
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "9px", background: c.bg2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DosyaIkon color={c.mu} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ color: c.h, fontWeight: 600, fontSize: "13.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.ad}</p>
                    <p style={{ color: c.mu, fontSize: "11.5px", marginTop: "2px" }}>
                      {formatBoyut(d.boyut)} · {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <a
                    href={d.url}
                    download
                    style={{ background: BRAND.green, color: BRAND.gold, padding: "7px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "12.5px", textDecoration: "none", flexShrink: 0 }}
                  >
                    İndir
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
