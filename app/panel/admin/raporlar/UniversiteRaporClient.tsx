"use client";

import { useMemo, useState } from "react";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { UNI_KATEGORILER, uniOzet } from "@/lib/universite-faaliyet";

interface Faaliyet { ilId: string; yil: number; donem: string; kategori: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number }
interface Bolge { id: string; no: number; ad: string; iller: { id: string; ad: string }[] }

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("tr-TR"));

const DONEMLER = [
  { v: "HEPSI",      l: "Tüm Dönemler" },
  { v: "DONEM_1",    l: "1. Dönem" },
  { v: "DONEM_2",    l: "2. Dönem" },
  { v: "YAZ_DONEMI", l: "Yaz Dönemi" },
];

const selectCls = "rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none";
const selectSty = { background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" } as const;

export function UniversiteRaporClient({ bolgeler, faaliyetler, yillar }: {
  bolgeler: Bolge[]; faaliyetler: Faaliyet[]; yillar: number[];
}) {
  const [yil, setYil]       = useState(yillar[0] ?? new Date().getFullYear());
  const [donem, setDonem]   = useState("HEPSI");
  const [bolgeId, setBolgeId] = useState("");

  const ilToBolge = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of bolgeler) for (const il of b.iller) m.set(il.id, b.id);
    return m;
  }, [bolgeler]);

  // Yıl + dönem + (seçiliyse) bölge filtresi
  const yilFaal = useMemo(() => faaliyetler.filter(f =>
    f.yil === yil &&
    (donem === "HEPSI" || f.donem === donem) &&
    (!bolgeId || ilToBolge.get(f.ilId) === bolgeId)
  ), [faaliyetler, yil, donem, bolgeId, ilToBolge]);

  const turkiye = useMemo(() => uniOzet(yilFaal), [yilFaal]);

  const gosterilenBolgeler = useMemo(
    () => (bolgeId ? bolgeler.filter(b => b.id === bolgeId) : bolgeler),
    [bolgeler, bolgeId],
  );

  const bolgeOzet = useMemo(() => {
    const grup = new Map<string, Faaliyet[]>();
    for (const f of yilFaal) {
      const bId = ilToBolge.get(f.ilId);
      if (!bId) continue;
      (grup.get(bId) ?? grup.set(bId, []).get(bId)!).push(f);
    }
    return gosterilenBolgeler.map(b => ({ bolge: b, ozet: uniOzet(grup.get(b.id) ?? []) }));
  }, [yilFaal, gosterilenBolgeler, ilToBolge]);

  const kartlar = [
    { label: "Toplam Faaliyet", val: turkiye.toplam, renk: "#1D4ED8" },
    { label: "Toplam Katılımcı", val: turkiye.toplamKatilimci, renk: "#0369A1" },
    { label: "İlk Kez Katılan", val: turkiye.toplamIlkKez, renk: "#B45309" },
    { label: "Yeni İntisap", val: turkiye.toplamIntisap, renk: "var(--accent)" },
  ];

  function exportSpec() {
    const cols = [
      { header: "Bölge", key: "bolge" },
      ...UNI_KATEGORILER.map(k => ({ header: k.label, key: k.key })),
      { header: "Toplam Faaliyet", key: "toplam" },
      { header: "Katılımcı", key: "katilimci" },
      { header: "İlk Kez", key: "ilkKez" },
      { header: "Yeni İntisap", key: "intisap" },
    ];
    const satir = (ad: string, o: ReturnType<typeof uniOzet>) => ({
      bolge: ad,
      ...Object.fromEntries(UNI_KATEGORILER.map(k => [k.key, o.perKat[k.key]?.sayi ?? 0])),
      toplam: o.toplam, katilimci: o.toplamKatilimci, ilkKez: o.toplamIlkKez, intisap: o.toplamIntisap,
    });
    const rows = [
      ...bolgeOzet.map(({ bolge, ozet }) => satir(`${bolge.no}. Bölge`, ozet)),
      ...(bolgeId ? [] : [satir("TÜRKİYE TOPLAMI", turkiye)]),
    ] as unknown as Record<string, string | number>[];
    const donemLbl = DONEMLER.find(d => d.v === donem)?.l ?? "Tüm Dönemler";
    const bolgeLbl = bolgeId ? `${bolgeler.find(b => b.id === bolgeId)?.no}. Bölge` : "Türkiye geneli";
    return {
      title: "Üniversite Gençlik Faaliyet Raporu",
      subtitle: `${bolgeLbl} • ${yil} • ${donemLbl}`,
      fileName: `universite-genclik-raporu-${yil}`,
      columns: cols, rows,
    };
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Raporlar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Üniversite Gençlik Sistemi · faaliyet-bazlı otomatik toplamlar</p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => setYil(Number(e.target.value))} className={selectCls} style={selectSty}>
              {(yillar.includes(yil) ? yillar : [yil, ...yillar]).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select value={donem} onChange={e => setDonem(e.target.value)} className={selectCls} style={selectSty}>
              {DONEMLER.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Bölge</span>
            <select value={bolgeId} onChange={e => setBolgeId(e.target.value)} className={selectCls} style={selectSty}>
              <option value="">Tüm Bölgeler</option>
              {bolgeler.map(b => <option key={b.id} value={b.id}>{b.no}. Bölge</option>)}
            </select>
          </label>
          <ExportButtons getSpec={exportSpec} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kartlar.map(c => (
          <div key={c.label} className="sv-section p-4">
            <p className="text-3xl font-black" style={{ color: c.renk }}>{c.val.toLocaleString("tr-TR")}</p>
            <p className="text-xs font-semibold mt-0.5 text-muted">{c.label} ({yil})</p>
          </div>
        ))}
      </div>

      <div className="sv-section overflow-x-auto">
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Kategori Bazlı Türkiye Özeti</h2>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-th)" }}>
            <tr>
              {["Kategori", "Faaliyet Sayısı", "Katılımcı", "İlk Kez", "Yeni İntisap"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UNI_KATEGORILER.map(k => {
              const o = turkiye.perKat[k.key];
              return (
                <tr key={k.key} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2.5 font-bold whitespace-nowrap" style={{ color: k.renk }}>{k.label}</td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: "var(--text-primary)" }}>{fmt(o.sayi)}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{fmt(o.katilimci)}</td>
                  <td className="px-4 py-2.5" style={{ color: "var(--text-secondary)" }}>{fmt(o.ilkKez)}</td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: "var(--accent)" }}>{fmt(o.yeniIntisap)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sv-section">
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Bölge Bazlı Faaliyet Sayıları</h2>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-th)" }}>
            <tr>
              {["Bölge", ...UNI_KATEGORILER.map(k => k.label), "Toplam", "Katılımcı", "İlk Kez", "Y. İntisap"].map((h, i) => (
                <th key={h} className={`px-2 py-2.5 text-[10px] font-bold uppercase tracking-wide leading-[1.25] align-bottom ${i === 0 ? "text-left sticky left-0 z-10 whitespace-nowrap" : "text-center"}`}
                  style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "var(--bg-th)", ...(i !== 0 ? { minWidth: 52 } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bolgeOzet.map(({ bolge, ozet }) => (
              <tr key={bolge.id} className="border-t group" style={{ borderColor: "var(--border)" }}>
                <td className="px-3 py-2.5 font-bold whitespace-nowrap sticky left-0 z-10" style={{ color: "var(--text-primary)", background: "var(--bg-card)" }}>{bolge.no}. Bölge</td>
                {UNI_KATEGORILER.map(k => <td key={k.key} className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.perKat[k.key]?.sayi ?? 0)}</td>)}
                <td className="px-3 py-2.5 text-center font-bold" style={{ color: "var(--text-primary)" }}>{fmt(ozet.toplam)}</td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.toplamKatilimci)}</td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.toplamIlkKez)}</td>
                <td className="px-3 py-2.5 text-center font-bold" style={{ color: "var(--accent)" }}>{fmt(ozet.toplamIntisap)}</td>
              </tr>
            ))}
            {!bolgeId && (
              <tr style={{ background: "rgba(29,78,216,0.08)" }}>
                <td className="px-3 py-3 font-black whitespace-nowrap sticky left-0 z-10" style={{ color: "#1D4ED8", background: "#DCE6FB" }}>🇹🇷 Türkiye</td>
                {UNI_KATEGORILER.map(k => <td key={k.key} className="px-3 py-3 text-center font-black" style={{ color: "#1D4ED8" }}>{fmt(turkiye.perKat[k.key]?.sayi ?? 0)}</td>)}
                <td className="px-3 py-3 text-center font-black" style={{ color: "#1D4ED8" }}>{fmt(turkiye.toplam)}</td>
                <td className="px-3 py-3 text-center font-black" style={{ color: "#1D4ED8" }}>{fmt(turkiye.toplamKatilimci)}</td>
                <td className="px-3 py-3 text-center font-black" style={{ color: "#1D4ED8" }}>{fmt(turkiye.toplamIlkKez)}</td>
                <td className="px-3 py-3 text-center font-black" style={{ color: "#1D4ED8" }}>{fmt(turkiye.toplamIntisap)}</td>
              </tr>
            )}
            {turkiye.toplam === 0 && (
              <tr><td colSpan={UNI_KATEGORILER.length + 5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Seçili filtre için henüz üniversite gençlik faaliyeti kaydı yok.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
