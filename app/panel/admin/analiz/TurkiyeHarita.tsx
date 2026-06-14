"use client";

/**
 * 🗺️ Türkiye Haritası — iller bölgesine göre sabit renkli, sınırlı.
 * Path'ler /turkiye-iller.json (viewBox 0 0 1024 800); bölge eşlemesi /api/harita/bolgeler.
 * Hover/tıkla il bilgisi; bölge seçimi (tümü / bir bölge vurgulu).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IL_BILGI } from "@/lib/turkiye-iller";

interface BolgeBilgi { bolgeNo: number; bolgeAd: string }
interface HaritaVeri { iller: Record<string, BolgeBilgi>; bolgeler: { no: number; ad: string }[] }

/** Bölge no → sabit ayırt edici renk (20 bölge, eşit aralıklı hue) */
function bolgeRenk(no: number): string {
  return `hsl(${Math.round(((no - 1) * 360) / 20)}, 58%, 55%)`;
}

export function TurkiyeHarita() {
  const [hoverKod, setHoverKod] = useState<string | null>(null);
  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const [seciliBolge, setSeciliBolge] = useState<number | null>(null); // null = tümü

  const { data: paths } = useQuery({
    queryKey: ["harita-paths"],
    queryFn: async (): Promise<Record<string, string>> => {
      const r = await fetch("/turkiye-iller.json");
      if (!r.ok) throw new Error();
      return r.json();
    },
    staleTime: Infinity,
  });
  const { data: harita } = useQuery({
    queryKey: ["harita-bolgeler"],
    queryFn: async (): Promise<HaritaVeri> => {
      const r = await fetch("/api/harita/bolgeler");
      if (!r.ok) throw new Error();
      return r.json();
    },
    staleTime: 5 * 60_000,
  });

  const aktifKod = hoverKod ?? seciliKod;
  const aktifBolge = aktifKod ? harita?.iller[aktifKod] : undefined;

  function fill(kod: string): string {
    const b = harita?.iller[kod];
    if (!b) return "var(--bg-th)"; // bölgeye atanmamış il → gri
    return bolgeRenk(b.bolgeNo);
  }
  function opacity(kod: string): number {
    if (seciliBolge == null) return 1;
    const b = harita?.iller[kod];
    return b && b.bolgeNo === seciliBolge ? 1 : 0.22;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
      {/* Harita */}
      <div className="sv-section p-3 overflow-hidden">
        {!paths ? (
          <p className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Harita yükleniyor…</p>
        ) : (
          <svg viewBox="0 0 1024 800" className="w-full h-auto" style={{ maxHeight: "72vh" }} role="img" aria-label="Türkiye il haritası">
            {Object.entries(paths).map(([kod, d]) => {
              const aktif = kod === aktifKod;
              return (
                <path
                  key={kod}
                  d={d}
                  fill={fill(kod)}
                  fillOpacity={opacity(kod)}
                  stroke={aktif ? "var(--text-primary)" : "var(--bg-card)"}
                  strokeWidth={aktif ? 2 : 0.7}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.15s, stroke-width 0.1s" }}
                  onMouseEnter={() => setHoverKod(kod)}
                  onMouseLeave={() => setHoverKod(null)}
                  onClick={() => setSeciliKod(kod === seciliKod ? null : kod)}
                >
                  <title>{IL_BILGI[kod]?.ad ?? kod}{harita?.iller[kod] ? ` — ${harita.iller[kod].bolgeAd}` : ""}</title>
                </path>
              );
            })}
          </svg>
        )}
      </div>

      {/* Yan panel */}
      <div className="space-y-4">
        {/* Bölge filtresi */}
        <div className="sv-section p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Bölge</p>
          <select
            value={seciliBolge ?? ""}
            onChange={e => setSeciliBolge(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:outline-none"
            style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}
          >
            <option value="">Tüm Bölgeler</option>
            {harita?.bolgeler.map(b => <option key={b.no} value={b.no}>{b.no}. Bölge — {b.ad}</option>)}
          </select>
        </div>

        {/* Seçili/hover il bilgisi */}
        <div className="sv-section p-4 min-h-[110px]">
          {aktifKod ? (
            <>
              <p className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>{IL_BILGI[aktifKod]?.ad ?? aktifKod}</p>
              {aktifBolge ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: bolgeRenk(aktifBolge.bolgeNo) }} />
                  <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{aktifBolge.bolgeNo}. Bölge — {aktifBolge.bolgeAd}</span>
                </div>
              ) : (
                <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>Bu il bir bölgeye atanmamış.</p>
              )}
            </>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Haritada bir ilin üzerine gelin veya tıklayın.</p>
          )}
        </div>

        {/* Bölge lejantı (tıkla → filtrele) */}
        <div className="sv-section p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Bölgeler</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 max-h-60 overflow-y-auto">
            {harita?.bolgeler.map(b => (
              <button
                key={b.no}
                onClick={() => setSeciliBolge(seciliBolge === b.no ? null : b.no)}
                className="flex items-center gap-1.5 text-[11.5px] text-left px-1 py-0.5 rounded hover:bg-th transition"
                style={{ color: "var(--text-secondary)", fontWeight: seciliBolge === b.no ? 800 : 400 }}
              >
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: bolgeRenk(b.no) }} />
                {b.no}. Bölge
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
