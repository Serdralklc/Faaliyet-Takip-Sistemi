"use client";

import { useMemo, useState } from "react";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { LISE_KATEGORILER, liseOzet } from "@/lib/lise-faaliyet";

interface Faaliyet { ilId: string; yil: number; kategori: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number }
interface Bolge { id: string; no: number; ad: string; iller: { id: string; ad: string }[] }

const fmt = (v: number) => (v === 0 ? "—" : v.toLocaleString("tr-TR"));

export function LiseRaporClient({ bolgeler, faaliyetler, yillar }: {
  bolgeler: Bolge[]; faaliyetler: Faaliyet[]; yillar: number[];
}) {
  const [yil, setYil] = useState(yillar[0] ?? new Date().getFullYear());

  const ilToBolge = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of bolgeler) for (const il of b.iller) m.set(il.id, b.id);
    return m;
  }, [bolgeler]);

  const yilFaal = useMemo(() => faaliyetler.filter(f => f.yil === yil), [faaliyetler, yil]);

  const turkiye = useMemo(() => liseOzet(yilFaal), [yilFaal]);

  // Bölge bazlı özet
  const bolgeOzet = useMemo(() => {
    const grup = new Map<string, Faaliyet[]>();
    for (const f of yilFaal) {
      const bId = ilToBolge.get(f.ilId);
      if (!bId) continue;
      (grup.get(bId) ?? grup.set(bId, []).get(bId)!).push(f);
    }
    return bolgeler.map(b => ({ bolge: b, ozet: liseOzet(grup.get(b.id) ?? []) }));
  }, [yilFaal, bolgeler, ilToBolge]);

  const kartlar = [
    { label: "Toplam Faaliyet", val: turkiye.toplam, renk: "#0B6B3A" },
    { label: "Toplam Katılımcı", val: turkiye.toplamKatilimci, renk: "#0369A1" },
    { label: "İlk Kez Katılan", val: turkiye.toplamIlkKez, renk: "#B45309" },
    { label: "Yeni İntisap", val: turkiye.toplamIntisap, renk: "var(--accent)" },
  ];

  function exportSpec() {
    const cols = [
      { header: "Bölge", key: "bolge" },
      ...LISE_KATEGORILER.map(k => ({ header: k.label, key: k.key })),
      { header: "Toplam Faaliyet", key: "toplam" },
      { header: "Katılımcı", key: "katilimci" },
      { header: "İlk Kez", key: "ilkKez" },
      { header: "Yeni İntisap", key: "intisap" },
    ];
    const satir = (ad: string, o: ReturnType<typeof liseOzet>) => ({
      bolge: ad,
      ...Object.fromEntries(LISE_KATEGORILER.map(k => [k.key, o.perKat[k.key]?.sayi ?? 0])),
      toplam: o.toplam, katilimci: o.toplamKatilimci, ilkKez: o.toplamIlkKez, intisap: o.toplamIntisap,
    });
    const rows = [
      ...bolgeOzet.map(({ bolge, ozet }) => satir(`${bolge.no}. Bölge`, ozet)),
      satir("TÜRKİYE TOPLAMI", turkiye),
    ] as unknown as Record<string, string | number>[];
    return {
      title: "Lise Gençlik Faaliyet Raporu",
      subtitle: `Türkiye geneli • ${yil}`,
      fileName: `lise-genclik-raporu-${yil}`,
      columns: cols, rows,
    };
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Raporlar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Lise Gençlik Sistemi · faaliyet-bazlı otomatik toplamlar</p>
        </div>
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => setYil(Number(e.target.value))}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {(yillar.includes(yil) ? yillar : [yil, ...yillar]).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <ExportButtons getSpec={exportSpec} />
        </div>
      </div>

      {/* Türkiye toplam kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kartlar.map(c => (
          <div key={c.label} className="sv-section p-4">
            <p className="text-3xl font-black" style={{ color: c.renk }}>{c.val.toLocaleString("tr-TR")}</p>
            <p className="text-xs font-semibold mt-0.5 text-muted">{c.label} ({yil})</p>
          </div>
        ))}
      </div>

      {/* Kategori bazlı Türkiye özeti */}
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
            {LISE_KATEGORILER.map(k => {
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

      {/* Bölge bazlı tablo */}
      <div className="sv-section overflow-x-auto">
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Bölge Bazlı Faaliyet Sayıları</h2>
        </div>
        <table className="w-full text-sm">
          <thead style={{ background: "var(--bg-th)" }}>
            <tr>
              {["Bölge", ...LISE_KATEGORILER.map(k => k.label), "Toplam", "Katılımcı", "İlk Kez", "Y. İntisap"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[10.5px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bolgeOzet.map(({ bolge, ozet }) => (
              <tr key={bolge.id} className="border-t hover:bg-[color:var(--bg-hover)] transition" style={{ borderColor: "var(--border)" }}>
                <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{bolge.no}. Bölge</td>
                {LISE_KATEGORILER.map(k => <td key={k.key} className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.perKat[k.key]?.sayi ?? 0)}</td>)}
                <td className="px-3 py-2.5 text-center font-bold" style={{ color: "var(--text-primary)" }}>{fmt(ozet.toplam)}</td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.toplamKatilimci)}</td>
                <td className="px-3 py-2.5 text-center" style={{ color: "var(--text-secondary)" }}>{fmt(ozet.toplamIlkKez)}</td>
                <td className="px-3 py-2.5 text-center font-bold" style={{ color: "var(--accent)" }}>{fmt(ozet.toplamIntisap)}</td>
              </tr>
            ))}
            {/* Türkiye toplam */}
            <tr style={{ background: "rgba(11,107,58,0.08)" }}>
              <td className="px-3 py-3 font-black whitespace-nowrap" style={{ color: "#0B6B3A" }}>🇹🇷 Türkiye</td>
              {LISE_KATEGORILER.map(k => <td key={k.key} className="px-3 py-3 text-center font-black" style={{ color: "#0B6B3A" }}>{fmt(turkiye.perKat[k.key]?.sayi ?? 0)}</td>)}
              <td className="px-3 py-3 text-center font-black" style={{ color: "#0B6B3A" }}>{fmt(turkiye.toplam)}</td>
              <td className="px-3 py-3 text-center font-black" style={{ color: "#0B6B3A" }}>{fmt(turkiye.toplamKatilimci)}</td>
              <td className="px-3 py-3 text-center font-black" style={{ color: "#0B6B3A" }}>{fmt(turkiye.toplamIlkKez)}</td>
              <td className="px-3 py-3 text-center font-black" style={{ color: "#0B6B3A" }}>{fmt(turkiye.toplamIntisap)}</td>
            </tr>
            {turkiye.toplam === 0 && (
              <tr><td colSpan={LISE_KATEGORILER.length + 5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>{yil} yılı için henüz lise gençlik faaliyeti kaydı yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
