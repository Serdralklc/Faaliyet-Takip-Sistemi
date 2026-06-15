"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { ClipboardList, ArrowRight } from "lucide-react";
import { UNI_KATEGORILER } from "@/lib/universite-faaliyet";
import { LISE_KATEGORILER } from "@/lib/lise-faaliyet";
import type { BolgeFaaliyet } from "@/lib/genclik-veri";

const DONEM_LABEL: Record<string, string> = { DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi" };

export function GenclikBolgeDashboard({
  sistem, baslik, altBaslik, faaliyetler, faaliyetHref, raporMod = false,
}: {
  sistem: "UNIVERSITE" | "LISE";
  baslik: string;
  altBaslik: string;
  faaliyetler: BolgeFaaliyet[];
  faaliyetHref?: string;
  raporMod?: boolean;
}) {
  const kategoriler = sistem === "UNIVERSITE" ? UNI_KATEGORILER : LISE_KATEGORILER;
  const renk = sistem === "UNIVERSITE" ? "#1D4ED8" : "#7C3AED";

  const yillar = useMemo(() => {
    const s = new Set<number>([new Date().getFullYear(), ...faaliyetler.map(f => f.yil)]);
    return [...s].sort((a, b) => b - a);
  }, [faaliyetler]);

  const [yil, setYil] = useState(yillar[0]);
  const [donem, setDonem] = useState<string>("HEPSI");
  const [kategoriFiltre, setKategoriFiltre] = useState<string>("HEPSI");

  const filt = useMemo(() =>
    faaliyetler.filter(f =>
      f.yil === yil &&
      (donem === "HEPSI" || f.donem === donem) &&
      (kategoriFiltre === "HEPSI" || f.kategori === kategoriFiltre)
    ), [faaliyetler, yil, donem, kategoriFiltre]);

  const ozet = useMemo(() => {
    let katilimci = 0, ilkKez = 0, intisap = 0;
    for (const f of filt) { katilimci += f.katilimci; ilkKez += f.ilkKezKatilan; intisap += f.yeniIntisap; }
    return { toplam: filt.length, katilimci, ilkKez, intisap };
  }, [filt]);

  // İl bazlı faaliyet sayısı
  const ilFaaliyetData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of filt) m[f.il] = (m[f.il] ?? 0) + 1;
    return Object.entries(m).map(([il, sayi]) => ({ il, sayi })).sort((a, b) => b.sayi - a.sayi);
  }, [filt]);

  // İl bazlı katılımcı sayısı
  const ilKatilimciData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of filt) m[f.il] = (m[f.il] ?? 0) + f.katilimci;
    return Object.entries(m).map(([il, katilimci]) => ({ il, katilimci })).sort((a, b) => b.katilimci - a.katilimci);
  }, [filt]);

  // İl bazlı intisap sıralaması
  const ilIntisapData = useMemo(() => {
    const m: Record<string, { intisap: number; ilkKez: number }> = {};
    for (const f of filt) {
      if (!m[f.il]) m[f.il] = { intisap: 0, ilkKez: 0 };
      m[f.il].intisap += f.yeniIntisap;
      m[f.il].ilkKez += f.ilkKezKatilan;
    }
    return Object.entries(m)
      .map(([il, v]) => ({ il, ...v }))
      .sort((a, b) => b.intisap - a.intisap)
      .filter(x => x.intisap > 0 || x.ilkKez > 0);
  }, [filt]);

  // Kategori dağılımı
  const katData = useMemo(() => {
    const m: Record<string, { sayi: number; katilimci: number }> = {};
    for (const f of filt) {
      if (!m[f.kategori]) m[f.kategori] = { sayi: 0, katilimci: 0 };
      m[f.kategori].sayi++;
      m[f.kategori].katilimci += f.katilimci;
    }
    return kategoriler
      .filter(k => m[k.key])
      .map(k => ({
        ad: k.label,
        kisa: k.label.split(" ")[0],
        sayi: m[k.key].sayi,
        katilimci: m[k.key].katilimci,
        ort: m[k.key].sayi ? Math.round(m[k.key].katilimci / m[k.key].sayi) : 0,
        renk: k.renk,
      }));
  }, [filt, kategoriler]);

  // Dönem karşılaştırması
  const donemData = useMemo(() => {
    const ds = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
    return ds.map(d => ({
      donem: DONEM_LABEL[d],
      faaliyet: faaliyetler.filter(f => f.yil === yil && f.donem === d).length,
      katilimci: faaliyetler.filter(f => f.yil === yil && f.donem === d).reduce((s, f) => s + f.katilimci, 0),
    })).filter(x => x.faaliyet);
  }, [faaliyetler, yil]);

  // Radar: kategori başına ortalama katılımcı (normalize)
  const radarData = useMemo(() => {
    const vals = katData.map(k => k.ort);
    const maks = Math.max(...vals, 1);
    return katData.map(k => ({ birim: k.kisa, deger: Math.round((k.ort / maks) * 100) }));
  }, [katData]);

  // Yıllık trend (raporMod)
  const yillikTrend = useMemo(() => {
    if (!raporMod) return [];
    return yillar.slice().reverse().map(y => ({
      yil: String(y),
      faaliyet: faaliyetler.filter(f => f.yil === y).length,
      katilimci: faaliyetler.filter(f => f.yil === y).reduce((s, f) => s + f.katilimci, 0),
      intisap: faaliyetler.filter(f => f.yil === y).reduce((s, f) => s + f.yeniIntisap, 0),
    }));
  }, [faaliyetler, yillar, raporMod]);

  // İl × Kategori matrisi (raporMod)
  const ilKatMatris = useMemo(() => {
    if (!raporMod) return { iller: [] as string[], katlar: [] as string[], matris: {} as Record<string, Record<string, number>> };
    const iller = [...new Set(filt.map(f => f.il))].sort();
    const katlar = kategoriler.filter(k => filt.some(f => f.kategori === k.key)).map(k => k.key);
    const matris: Record<string, Record<string, number>> = {};
    for (const il of iller) {
      matris[il] = {};
      for (const k of katlar) {
        matris[il][k] = filt.filter(f => f.il === il && f.kategori === k).length;
      }
    }
    return { iller, katlar, matris };
  }, [filt, kategoriler, raporMod]);

  // Son faaliyetler (raporMod)
  const sonFaaliyetler = useMemo(() => {
    if (!raporMod) return [];
    return [...filt].sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 15);
  }, [filt, raporMod]);

  const yilSecenekleri = yillar.includes(yil) ? yillar : [yil, ...yillar];
  const cokIl = ilFaaliyetData.length > 1;

  const kartlar = [
    { label: "Toplam Faaliyet",  val: ozet.toplam,    renk },
    { label: "Toplam Katılımcı", val: ozet.katilimci, renk: "#0369A1" },
    { label: "İlk Kez Katılan",  val: ozet.ilkKez,   renk: "#B45309" },
    { label: "Yeni İntisap",     val: ozet.intisap,   renk: "var(--accent)" },
  ];

  const katLabel = (key: string) => kategoriler.find(k => k.key === key)?.label ?? key;
  const katRenk  = (key: string) => kategoriler.find(k => k.key === key)?.renk ?? renk;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Başlık + filtreler */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{baslik}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{altBaslik}</p>
        </div>
        <div className="flex items-end gap-2.5 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => setYil(Number(e.target.value))}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select value={donem} onChange={e => setDonem(e.target.value)}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              <option value="HEPSI">Tüm Dönemler</option>
              {Object.keys(DONEM_LABEL).map(d => <option key={d} value={d}>{DONEM_LABEL[d]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Faaliyet Türü</span>
            <select value={kategoriFiltre} onChange={e => setKategoriFiltre(e.target.value)}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              <option value="HEPSI">Tümü</option>
              {kategoriler.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
            </select>
          </label>
          {faaliyetHref && (
            <Link href={faaliyetHref}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold text-white transition hover:opacity-90"
              style={{ background: renk }}>
              <ClipboardList size={15} /> Faaliyet Takip Sistemi <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* KPI kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kartlar.map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{c.label}</p>
            <p className="text-3xl font-black mt-1" style={{ color: c.renk }}>{c.val.toLocaleString("tr-TR")}</p>
          </div>
        ))}
      </div>

      {/* İl bazlı faaliyet sayısı */}
      {cokIl && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            İl Bazlı Faaliyet Sayısı — {yil}{donem !== "HEPSI" ? ` / ${DONEM_LABEL[donem]}` : ""}
          </h2>
          <div style={{ width: "100%", height: Math.max(220, ilFaaliyetData.length * 34) }}>
            <ResponsiveContainer>
              <BarChart data={ilFaaliyetData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                <YAxis type="category" dataKey="il" width={110} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), "Faaliyet"]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="sayi" fill={renk} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Kategori dağılımı + Dönem dağılımı — her zaman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Faaliyet Türü Dağılımı</h2>
          {katData.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>Bu filtrede veri yok.</p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={katData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="kisa" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-25} textAnchor="end" height={56} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                  <Tooltip formatter={(v, _n, p) => [Number(v ?? 0).toLocaleString("tr-TR"), (p?.payload?.ad as string) ?? "Faaliyet"]}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="sayi" radius={[4, 4, 0, 0]}>
                    {katData.map((d, i) => <Cell key={i} fill={d.renk} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Dönem Dağılımı</h2>
          {donemData.length === 0 ? (
            <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>Bu yıl için veri yok.</p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={donemData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="donem" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="faaliyet" name="Faaliyet" fill={renk} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── SADECE RAPOR MODU ── */}
      {raporMod && (
        <>
          {/* İl bazlı katılımcı + İntisap */}
          {cokIl && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>İl Bazlı Toplam Katılımcı</h2>
                <div style={{ width: "100%", height: Math.max(200, ilKatilimciData.length * 34) }}>
                  <ResponsiveContainer>
                    <BarChart data={ilKatilimciData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <YAxis type="category" dataKey="il" width={100} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), "Katılımcı"]}
                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="katilimci" fill="#0369A1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>İl Bazlı İntisap & İlk Kez Katılan</h2>
                {ilIntisapData.length === 0 ? (
                  <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>Bu filtrede veri yok.</p>
                ) : (
                  <div style={{ width: "100%", height: Math.max(200, ilIntisapData.length * 34) }}>
                    <ResponsiveContainer>
                      <BarChart data={ilIntisapData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                        <YAxis type="category" dataKey="il" width={100} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                        <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="intisap" name="Yeni İntisap" fill="var(--accent)" radius={[0, 3, 3, 0]} />
                        <Bar dataKey="ilkKez" name="İlk Kez Katılan" fill="#B45309" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dönem karşılaştırması (faaliyet + katılımcı) + Ortalama katılımcı */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Dönem Karşılaştırması — {yil}</h2>
              {donemData.length === 0 ? (
                <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>Bu yıl için veri yok.</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={donemData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="donem" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="faaliyet" name="Faaliyet" fill={renk} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="katilimci" name="Katılımcı" fill="#0369A1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Türe Göre Ortalama Katılımcı</h2>
              <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>Her faaliyet türü için katılımcı / faaliyet oranı</p>
              {katData.length === 0 ? (
                <p className="text-sm py-10 text-center" style={{ color: "var(--text-muted)" }}>Bu filtrede veri yok.</p>
              ) : (
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={katData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="kisa" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-25} textAnchor="end" height={56} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <Tooltip formatter={(v, _n, p) => [`${Number(v ?? 0).toLocaleString("tr-TR")} kişi`, (p?.payload?.ad as string) ?? "Ort. Katılımcı"]}
                        contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="ort" radius={[4, 4, 0, 0]}>
                        {katData.map((d, i) => <Cell key={i} fill={d.renk} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Radar */}
          {radarData.length >= 3 && (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Faaliyet Türü Yoğunluk Haritası</h2>
              <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>Ortalama katılımcıya göre türlerin göreli yoğunluğu (%)</p>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="birim" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                    <Radar name="Yoğunluk" dataKey="deger" stroke={renk} fill={renk} fillOpacity={0.3} />
                    <Tooltip formatter={(v) => [`%${v}`, "Yoğunluk"]}
                      contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Yıllık Trend */}
          {yillikTrend.length > 1 && (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Yıllık Trend — Faaliyet / Katılımcı / İntisap</h2>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={yillikTrend} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="yil" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="faaliyet" name="Faaliyet" stroke={renk} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="katilimci" name="Katılımcı" stroke="#0369A1" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="intisap" name="İntisap" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* İl × Kategori Matrisi */}
          {ilKatMatris.iller.length > 0 && (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>İl × Faaliyet Türü Matrisi</h2>
              <div className="overflow-x-auto">
                <table className="text-[11px] w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      <th className="text-left py-2 pr-3 font-semibold" style={{ color: "var(--text-muted)" }}>İl</th>
                      {ilKatMatris.katlar.map(k => (
                        <th key={k} className="py-2 px-2 text-center font-semibold whitespace-nowrap" style={{ color: katRenk(k) }}>
                          {katLabel(k).split(" ")[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ilKatMatris.iller.map(il => (
                      <tr key={il} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="py-2 pr-3 font-semibold" style={{ color: "var(--text-primary)" }}>{il}</td>
                        {ilKatMatris.katlar.map(k => {
                          const val = ilKatMatris.matris[il][k] ?? 0;
                          return (
                            <td key={k} className="py-2 px-2 text-center font-bold" style={{ color: val > 0 ? katRenk(k) : "var(--text-muted)" }}>
                              {val > 0 ? val : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Son Faaliyetler Listesi */}
          {sonFaaliyetler.length > 0 && (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Son Faaliyetler</h2>
              <div className="overflow-x-auto">
                <table className="text-[12px] w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      {["Tarih", "İl", "Faaliyet", "Tür", "Katılımcı", "İlk Kez", "İntisap"].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sonFaaliyetler.map(f => (
                      <tr key={f.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                          {new Date(f.tarih).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-2 pr-4 font-semibold" style={{ color: "var(--text-primary)" }}>{f.il}</td>
                        <td className="py-2 pr-4 max-w-[160px] truncate" style={{ color: "var(--text-primary)" }} title={f.faaliyetAdi}>{f.faaliyetAdi}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: katRenk(f.kategori) }}>
                            {katLabel(f.kategori).split(" ")[0]}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-bold" style={{ color: "#0369A1" }}>{f.katilimci}</td>
                        <td className="py-2 pr-4" style={{ color: "#B45309" }}>{f.ilkKezKatilan || "—"}</td>
                        <td className="py-2 pr-4 font-bold" style={{ color: "var(--accent)" }}>{f.yeniIntisap || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {filt.length === 0 && (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-muted)" }}>Seçilen filtrelerde faaliyet verisi bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
