"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClipboardList } from "lucide-react";
import { UNI_KATEGORILER } from "@/lib/universite-faaliyet";
import { LISE_KATEGORILER } from "@/lib/lise-faaliyet";

interface Faaliyet {
  id: string; tarih: string; yil: number; donem: string; kategori: string;
  faaliyetAdi: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number;
}

const DONEM_LABEL: Record<string, string> = { DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi" };

export function GenclikIlDashboard({ sistem, ilAd, bolgeAd, faaliyetler }: {
  sistem: "UNIVERSITE" | "LISE"; ilAd: string; bolgeAd: string; faaliyetler: Faaliyet[];
}) {
  const kategoriler = sistem === "UNIVERSITE" ? UNI_KATEGORILER : LISE_KATEGORILER;
  const renk = sistem === "UNIVERSITE" ? "#1D4ED8" : "#7C3AED";
  const faaliyetHref = sistem === "UNIVERSITE" ? "/panel/il/universite-faaliyet" : "/panel/il/lise-faaliyet";
  const sistemAd = sistem === "UNIVERSITE" ? "Üniversite Gençlik" : "Lise Gençlik";

  const yillar = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear(), ...faaliyetler.map(f => f.yil)]);
    return [...s].sort((a, b) => b - a);
  }, [faaliyetler]);
  const [yil, setYil] = useState(yillar[0]);

  const yilFaal = useMemo(() => faaliyetler.filter(f => f.yil === yil), [faaliyetler, yil]);

  const ozet = useMemo(() => {
    let katilimci = 0, ilkKez = 0, intisap = 0;
    const perKat: Record<string, { sayi: number; katilimci: number }> = {};
    const perDonem: Record<string, number> = {};
    for (const f of yilFaal) {
      katilimci += f.katilimci; ilkKez += f.ilkKezKatilan; intisap += f.yeniIntisap;
      const k = perKat[f.kategori] ?? { sayi: 0, katilimci: 0 };
      k.sayi++; k.katilimci += f.katilimci; perKat[f.kategori] = k;
      perDonem[f.donem] = (perDonem[f.donem] ?? 0) + 1;
    }
    return { toplam: yilFaal.length, katilimci, ilkKez, intisap, perKat, perDonem };
  }, [yilFaal]);

  const chartData = useMemo(() =>
    kategoriler.filter(k => ozet.perKat[k.key]?.sayi).map(k => ({ ad: k.label, kisa: k.label.split(" ")[0], sayi: ozet.perKat[k.key].sayi, renk: k.renk })),
    [kategoriler, ozet]);

  const sonFaaliyetler = useMemo(() =>
    [...yilFaal].sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 6), [yilFaal]);

  const kartlar = [
    { label: "Toplam Faaliyet", val: ozet.toplam, renk },
    { label: "Toplam Katılımcı", val: ozet.katilimci, renk: "#0369A1" },
    { label: "İlk Kez Katılan", val: ozet.ilkKez, renk: "#B45309" },
    { label: "Yeni İntisap", val: ozet.intisap, renk: "var(--accent)" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Ana Sayfa</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{ilAd} · {bolgeAd} — {sistemAd} faaliyet özeti ve analizi</p>
        </div>
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Yıl</span>
            <select value={yil} onChange={e => setYil(Number(e.target.value))}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {yillar.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <Link href={faaliyetHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white transition hover:opacity-90"
            style={{ background: renk, boxShadow: `0 4px 14px ${renk}50` }}>
            <ClipboardList size={16} /> Faaliyet Yönetimi
          </Link>
        </div>
      </div>

      {/* KPI kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kartlar.map(s => (
          <div key={s.label} className="sv-section p-4">
            <p className="text-3xl font-black" style={{ color: s.renk }}>{s.val.toLocaleString("tr-TR")}</p>
            <p className="text-xs font-semibold mt-0.5 text-muted">{s.label} ({yil})</p>
          </div>
        ))}
      </div>

      {ozet.toplam === 0 ? (
        <div className="sv-section p-12 text-center">
          <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>{yil} yılında henüz faaliyet yok</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Faaliyet Yönetimi ekranından kayıt ekledikçe analizler burada görünecek.</p>
          <Link href={faaliyetHref} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white" style={{ background: renk }}>
            <ClipboardList size={16} /> İlk Faaliyeti Ekle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kategori bazlı grafik */}
          <div className="sv-section lg:col-span-2">
            <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Kategoriye Göre Faaliyet Sayısı</h2></div>
            <div className="px-4 pb-5 pt-3">
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="kisa" width={90} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "var(--bg-hover)" }}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => [`${v} faaliyet`, "Sayı"]} />
                  <Bar dataKey="sayi" radius={[0, 6, 6, 0]} barSize={20}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.renk} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dönem dağılımı + kategori listesi */}
          <div className="space-y-4">
            <div className="sv-section">
              <div className="sv-section-header"><h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Dönem Dağılımı</h2></div>
              <div className="p-4 space-y-2">
                {["DONEM_1", "DONEM_2"].map(d => (
                  <div key={d} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "var(--bg-th)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{DONEM_LABEL[d]}</span>
                    <span className="text-lg font-black" style={{ color: renk }}>{ozet.perDonem[d] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Son faaliyetler */}
      {sonFaaliyetler.length > 0 && (
        <div className="sv-section">
          <div className="sv-section-header">
            <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Son Faaliyetler</h2>
            <Link href={faaliyetHref} className="text-xs font-bold hover:underline" style={{ color: renk }}>Tümü →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {sonFaaliyetler.map(f => {
              const kat = kategoriler.find(k => k.key === f.kategori);
              return (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap" style={{ background: (kat?.renk ?? renk) + "1a", color: kat?.renk ?? renk }}>{kat?.label ?? f.kategori}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{f.faaliyetAdi}</p>
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{f.katilimci} katılımcı</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{new Date(f.tarih).toLocaleDateString("tr-TR")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
