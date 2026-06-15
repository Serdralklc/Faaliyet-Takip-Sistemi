"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IL_BILGI } from "@/lib/turkiye-iller";

interface Birim {
  ilId: string; ad: string; kod: string | null;
  toplamFaaliyet: number; yeniIntisap: number; ilimSohbet: number; dergah: number; kafile: number; ziyaret: number;
}
interface IlAgg {
  ad: string;
  toplamFaaliyet: number; yeniIntisap: number; ilimSohbet: number; dergah: number; kafile: number; ziyaret: number;
}
interface HaritaVeri {
  yillar: number[];
  iller: Record<string, IlAgg>;
  bolgeler: { no: number; ad: string; birimler: Birim[] }[];
}

const METRIK = [
  { key: "bolge",         ad: "Bölge (renkli)" },
  { key: "toplamFaaliyet", ad: "Toplam Faaliyet" },
  { key: "yeniIntisap",   ad: "Yeni İntisap" },
  { key: "ilimSohbet",    ad: "İlim / Sohbet" },
  { key: "dergah",        ad: "Dergah Sayısı" },
  { key: "kafile",        ad: "Kafile" },
  { key: "ziyaret",       ad: "Ziyaret" },
  { key: "veriGiris",     ad: "Veri Giriş Durumu" },
] as const;
type MetrikKey = (typeof METRIK)[number]["key"];

const DONEM_OPT = [{ k: "DONEM_1", a: "1. Dönem" }, { k: "DONEM_2", a: "2. Dönem" }, { k: "YAZ_DONEMI", a: "Yaz" }];

function metrikDeger(il: IlAgg | undefined, m: MetrikKey): number {
  if (!il) return 0;
  switch (m) {
    case "toplamFaaliyet": return il.toplamFaaliyet;
    case "yeniIntisap":    return il.yeniIntisap;
    case "ilimSohbet":     return il.ilimSohbet;
    case "dergah":         return il.dergah;
    case "kafile":         return il.kafile;
    case "ziyaret":        return il.ziyaret;
    case "veriGiris":      return il.toplamFaaliyet > 0 ? 1 : 0;
    default:               return il.toplamFaaliyet;
  }
}
function birimMetrik(u: Birim, m: MetrikKey): number {
  switch (m) {
    case "toplamFaaliyet": return u.toplamFaaliyet;
    case "yeniIntisap":    return u.yeniIntisap;
    case "ilimSohbet":     return u.ilimSohbet;
    case "dergah":         return u.dergah;
    case "kafile":         return u.kafile;
    case "ziyaret":        return u.ziyaret;
    default:               return u.toplamFaaliyet;
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
  return `hsl(${Math.round(Math.max(0, Math.min(1, oran)) * 130)}, 70%, 50%)`;
}

export function EgitimBirimiHarita() {
  const [yil, setYil] = useState("");
  const [donem, setDonem] = useState("");
  const [metrik, setMetrik] = useState<MetrikKey>("bolge");
  const [hoverKod, setHoverKod] = useState<string | null>(null);
  const [seciliKod, setSeciliKod] = useState<string | null>(null);
  const [seciliBirim, setSeciliBirim] = useState<Birim | null>(null);
  const [seciliBolge, setSeciliBolge] = useState<number | null>(null);
  const [cokBolgeKod, setCokBolgeKod] = useState<string | null>(null);

  const birimSec = (u: Birim) => { setSeciliKod(null); setCokBolgeKod(null); setSeciliBirim(b => b?.ilId === u.ilId ? null : u); };
  const temizle = () => { setSeciliBolge(null); setSeciliKod(null); setSeciliBirim(null); setCokBolgeKod(null); };

  const { data: paths } = useQuery({
    queryKey: ["tr-paths"],
    queryFn: async (): Promise<Record<string, string>> => { const r = await fetch("/turkiye-iller.json"); if (!r.ok) throw new Error(); return r.json(); },
    staleTime: Infinity,
  });
  const { data } = useQuery({
    queryKey: ["egitim-harita", yil, donem],
    queryFn: async (): Promise<HaritaVeri> => {
      const q = new URLSearchParams();
      if (yil) q.set("yil", yil); if (donem) q.set("donem", donem);
      const r = await fetch(`/api/egitim-harita?${q.toString()}`); if (!r.ok) throw new Error(); return r.json();
    },
    staleTime: 60_000,
  });

  const iller = useMemo(() => data?.iller ?? {}, [data]);
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
  const kodBolgeListesi = useMemo(() => {
    const m: Record<string, number[]> = {};
    for (const [no, s] of bolgeKodlari) for (const k of s) { if (!m[k]) m[k] = []; m[k].push(no); }
    return m;
  }, [bolgeKodlari]);
  const bolgeYollari = useMemo(() => {
    const m = new Map<number, string>();
    if (!paths) return m;
    for (const kod in kodBolge) { const d = paths[kod]; if (!d) continue; const no = kodBolge[kod]; m.set(no, (m.get(no) ?? "") + " " + d); }
    return m;
  }, [paths, kodBolge]);
  const centroids = useMemo(() => {
    const m: Record<string, { x: number; y: number }> = {};
    if (paths) for (const k in paths) { const { xs, ys } = pathXY(paths[k]); m[k] = { x: ort(xs), y: ort(ys) }; }
    return m;
  }, [paths]);
  const tumBBox = useMemo(() => {
    if (!paths) return "0 0 1024 800";
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const k in paths) { const { xs, ys } = pathXY(paths[k]); for (const x of xs) { if (x < minX) minX = x; if (x > maxX) maxX = x; } for (const y of ys) { if (y < minY) minY = y; if (y > maxY) maxY = y; } }
    if (!isFinite(minX)) return "0 0 1024 800";
    return `${minX - 8} ${minY - 8} ${maxX - minX + 16} ${maxY - minY + 16}`;
  }, [paths]);
  const viewBox = useMemo(() => {
    if (seciliBolge == null || !paths) return tumBBox;
    const kodlar = bolgeKodlari.get(seciliBolge); if (!kodlar?.size) return tumBBox;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const k of kodlar) { const d = paths[k]; if (!d) continue; const { xs, ys } = pathXY(d); minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs); minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys); }
    if (!isFinite(minX)) return tumBBox;
    const pad = Math.max(maxX - minX, maxY - minY) * 0.12 + 15;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [seciliBolge, bolgeKodlari, paths, tumBBox]);

  function haritaIlSec(kod: string) {
    setSeciliBirim(null);
    const bolgeler = kodBolgeListesi[kod] ?? [];
    if (bolgeler.length > 1) { setCokBolgeKod(prev => prev === kod ? null : kod); setSeciliKod(null); return; }
    setCokBolgeKod(null); setSeciliKod(k => k === kod ? null : kod);
  }
  function ilFill(kod: string): string {
    const il = iller[kod];
    if (metrik === "bolge") { const no = kodBolge[kod]; return no ? bolgeRenk(no) : "var(--bg-th)"; }
    if (metrik === "veriGiris") return (il?.toplamFaaliyet ?? 0) > 0 ? "hsl(140,65%,45%)" : "hsl(0,70%,55%)";
    return isiRenk(metrikDeger(il, metrik) / maxDeger);
  }
  function gorunur(kod: string): boolean { return seciliBolge == null || (bolgeKodlari.get(seciliBolge)?.has(kod) ?? false); }

  const aktifKod = seciliKod ?? hoverKod ?? cokBolgeKod;
  const seciliBolgeObj = seciliBolge != null ? data?.bolgeler.find(b => b.no === seciliBolge) : undefined;

  const bolgeAgg: (IlAgg & { ad: string }) | undefined = useMemo(() => {
    if (!seciliBolgeObj) return undefined;
    const birimler = seciliBolgeObj.birimler;
    if (!birimler.length) return undefined;
    let toplamFaaliyet = 0, yeniIntisap = 0, ilimSohbet = 0, dergah = 0, kafile = 0, ziyaret = 0;
    for (const u of birimler) { toplamFaaliyet += u.toplamFaaliyet; yeniIntisap += u.yeniIntisap; ilimSohbet += u.ilimSohbet; dergah += u.dergah; kafile += u.kafile; ziyaret += u.ziyaret; }
    return { ad: `${seciliBolgeObj.no}. Bölge · ${seciliBolgeObj.ad}`, toplamFaaliyet, yeniIntisap, ilimSohbet, dergah, kafile, ziyaret };
  }, [seciliBolgeObj]);

  const detay = seciliBolge != null ? bolgeAgg : (seciliBirim ?? (seciliKod ? iller[seciliKod] : undefined));

  const cokBolgeListe = useMemo(() => {
    if (!cokBolgeKod || !data) return [];
    return (kodBolgeListesi[cokBolgeKod] ?? []).map(no => data.bolgeler.find(b => b.no === no)).filter(Boolean) as typeof data.bolgeler;
  }, [cokBolgeKod, kodBolgeListesi, data]);

  const birimListe = seciliBolgeObj
    ? [...seciliBolgeObj.birimler].sort((a, b) => birimMetrik(b, metrik) - birimMetrik(a, metrik))
    : [];
  const tabloIller = useMemo(() => {
    const arr = Object.entries(iller).map(([kod, il]) => ({ kod, deger: metrik === "bolge" ? il.toplamFaaliyet : metrikDeger(il, metrik) }));
    if (seciliBolge != null) { const s = bolgeKodlari.get(seciliBolge); return arr.filter(x => s?.has(x.kod)).sort((a, b) => b.deger - a.deger); }
    return arr.sort((a, b) => b.deger - a.deger);
  }, [iller, metrik, seciliBolge, bolgeKodlari]);

  const selS = { borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" } as const;
  const chip = (a: boolean) => a ? { background: "var(--accent-solid)", color: "#fff", borderColor: "var(--accent-solid)" } : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" };
  const etiketDeger = (il: IlAgg | undefined) => (metrik === "bolge" || metrik === "veriGiris") ? "" : String(metrikDeger(il, metrik));

  const STAT_LABELS: { key: keyof IlAgg; label: string }[] = [
    { key: "toplamFaaliyet", label: "Toplam Faaliyet" },
    { key: "yeniIntisap",    label: "Yeni İntisap" },
    { key: "ilimSohbet",     label: "İlim / Sohbet" },
    { key: "dergah",         label: "Dergah" },
    { key: "kafile",         label: "Kafile" },
    { key: "ziyaret",        label: "Ziyaret" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      {/* Yan filtreler */}
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
            <select value={seciliBolge ?? ""} onChange={e => { setSeciliBolge(e.target.value ? Number(e.target.value) : null); setSeciliKod(null); setSeciliBirim(null); setCokBolgeKod(null); }} className="w-full rounded-lg border px-3 py-1.5 text-sm font-semibold" style={selS}>
              <option value="">Türkiye Geneli</option>{(data?.bolgeler ?? []).map(b => <option key={b.no} value={b.no}>{b.no}. Bölge — {b.ad}</option>)}
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
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{seciliBolgeObj ? `Birimler · ${seciliBolgeObj.no}. Bölge` : "İller (sıralı)"}</p>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {seciliBolgeObj ? birimListe.map(u => (
              <button key={u.ilId} onClick={() => birimSec(u)} className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-th transition"
                style={seciliBirim?.ilId === u.ilId ? { background: "var(--bg-active)" } : undefined}>
                <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.ad}</span>
                <span className="text-[12px] font-bold tabular-nums ml-2 shrink-0" style={{ color: "#0B6B3A" }}>{birimMetrik(u, metrik)}</span>
              </button>
            )) : tabloIller.slice(0, 81).map(({ kod, deger }) => (
              <button key={kod} onClick={() => { setSeciliBirim(null); setSeciliKod(k => k === kod ? null : kod); setCokBolgeKod(null); }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-th transition"
                style={seciliKod === kod ? { background: "var(--bg-active)" } : undefined}>
                <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{IL_BILGI[kod]?.ad ?? kod}</span>
                <span className="text-[12px] font-bold tabular-nums ml-2 shrink-0" style={{ color: "#0B6B3A" }}>{deger}</span>
              </button>
            ))}
            {seciliBolgeObj && !birimListe.length && <p className="px-3 py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Birim yok.</p>}
            {!seciliBolgeObj && !tabloIller.length && <p className="px-3 py-6 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>Veri yok.</p>}
          </div>
        </div>
      </div>

      {/* Harita + detay */}
      <div className="space-y-4">
        <div className="sv-section p-3 overflow-hidden">
          {(seciliBolge != null || detay || cokBolgeKod) && (
            <button onClick={temizle} className="text-[12px] font-bold underline mb-1" style={{ color: "var(--text-muted)" }}>← Türkiye geneline dön</button>
          )}
          {!paths || !data ? (
            <p className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>Harita yükleniyor…</p>
          ) : (
            <svg viewBox={viewBox} className="w-full h-auto" style={{ maxHeight: "78vh", transition: "all 0.4s ease" }} role="img" aria-label="Eğitim Birimi Türkiye haritası">
              <defs>
                {[...bolgeYollari].map(([no, d]) => (
                  <mask key={`m-${no}`} id={`egitimmask-${no}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="800">
                    <rect x="0" y="0" width="1024" height="800" fill="white" />
                    <path d={d} fill="black" />
                  </mask>
                ))}
              </defs>
              {Object.entries(paths).map(([kod, d]) => {
                const g = gorunur(kod);
                const aktif = kod === aktifKod;
                const cokBolge = (kodBolgeListesi[kod]?.length ?? 0) > 1;
                return (
                  <path key={kod} d={d} fill={g ? ilFill(kod) : "var(--bg-th)"} fillOpacity={g ? 1 : 0.15}
                    stroke={aktif ? "#0f172a" : cokBolge ? "#059669" : "#ffffff"}
                    strokeWidth={aktif ? 2 : cokBolge ? 1.2 : 0.6}
                    style={{ cursor: "pointer", transition: "fill 0.2s" }}
                    onMouseEnter={() => setHoverKod(kod)} onMouseLeave={() => setHoverKod(null)}
                    onClick={() => haritaIlSec(kod)}>
                    <title>{IL_BILGI[kod]?.ad ?? kod}: {iller[kod]?.toplamFaaliyet ?? 0} faaliyet</title>
                  </path>
                );
              })}
              {[...bolgeYollari].map(([no, d]) => {
                if (seciliBolge != null && seciliBolge !== no) return null;
                return (
                  <path key={`b-${no}`} d={d} fill="none" stroke="#0b1324"
                    strokeWidth={seciliBolge != null ? 2.4 : 3.4} strokeOpacity={0.92}
                    strokeLinejoin="round" strokeLinecap="round" mask={`url(#egitimmask-${no})`} pointerEvents="none" />
                );
              })}
              {Object.keys(paths).map(kod => {
                if (!gorunur(kod)) return null;
                const il = iller[kod]; const c = centroids[kod]; if (!c) return null;
                const deg = etiketDeger(il);
                const fs = seciliBolge != null ? 7 : 6.5;
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

        {/* Çok-bölge seçici */}
        {cokBolgeKod && cokBolgeListe.length > 0 && (
          <div className="sv-section p-4">
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              {IL_BILGI[cokBolgeKod]?.ad ?? cokBolgeKod} — {cokBolgeListe.length} bölge. Bir bölge seçin:
            </p>
            <div className="flex flex-wrap gap-2">
              {cokBolgeListe.map(b => {
                const t = b.birimler.reduce((s, u) => s + u.toplamFaaliyet, 0);
                return (
                  <button key={b.no} onClick={() => { setSeciliBolge(bn => bn === b.no ? null : b.no); setCokBolgeKod(null); setSeciliKod(null); setSeciliBirim(null); }}
                    className="flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all hover:border-green-500"
                    style={{ background: "var(--bg-th)", borderColor: "var(--border)", minWidth: 130 }}>
                    <span className="text-[13px] font-black" style={{ color: "var(--text-primary)" }}>{b.no}. Bölge</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{b.ad}</span>
                    <span className="text-[12px] font-bold mt-1" style={{ color: "#0B6B3A" }}>{t} faaliyet</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detay özeti */}
        {detay && (
          <div className="sv-section p-4">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <p className="text-[18px] font-black" style={{ color: "var(--text-primary)" }}>{detay.ad}</p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Eğitim Birimi faaliyet özeti</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
              {STAT_LABELS.map(({ key, label }) => (
                <div key={key} className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-th)" }}>
                  <p className="text-[20px] font-black" style={{ color: "var(--text-primary)" }}>{(detay[key] as number).toLocaleString("tr-TR")}</p>
                  <p className="text-[10.5px]" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!detay && !cokBolgeKod && seciliBolgeObj && (
          <div className="sv-section p-4">
            <p className="text-[16px] font-black" style={{ color: "var(--text-primary)" }}>{seciliBolgeObj.no}. Bölge <span className="text-[13px] font-semibold" style={{ color: "var(--text-muted)" }}>· {seciliBolgeObj.ad}</span></p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Soldaki <b>Birimler</b> listesinden bir il seçin → ayrıntılar burada görünür.</p>
          </div>
        )}
      </div>
    </div>
  );
}
