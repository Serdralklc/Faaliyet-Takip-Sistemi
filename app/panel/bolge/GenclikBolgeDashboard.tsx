"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClipboardList, ArrowRight } from "lucide-react";
import { UNI_KATEGORILER } from "@/lib/universite-faaliyet";
import { LISE_KATEGORILER } from "@/lib/lise-faaliyet";
import type { BolgeFaaliyet } from "@/lib/genclik-veri";

const DONEM_LABEL: Record<string, string> = { DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi" };

/**
 * Üniversite / Lise Gençlik bölge analizi — il sorumlularının girdiği faaliyet
 * verisinden bölgesel + il-il + birim(kategori) bazlı analizler. Hem bölge
 * Anasayfa'sında hem Raporlar'da kullanılır (raporMod ek dönem karşılaştırması açar).
 */
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

  const ilData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of filt) m[f.il] = (m[f.il] ?? 0) + 1;
    return Object.entries(m).map(([il, sayi]) => ({ il, sayi })).sort((a, b) => b.sayi - a.sayi);
  }, [filt]);

  const katData = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of filt) m[f.kategori] = (m[f.kategori] ?? 0) + 1;
    return kategoriler.filter(k => m[k.key]).map(k => ({ ad: k.label, kisa: k.label.split(" ")[0], sayi: m[k.key], renk: k.renk }));
  }, [filt, kategoriler]);

  const donemData = useMemo(() => {
    const ds = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"];
    return ds.map(d => ({
      donem: DONEM_LABEL[d],
      faaliyet: faaliyetler.filter(f => f.yil === yil && f.donem === d).length,
      katilimci: faaliyetler.filter(f => f.yil === yil && f.donem === d).reduce((s, f) => s + f.katilimci, 0),
    })).filter(x => x.faaliyet);
  }, [faaliyetler, yil]);

  const yilSecenekleri = yillar.includes(yil) ? yillar : [yil, ...yillar];
  const cokIl = ilData.length > 1;

  const kartlar = [
    { label: "Toplam Faaliyet", val: ozet.toplam, renk },
    { label: "Toplam Katılımcı", val: ozet.katilimci, renk: "#0369A1" },
    { label: "İlk Kez Katılan", val: ozet.ilkKez, renk: "#B45309" },
    { label: "Yeni İntisap", val: ozet.intisap, renk: "var(--accent)" },
  ];

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

      {/* İl-il faaliyet karşılaştırması */}
      {cokIl && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            İl Bazlı Faaliyet Sayısı — {yil}{donem !== "HEPSI" ? ` / ${DONEM_LABEL[donem]}` : ""}
          </h2>
          <div style={{ width: "100%", height: Math.max(220, ilData.length * 34) }}>
            <ResponsiveContainer>
              <BarChart data={ilData} layout="vertical" margin={{ left: 10, right: 20 }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Kategori dağılımı */}
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

        {/* Dönem karşılaştırması (raporMod) veya il listesi özeti */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
            {raporMod ? `Dönem Karşılaştırması — ${yil}` : "Dönem Dağılımı"}
          </h2>
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
                  {raporMod && <Bar dataKey="katilimci" name="Katılımcı" fill="#0369A1" radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {filt.length === 0 && (
        <div className="rounded-xl border p-10 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-muted)" }}>Seçilen filtrelerde faaliyet verisi bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
