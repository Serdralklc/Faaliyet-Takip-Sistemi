"use client";

/**
 * 🗺️ Lise Gençlik Türkiye Haritası — yalnızca LiseFaaliyet verisi.
 * Tek filtre (Faaliyet Performansı); il başına toplam faaliyet ısı haritası + sayı.
 * Bölge seç → o bölgeye yakınlaş + birim (il/ilçe) listesi. İl tıkla → detay + son faaliyetler.
 * Türkiye → Bölge → İl → Faaliyet Detayı.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IL_BILGI } from "@/lib/turkiye-iller";

interface Birim { ilId: string; ad: string; kod: string | null; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number }
interface IlAgg { ad: string; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number; kategori: Record<string, number> }
interface HaritaVeri { yillar: number[]; iller: Record<string, IlAgg>; bolgeler: { no: number; ad: string; birimler: Birim[] }[] }
interface Faaliyet { id: string; tarih: string; kategori: string; faaliyetAdi: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number }

const KAT_AD: Record<string, string> = {
  ILIM_SOHBET: "Ders / İlim Sohbet", SOSYAL: "Sosyal", SOSYAL_SORUMLULUK: "Sosyal Sorumluluk",
  MUHABBET: "Muhabbet Buluşması", NAMAZ: "Namaz Buluşması", KAFILE: "Kafile", DIGER: "Diğer",
};
const KAT_SIRA = ["ILIM_SOHBET", "SOSYAL", "SOSYAL_SORUMLULUK", "MUHABBET", "NAMAZ", "KAFILE", "DIGER"];

/** Path string'inden koordinat çiftleri (centroid/bbox için, yaklaşık) */
function pathXY(d: string): { xs: number[]; ys: number[] } {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i + 1]); }
  return { xs, ys };
}
const ort = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

/** Toplam faaliyete göre yeşil ısı rengi */
function isiRengi(oran: number): string {
  if (oran <= 0) return "var(--bg-th)";
  const l = 78 - Math.round(46 * Math.sqrt(oran)); // çok → koyu yeşil
  return `hsl(146, 55%, ${l}%)`;
}

export function LiseHaritaClient() {
  const [yil, setYil] = useState("");
  const [hoverKod, setHoverKod] = useState<string | null>(null);
  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const [seciliBolge, setSeciliBolge] = useState<number | null>(null);

  const { data: paths } = useQuery({
    queryKey: ["tr-paths"],
    queryFn: async (): Promise<Record<string, string>> => {
      const r = await fetch("/turkiye-iller.json"); if (!r.ok) throw new Error(); return r.json();
    },
    staleTime: Infinity,
  });
  const { data } = useQuery({
    queryKey: ["lise-harita", yil],
    queryFn: async (): Promise<HaritaVeri> => {
      const r = await fetch(`/api/lise-harita${yil ? `?yil=${yil}` : ""}`); if (!r.ok) throw new Error(); return r.json();
    },
    staleTime: 60_000,
  });

  // Seçili il için son faaliyetler
  const { data: sonFaal } = useQuery({
    queryKey: ["lise-harita-faal", seciliKod, yil],
    queryFn: async (): Promise<Faaliyet[]> => {
      const r = await fetch(`/api/lise-harita/faaliyetler?kod=${seciliKod}${yil ? `&yil=${yil}` : ""}`); if (!r.ok) return []; return r.json();
    },
    enabled: !!seciliKod,
    staleTime: 60_000,
  });

  const iller = data?.iller ?? {};
  const maxToplam = useMemo(() => Math.max(1, ...Object.values(iller).map(i => i.toplam)), [iller]);

  // Bölge → o bölgedeki coğrafi il kodları
  const bolgeKodlari = useMemo(() => {
    const m = new Map<number, Set<string>>();
    for (const b of data?.bolgeler ?? []) {
      const s = new Set<string>();
      for (const u of b.birimler) if (u.kod) s.add(u.kod);
      m.set(b.no, s);
    }
    return m;
  }, [data]);

  // Centroid'ler (sayı etiketleri için)
  const centroids = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    if (paths) for (const k in paths) { const { xs, ys } = pathXY(paths[k]); m[k] = { x: ort(xs), y: ort(ys) }; }
    return m;
  }, [paths]);

  // Bölge seçiliyse o bölgeye yakınlaş (viewBox = bölge bbox)
  const viewBox = useMemo(() => {
    if (seciliBolge == null || !paths) return "0 0 1024 800";
    const kodlar = bolgeKodlari.get(seciliBolge);
    if (!kodlar || !kodlar.size) return "0 0 1024 800";
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const k of kodlar) {
      const d = paths[k]; if (!d) continue;
      const { xs, ys } = pathXY(d);
      minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
      minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
    }
    if (!isFinite(minX)) return "0 0 1024 800";
    const pad = Math.max((maxX - minX), (maxY - minY)) * 0.15 + 20;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [seciliBolge, bolgeKodlari, paths]);

  const aktifKod = seciliKod ?? hoverKod;
  const aktifIl = aktifKod ? iller[aktifKod] : undefined;
  const seciliBolgeObj = seciliBolge != null ? data?.bolgeler.find(b => b.no === seciliBolge) : undefined;

  function kodGorunur(kod: string): boolean {
    if (seciliBolge == null) return true;
    return bolgeKodlari.get(seciliBolge)?.has(kod) ?? false;
  }

  return (
    <div className="p-6 space-y-4 max-w-[1500px]">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#7C3AED" }}>LİSE GENÇLİK</p>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Türkiye Haritası</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>İl bazında Lise Gençlik faaliyet performansı · Türkiye → Bölge → İl</p>
      </div>

      {/* Tek filtre: Gösterilecek Veri + Yıl + (bölge seçince) geri */}
      <div className="sv-section p-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Gösterilecek Veri</span>
          <select disabled className="rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}>
            <option>Faaliyet Performansı</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
          <select value={yil} onChange={e => setYil(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}>
            <option value="">Tümü</option>
            {(data?.yillar ?? []).map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Bölge</span>
          <select value={seciliBolge ?? ""} onChange={e => { setSeciliBolge(e.target.value ? Number(e.target.value) : null); setSeciliKod(null); }} className="rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}>
            <option value="">Türkiye Geneli</option>
            {(data?.bolgeler ?? []).map(b => <option key={b.no} value={b.no}>{b.no}. Bölge — {b.ad}</option>)}
          </select>
        </div>
        {(seciliBolge != null || seciliKod) && (
          <button onClick={() => { setSeciliBolge(null); setSeciliKod(null); }} className="text-[12px] font-bold underline" style={{ color: "var(--text-muted)" }}>← Türkiye geneline dön</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Harita */}
        <div className="sv-section p-3 overflow-hidden">
          {!paths || !data ? (
            <p className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Harita yükleniyor…</p>
          ) : (
            <svg viewBox={viewBox} className="w-full h-auto" style={{ maxHeight: "74vh", transition: "all 0.4s ease" }} role="img" aria-label="Lise Gençlik Türkiye haritası">
              {Object.entries(paths).map(([kod, d]) => {
                const il = iller[kod];
                const gorunur = kodGorunur(kod);
                const aktif = kod === aktifKod;
                const fill = gorunur ? isiRengi((il?.toplam ?? 0) / maxToplam) : "var(--bg-th)";
                return (
                  <path key={kod} d={d}
                    fill={fill} fillOpacity={gorunur ? 1 : 0.18}
                    stroke={aktif ? "var(--text-primary)" : "var(--bg-card)"} strokeWidth={aktif ? 2 : 0.7}
                    style={{ cursor: "pointer", transition: "fill 0.2s, fill-opacity 0.2s" }}
                    onMouseEnter={() => setHoverKod(kod)} onMouseLeave={() => setHoverKod(null)}
                    onClick={() => setSeciliKod(kod === seciliKod ? null : kod)}
                  >
                    <title>{IL_BILGI[kod]?.ad ?? kod}: {il?.toplam ?? 0} faaliyet</title>
                  </path>
                );
              })}
              {/* Sayı etiketleri (veri olan iller) */}
              {Object.entries(iller).map(([kod, il]) => {
                if (il.toplam <= 0 || !kodGorunur(kod)) return null;
                const c = centroids[kod]; if (!c) return null;
                return (
                  <text key={`t-${kod}`} x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central"
                    style={{ fontSize: seciliBolge != null ? 9 : 11, fontWeight: 800, fill: "#0f172a", pointerEvents: "none" }}>
                    {il.toplam}
                  </text>
                );
              })}
            </svg>
          )}
          {/* Lejant */}
          <div className="flex items-center gap-2 px-2 pt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span>Az</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg, hsl(146,55%,78%), hsl(146,55%,32%))" }} />
            <span>Çok faaliyet</span>
          </div>
        </div>

        {/* Yan panel: il detayı veya bölge birimleri */}
        <div className="space-y-4">
          {seciliKod && aktifIl ? (
            <>
              {/* İL DETAYI */}
              <div className="sv-section p-4">
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>İl Detayı</p>
                <p className="text-[18px] font-black" style={{ color: "var(--text-primary)" }}>{aktifIl.ad}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider mt-3 mb-2" style={{ color: "var(--text-muted)" }}>Genel Durum</p>
                <div className="grid grid-cols-2 gap-2">
                  {([["Toplam Faaliyet", aktifIl.toplam], ["Toplam Katılımcı", aktifIl.katilimci], ["İlk Kez Katılan", aktifIl.ilkKez], ["Yeni İntisap", aktifIl.yeniIntisap]] as const).map(([l, v]) => (
                    <div key={l} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-th)" }}>
                      <p className="text-[20px] font-black" style={{ color: "var(--text-primary)" }}>{v.toLocaleString("tr-TR")}</p>
                      <p className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{l}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--text-muted)" }}>Faaliyet Dağılımı</p>
                <div className="space-y-1.5">
                  {KAT_SIRA.map(k => {
                    const v = aktifIl.kategori[k] ?? 0;
                    const oran = aktifIl.toplam > 0 ? (v / aktifIl.toplam) * 100 : 0;
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between text-[12px] mb-0.5">
                          <span style={{ color: "var(--text-secondary)" }}>{KAT_AD[k]}</span>
                          <span className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{v}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-th)" }}>
                          <div className="h-full rounded-full" style={{ width: `${oran}%`, background: "#7C3AED" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : seciliBolgeObj ? (
            <>
              {/* BÖLGE DETAYI — birim (il/ilçe) listesi */}
              <div className="sv-section p-4">
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Bölge Detayı</p>
                <p className="text-[17px] font-black" style={{ color: "var(--text-primary)" }}>{seciliBolgeObj.no}. Bölge</p>
                <p className="text-[12px] mb-3" style={{ color: "var(--text-muted)" }}>{seciliBolgeObj.ad}</p>
                <div className="space-y-1">
                  {[...seciliBolgeObj.birimler].sort((a, b) => b.toplam - a.toplam).map(u => (
                    <div key={u.ilId} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-th)" }}>
                      <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.ad}</span>
                      <span className="text-[12px] font-bold tabular-nums ml-2 shrink-0" style={{ color: "#7C3AED" }}>{u.toplam}</span>
                    </div>
                  ))}
                  {!seciliBolgeObj.birimler.length && <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Birim yok.</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="sv-section p-4">
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Haritada bir <b>ile tıkla</b> → ayrıntılı analiz; üstten bir <b>bölge seç</b> → o bölgeye yakınlaşır ve illeri listelenir.
              </p>
              {aktifIl && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>{aktifIl.ad}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{aktifIl.toplam} faaliyet · {aktifIl.katilimci} katılımcı</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Son Faaliyetler (il seçiliyken) */}
      {seciliKod && (
        <div className="sv-section overflow-hidden">
          <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Son Faaliyetler — {aktifIl?.ad}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-th)" }}>
                  {["Tarih", "Kategori", "Faaliyet Adı", "Katılımcı", "İlk Kez", "Yeni İntisap"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(sonFaal ?? []).map(f => (
                  <tr key={f.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{new Date(f.tarih).toLocaleDateString("tr-TR")}</td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{KAT_AD[f.kategori] ?? f.kategori}</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: "var(--text-primary)" }}>{f.faaliyetAdi}</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>{f.katilimci}</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>{f.ilkKezKatilan}</td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: "var(--text-secondary)" }}>{f.yeniIntisap}</td>
                  </tr>
                ))}
                {(!sonFaal || !sonFaal.length) && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Bu il için faaliyet kaydı bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
