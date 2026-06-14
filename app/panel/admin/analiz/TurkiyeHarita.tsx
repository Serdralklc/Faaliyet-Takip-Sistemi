"use client";

/**
 * 🗺️ Lise Gençlik Türkiye Haritası (Rapor ve Analiz → Türkiye Haritası sekmesi).
 * Yalnız LiseFaaliyet verisi. Bizim bölge/il yapımız (İstanbul ilçeleri il sayılır).
 * Yan filtreler (Yıl/Dönem/Bölge/Kategori) + Renklendirme metriği (ısı haritası) +
 * il etiketleri + bölge zoom + il detay + son 10 faaliyet.
 * Türkiye → Bölge → İl → Faaliyet Detayı.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IL_BILGI } from "@/lib/turkiye-iller";

interface Birim { ilId: string; ad: string; kod: string | null; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number; kategori: Record<string, number> }
interface IlAgg { ad: string; toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number; kategori: Record<string, number> }
interface HaritaVeri { yillar: number[]; iller: Record<string, IlAgg>; bolgeler: { no: number; ad: string; birimler: Birim[] }[] }
interface Faaliyet { id: string; tarih: string; kategori: string; faaliyetAdi: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number }

const KAT_AD: Record<string, string> = {
  ILIM_SOHBET: "İlim / Sohbet", SOSYAL: "Sosyal", SOSYAL_SORUMLULUK: "Sosyal Sorumluluk",
  MUHABBET: "Muhabbet", NAMAZ: "Namaz", KAFILE: "Kafile", DIGER: "Diğer",
};
const KAT_SIRA = ["ILIM_SOHBET", "SOSYAL", "SOSYAL_SORUMLULUK", "MUHABBET", "NAMAZ", "KAFILE", "DIGER"];
const DONEM_OPT = [{ k: "DONEM_1", a: "1. Dönem" }, { k: "DONEM_2", a: "2. Dönem" }, { k: "YAZ_DONEMI", a: "Yaz" }];

const METRIK = [
  { key: "bolge", ad: "Bölge (renkli)" },
  { key: "toplam", ad: "Toplam Faaliyet" },
  { key: "katilimci", ad: "Katılımcı Sayısı" },
  { key: "yeniIntisap", ad: "Yeni İntisap" },
  { key: "ilkKez", ad: "İlk Kez Katılan" },
  { key: "performans", ad: "Performans Puanı" },
  { key: "veriGiris", ad: "Veri Giriş Durumu" },
] as const;
type MetrikKey = (typeof METRIK)[number]["key"];

function performansPuan(il: IlAgg): number {
  return Math.round(il.toplam * 1 + il.katilimci * 0.2 + il.yeniIntisap * 5 + il.ilkKez * 2);
}
function metrikDeger(il: IlAgg | undefined, m: MetrikKey): number {
  if (!il) return 0;
  switch (m) {
    case "toplam": return il.toplam;
    case "katilimci": return il.katilimci;
    case "yeniIntisap": return il.yeniIntisap;
    case "ilkKez": return il.ilkKez;
    case "performans": return performansPuan(il);
    case "veriGiris": return il.toplam > 0 ? 1 : 0;
    default: return il.toplam;
  }
}

function pathXY(d: string): { xs: number[]; ys: number[] } {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(nums[i]); ys.push(nums[i + 1]); }
  return { xs, ys };
}
const ort = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const bolgeRenk = (no: number) => `hsl(${Math.round(((no - 1) * 360) / 20)}, 58%, 55%)`;
function isiRenk(oran: number): string {
  const hue = Math.round(Math.max(0, Math.min(1, oran)) * 130);
  return `hsl(${hue}, 70%, 50%)`;
}

export function TurkiyeHarita() {
  const [yil, setYil] = useState("");
  const [donem, setDonem] = useState("");
  const [kategori, setKategori] = useState("");
  const [metrik, setMetrik] = useState<MetrikKey>("bolge");
  const [hoverKod, setHoverKod] = useState<string | null>(null);
  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const [seciliBirim, setSeciliBirim] = useState<Birim | null>(null);
  const [seciliBolge, setSeciliBolge] = useState<number | null>(null);

  // İl (coğrafi) ve birim (org il/ilçe) seçimi karşılıklı dışlar
  const ilSec = (kod: string) => { setSeciliBirim(null); setSeciliKod(k => (k === kod ? null : kod)); };
  const birimSec = (u: Birim) => { setSeciliKod(null); setSeciliBirim(b => (b?.ilId === u.ilId ? null : u)); };
  const temizle = () => { setSeciliBolge(null); setSeciliKod(null); setSeciliBirim(null); };

  const { data: paths } = useQuery({
    queryKey: ["tr-paths"],
    queryFn: async (): Promise<Record<string, string>> => { const r = await fetch("/turkiye-iller.json"); if (!r.ok) throw new Error(); return r.json(); },
    staleTime: Infinity,
  });
  const { data } = useQuery({
    queryKey: ["lise-harita", yil, donem, kategori],
    queryFn: async (): Promise<HaritaVeri> => {
      const q = new URLSearchParams();
      if (yil) q.set("yil", yil); if (donem) q.set("donem", donem); if (kategori) q.set("kategori", kategori);
      const r = await fetch(`/api/lise-harita?${q.toString()}`); if (!r.ok) throw new Error(); return r.json();
    },
    staleTime: 60_000,
  });
  // Detay kaynağı: önce birim (ilId), yoksa coğrafi il (kod)
  const detaySrc = seciliBirim ? { tip: "ilId", val: seciliBirim.ilId } : seciliKod ? { tip: "kod", val: seciliKod } : null;
  const { data: sonFaal } = useQuery({
    queryKey: ["lise-harita-faal", detaySrc?.tip, detaySrc?.val, yil, donem, kategori],
    queryFn: async (): Promise<Faaliyet[]> => {
      const q = new URLSearchParams({ [detaySrc!.tip]: detaySrc!.val });
      if (yil) q.set("yil", yil); if (donem) q.set("donem", donem); if (kategori) q.set("kategori", kategori);
      const r = await fetch(`/api/lise-harita/faaliyetler?${q.toString()}`); if (!r.ok) return []; return r.json();
    },
    enabled: !!detaySrc, staleTime: 60_000,
  });

  const iller = data?.iller ?? {};
  const maxDeger = useMemo(() => {
    if (metrik === "bolge" || metrik === "veriGiris") return 1;
    return Math.max(1, ...Object.values(iller).map(il => metrikDeger(il, metrik)));
  }, [iller, metrik]);

  const bolgeKodlari = useMemo(() => {
    const m = new Map<number, Set<string>>();
    for (const b of data?.bolgeler ?? []) { const s = new Set<string>(); for (const u of b.birimler) if (u.kod) s.add(u.kod); m.set(b.no, s); }
    return m;
  }, [data]);
  const kodBolge = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [no, s] of bolgeKodlari) for (const k of s) if (!(k in m)) m[k] = no;
    return m;
  }, [bolgeKodlari]);
  const centroids = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    if (paths) for (const k in paths) { const { xs, ys } = pathXY(paths[k]); m[k] = { x: ort(xs), y: ort(ys) }; }
    return m;
  }, [paths]);

  const viewBox = useMemo(() => {
    if (seciliBolge == null || !paths) return "0 0 1024 800";
    const kodlar = bolgeKodlari.get(seciliBolge); if (!kodlar?.size) return "0 0 1024 800";
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const k of kodlar) { const d = paths[k]; if (!d) continue; const { xs, ys } = pathXY(d); minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs); minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys); }
    if (!isFinite(minX)) return "0 0 1024 800";
    const pad = Math.max(maxX - minX, maxY - minY) * 0.12 + 15;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [seciliBolge, bolgeKodlari, paths]);

  function ilFill(kod: string): string {
    const il = iller[kod];
    if (metrik === "bolge") { const no = kodBolge[kod]; return no ? bolgeRenk(no) : "var(--bg-th)"; }
    if (metrik === "veriGiris") return (il?.toplam ?? 0) > 0 ? "hsl(140,65%,45%)" : "hsl(0,70%,55%)";
    return isiRenk(metrikDeger(il, metrik) / maxDeger);
  }
  function gorunur(kod: string): boolean { return seciliBolge == null || (bolgeKodlari.get(seciliBolge)?.has(kod) ?? false); }

  const aktifKod = seciliKod ?? hoverKod;
  const seciliBolgeObj = seciliBolge != null ? data?.bolgeler.find(b => b.no === seciliBolge) : undefined;
  // Detay panelinde gösterilen seçili varlık (önce birim/ilçe, yoksa coğrafi il)
  const detay = seciliBirim ?? (seciliKod ? iller[seciliKod] : undefined);
  // Bölge seçiliyse soldaki liste = bölgenin birimleri (il/ilçe); değilse coğrafi iller
  const birimListe = seciliBolgeObj
    ? [...seciliBolgeObj.birimler].sort((a, b) => (metrik === "bolge" ? b.toplam - a.toplam : metrikDeger(b, metrik) - metrikDeger(a, metrik)))
    : [];

  const tabloIller = useMemo(() => {
    const arr = Object.entries(iller).map(([kod, il]) => ({ kod, il, deger: metrik === "bolge" ? il.toplam : metrikDeger(il, metrik) }));
    if (seciliBolge != null) { const s = bolgeKodlari.get(seciliBolge); return arr.filter(x => s?.has(x.kod)).sort((a, b) => b.deger - a.deger); }
    return arr.sort((a, b) => b.deger - a.deger);
  }, [iller, metrik, seciliBolge, bolgeKodlari]);

  const selS = { borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" } as const;
  const chip = (a: boolean) => a ? { background: "var(--accent-solid)", color: "#fff", borderColor: "var(--accent-solid)" } : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" };
  const etiketDeger = (il: IlAgg | undefined) => (metrik === "bolge" || metrik === "veriGiris") ? "" : String(metrikDeger(il, metrik));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      {/* ── Yan filtreler ── */}
      <div className="space-y-3">
        <div className="sv-section p-4 space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Yıl</p>
            <select value={yil} onChange={e => setYil(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm font-semibold" style={selS}>
              <option value="">Tümü</option>{(data?.yillar ?? []).map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Dönem</p>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setDonem("")} className="px-2.5 py-1 rounded-lg text-[12.5px] font-semibold border" style={chip(donem === "")}>Tümü</button>
              {DONEM_OPT.map(d => <button key={d.k} onClick={() => setDonem(d.k)} className="px-2.5 py-1 rounded-lg text-[12.5px] font-semibold border" style={chip(donem === d.k)}>{d.a}</button>)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Bölge</p>
            <select value={seciliBolge ?? ""} onChange={e => { setSeciliBolge(e.target.value ? Number(e.target.value) : null); setSeciliKod(null); setSeciliBirim(null); }} className="w-full rounded-lg border px-3 py-1.5 text-sm font-semibold" style={selS}>
              <option value="">Türkiye Geneli</option>{(data?.bolgeler ?? []).map(b => <option key={b.no} value={b.no}>{b.no}. Bölge — {b.ad}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Lise Kategorisi</p>
            <select value={kategori} onChange={e => setKategori(e.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm font-semibold" style={selS}>
              <option value="">Tüm Kategoriler</option>{KAT_SIRA.map(k => <option key={k} value={k}>{KAT_AD[k]}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Renklendirme / Gösterim</p>
            <select value={metrik} onChange={e => setMetrik(e.target.value as MetrikKey)} className="w-full rounded-lg border px-3 py-1.5 text-sm font-semibold" style={selS}>
              {METRIK.map(m => <option key={m.key} value={m.key}>{m.ad}</option>)}
            </select>
            {metrik !== "bolge" && (
              <div className="flex items-center gap-2 mt-2 text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                {metrik === "veriGiris" ? (<><span className="w-3 h-3 rounded" style={{ background: "hsl(0,70%,55%)" }} /><span>Girmemiş</span><span className="w-3 h-3 rounded ml-2" style={{ background: "hsl(140,65%,45%)" }} /><span>Girmiş</span></>) : (<><span>Düşük</span><div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg, hsl(0,70%,50%), hsl(60,70%,50%), hsl(130,70%,50%))" }} /><span>Yüksek</span></>)}
              </div>
            )}
          </div>
        </div>

        <div className="sv-section overflow-hidden">
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}><p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{seciliBolgeObj ? `Birimler · ${seciliBolgeObj.no}. Bölge` : "İller (sıralı)"}</p></div>
          <div className="max-h-[280px] overflow-y-auto">
            {seciliBolgeObj ? (
              birimListe.map(u => (
                <button key={u.ilId} onClick={() => birimSec(u)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-th transition"
                  style={seciliBirim?.ilId === u.ilId ? { background: "var(--bg-active)" } : undefined}>
                  <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.ad}</span>
                  <span className="text-[12px] font-bold tabular-nums ml-2 shrink-0" style={{ color: "#7C3AED" }}>{metrik === "bolge" ? u.toplam : metrikDeger(u, metrik)}</span>
                </button>
              ))
            ) : (
              tabloIller.slice(0, 81).map(({ kod, deger }) => (
                <button key={kod} onClick={() => ilSec(kod)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-th transition"
                  style={seciliKod === kod ? { background: "var(--bg-active)" } : undefined}>
                  <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{IL_BILGI[kod]?.ad ?? kod}</span>
                  <span className="text-[12px] font-bold tabular-nums ml-2 shrink-0" style={{ color: "#7C3AED" }}>{deger}</span>
                </button>
              ))
            )}
            {seciliBolgeObj && !birimListe.length && <p className="px-3 py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Birim yok.</p>}
            {!seciliBolgeObj && !tabloIller.length && <p className="px-3 py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Veri yok.</p>}
          </div>
        </div>
      </div>

      {/* ── Harita + detay ── */}
      <div className="space-y-4">
        <div className="sv-section p-3 overflow-hidden">
          {(seciliBolge != null || detay) && (
            <button onClick={temizle} className="text-[12px] font-bold underline mb-1" style={{ color: "var(--text-muted)" }}>← Türkiye geneline dön</button>
          )}
          {!paths || !data ? (
            <p className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Harita yükleniyor…</p>
          ) : (
            <svg viewBox={viewBox} className="w-full h-auto" style={{ maxHeight: "70vh", transition: "all 0.4s ease" }} role="img" aria-label="Lise Gençlik Türkiye haritası">
              {Object.entries(paths).map(([kod, d]) => {
                const g = gorunur(kod);
                const aktif = kod === aktifKod;
                return (
                  <path key={kod} d={d} fill={g ? ilFill(kod) : "var(--bg-th)"} fillOpacity={g ? 1 : 0.15}
                    stroke={aktif ? "#0f172a" : "#ffffff"} strokeWidth={aktif ? 2 : 0.6}
                    style={{ cursor: "pointer", transition: "fill 0.2s, fill-opacity 0.2s" }}
                    onMouseEnter={() => setHoverKod(kod)} onMouseLeave={() => setHoverKod(null)}
                    onClick={() => ilSec(kod)}>
                    <title>{IL_BILGI[kod]?.ad ?? kod}: {iller[kod]?.toplam ?? 0} faaliyet</title>
                  </path>
                );
              })}
              {Object.keys(paths).map(kod => {
                if (!gorunur(kod)) return null;
                const il = iller[kod]; const c = centroids[kod]; if (!c) return null;
                const deg = etiketDeger(il);
                const fs = seciliBolge != null ? 7 : 5.5;
                return (
                  <g key={`l-${kod}`} pointerEvents="none">
                    <text x={c.x} y={c.y - (deg ? 4 : 0)} textAnchor="middle" dominantBaseline="central" style={{ fontSize: fs, fontWeight: 700, fill: "#0f172a" }}>{IL_BILGI[kod]?.ad ?? kod}</text>
                    {deg && <text x={c.x} y={c.y + fs} textAnchor="middle" dominantBaseline="central" style={{ fontSize: fs + 2, fontWeight: 800, fill: "#0f172a" }}>{deg}</text>}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {detay && (
          <div className="sv-section p-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-[18px] font-black" style={{ color: "var(--text-primary)" }}>{detay.ad}</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Lise Gençlik faaliyet özeti</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {([["Toplam Faaliyet", detay.toplam], ["Toplam Katılımcı", detay.katilimci], ["İlk Kez Katılan", detay.ilkKez], ["Yeni İntisap", detay.yeniIntisap]] as const).map(([l, v]) => (
                <div key={l} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-th)" }}>
                  <p className="text-[20px] font-black" style={{ color: "var(--text-primary)" }}>{v.toLocaleString("tr-TR")}</p>
                  <p className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{l}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--text-muted)" }}>Faaliyet Dağılımı</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {KAT_SIRA.map(k => (
                <div key={k} className="rounded-lg px-2.5 py-2 text-center" style={{ background: "var(--bg-th)" }}>
                  <p className="text-[15px] font-black" style={{ color: "#7C3AED" }}>{detay.kategori[k] ?? 0}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{KAT_AD[k]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!detay && seciliBolgeObj && (
          <div className="sv-section p-4">
            <p className="text-[16px] font-black" style={{ color: "var(--text-primary)" }}>{seciliBolgeObj.no}. Bölge <span className="text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>· {seciliBolgeObj.ad}</span></p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Soldaki <b>Birimler</b> listesinden bir il/ilçe seçin → ayrıntılı faaliyetleri burada görünür.</p>
          </div>
        )}

        {detay && (
          <div className="sv-section overflow-hidden">
            <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Son Faaliyetler — {detay.ad}</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: "var(--bg-th)" }}>{["Tarih", "Kategori", "Faaliyet", "Katılımcı", "İlk Kez", "Y. İntisap"].map(h => <th key={h} className="text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>)}</tr></thead>
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
                  {(!sonFaal || !sonFaal.length) && <tr><td colSpan={6} className="px-3 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>Faaliyet kaydı bulunamadı.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
