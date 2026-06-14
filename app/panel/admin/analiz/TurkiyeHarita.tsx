"use client";

/**
 * 🗺️ Türkiye Haritası — iller bölgesine göre sabit renkli, sınırlı.
 * Path'ler /turkiye-iller.json (viewBox 0 0 1024 800); bölge eşlemesi /api/harita/bolgeler.
 * Hover/tıkla il bilgisi; bölge seçimi (tümü / bir bölge vurgulu).
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IL_BILGI } from "@/lib/turkiye-iller";

interface BolgeBilgi { bolgeNo: number; bolgeAd: string }
interface HaritaVeri { iller: Record<string, BolgeBilgi>; bolgeler: { no: number; ad: string }[] }
interface LiseAgg { kategori: Record<string, number>; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number }
interface LiseVeri { iller: Record<string, LiseAgg>; yillar: number[] }

const LISE_KAT: { kod: string; ad: string }[] = [
  { kod: "ILIM_SOHBET", ad: "İlim / Sohbet" },
  { kod: "SOSYAL", ad: "Sosyal" },
  { kod: "SOSYAL_SORUMLULUK", ad: "Sosyal Sorumluluk" },
  { kod: "MUHABBET", ad: "Muhabbet" },
  { kod: "NAMAZ", ad: "Namaz" },
  { kod: "KAFILE", ad: "Kafile" },
  { kod: "DIGER", ad: "Diğer" },
];
const DONEM_OPT: { kod: string; ad: string }[] = [
  { kod: "DONEM_1", ad: "1. Dönem" },
  { kod: "DONEM_2", ad: "2. Dönem" },
  { kod: "YAZ_DONEMI", ad: "Yaz" },
];
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

  // ── Lise faaliyet verisi (yıl / dönem / kategori filtreli) ──
  const [yil, setYil] = useState("");
  const [donem, setDonem] = useState("");
  const [kategori, setKategori] = useState("");
  const { data: lise } = useQuery({
    queryKey: ["harita-lise", yil, donem, kategori],
    queryFn: async (): Promise<LiseVeri> => {
      const q = new URLSearchParams();
      if (yil) q.set("yil", yil);
      if (donem) q.set("donem", donem);
      if (kategori) q.set("kategori", kategori);
      const r = await fetch(`/api/harita/lise?${q.toString()}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
    staleTime: 60_000,
  });

  // Seçili kapsam (il > bölge > Türkiye) için Lise metrik toplamı
  const { secimAgg, secimBaslik } = useMemo(() => {
    const li = lise?.iller ?? {};
    let kodlar: string[];
    let baslik: string;
    if (seciliKod) { kodlar = [seciliKod]; baslik = IL_BILGI[seciliKod]?.ad ?? seciliKod; }
    else if (seciliBolge != null) {
      kodlar = Object.keys(harita?.iller ?? {}).filter(k => harita!.iller[k].bolgeNo === seciliBolge);
      baslik = `${seciliBolge}. Bölge`;
    } else { kodlar = Object.keys(li); baslik = "Türkiye Geneli"; }
    const agg: LiseAgg = { kategori: {}, toplam: 0, katilimci: 0, ilkKez: 0, yeniIntisap: 0 };
    for (const k of kodlar) {
      const a = li[k];
      if (!a) continue;
      agg.toplam += a.toplam; agg.katilimci += a.katilimci; agg.ilkKez += a.ilkKez; agg.yeniIntisap += a.yeniIntisap;
      for (const ck in a.kategori) agg.kategori[ck] = (agg.kategori[ck] ?? 0) + a.kategori[ck];
    }
    return { secimAgg: agg, secimBaslik: baslik };
  }, [lise, harita, seciliKod, seciliBolge]);

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

  const selStyle = { borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" } as const;
  const chip = (active: boolean) => active
    ? { background: "var(--accent-solid)", color: "#fff", borderColor: "var(--accent-solid)" }
    : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" };

  return (
    <div className="space-y-4">
      {/* Filtre çubuğu */}
      <div className="sv-section p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
          <select value={yil} onChange={e => setYil(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold focus:outline-none" style={selStyle}>
            <option value="">Tümü</option>
            {(lise?.yillar ?? []).map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
          <div className="flex gap-1">
            <button onClick={() => setDonem("")} className="px-2.5 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(donem === "")}>Tümü</button>
            {DONEM_OPT.map(d => (
              <button key={d.kod} onClick={() => setDonem(d.kod)} className="px-2.5 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(donem === d.kod)}>{d.ad}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Lise Kategorisi</span>
          <select value={kategori} onChange={e => setKategori(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold focus:outline-none" style={selStyle}>
            <option value="">Tüm Kategoriler</option>
            {LISE_KAT.map(k => <option key={k.kod} value={k.kod}>{k.ad}</option>)}
          </select>
        </div>
      </div>

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

        {/* Lise faaliyet metrikleri (seçili kapsam) */}
        <div className="sv-section p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Lise Faaliyetleri</p>
          <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-primary)" }}>{secimBaslik}</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {([["Toplam", secimAgg.toplam], ["Katılımcı", secimAgg.katilimci], ["İlk Kez", secimAgg.ilkKez], ["Y. İntisap", secimAgg.yeniIntisap]] as const).map(([l, v]) => (
              <div key={l} className="rounded-lg px-2.5 py-2" style={{ background: "var(--bg-th)" }}>
                <p className="text-[16px] font-black" style={{ color: "var(--text-primary)" }}>{v.toLocaleString("tr-TR")}</p>
                <p className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {LISE_KAT.filter(k => !kategori || k.kod === kategori).map(k => (
              <div key={k.kod} className="flex items-center justify-between text-[12px]">
                <span style={{ color: "var(--text-secondary)" }}>{k.ad}</span>
                <span className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{secimAgg.kategori[k.kod] ?? 0}</span>
              </div>
            ))}
          </div>
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
    </div>
  );
}
