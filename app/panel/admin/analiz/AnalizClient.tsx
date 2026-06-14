"use client";

/** Rapor ve Analiz Merkezi — interaktif grafikler + kurumsal dışa aktarma */

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TurkiyeHarita } from "./TurkiyeHarita";
import { ANALIZ_SORULAR, ANALIZ_BIRIM_LABEL, type AnalizBirim } from "@/lib/analiz-sorular";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ExportButtons } from "@/components/ui/ExportButtons";

const RENKLER = ["#0B6B3A", "#D4AF37", "#1D4ED8", "#7C3AED", "#DC2626", "#0891B2", "#EA580C", "#64748B"];

const METRIK_LABELS: Record<string, string> = {
  toplamFaaliyet: "Toplam Faaliyet",
  yeniIntisap:    "Yeni İntisap",
  kafile:         "Kafile",
  sabahNamazi:    "Sabah Namazı",
  ilimDersi:      "İlim Dersi Yeri",
  kykBulusma:     "KYK Buluşması",
  ziyaret:        "Ziyaret",
};

const OGRENIM_LABELS: Record<string, string> = {
  ILKOKUL: "İlkokul", ORTAOKUL: "Ortaokul", LISE: "Lise", UNIVERSITE: "Üniversite",
};

const DURUM_LABELS: Record<string, string> = {
  BEKLEMEDE: "Beklemede", INCELENIYOR: "İnceleniyor", GORUSULDU: "Görüşüldü",
  ONAYLANDI: "Onaylandı", REDDEDILDI: "Reddedildi",
};

interface AnalizData {
  yil: number;
  oncekiYil: number;
  yillar: number[];
  bolgeSerisi: ({ bolge: string; bolgeTam: string } & Record<string, string | number>)[];
  bolgeSoruVeri: Record<string, string | number>[];
  bolgeListesi: { no: number; ad: string }[];
  donemSerisi: Record<string, string | number>[];
  toplam: Record<string, number>;
  oncekiToplam: { toplamFaaliyet: number; yeniIntisap: number };
  gonullu: { toplam: number; ogrenim: { ad: string; deger: number }[]; iller: { ad: string; deger: number }[] };
  burs: { ad: string; deger: number }[];
  ekKayit: { ad: string; deger: number }[];
  barinma: { tipler: { ad: string; deger: number }[]; ogrenci: number };
  hedef: { metrik: string; hedef: number; gerceklesen: number }[];
}

interface LiseData {
  toplam: { toplam: number; katilimci: number; ilkKez: number; yeniIntisap: number };
  oncekiToplam: { toplam: number };
  bolgeSerisi: ({ bolge: string; bolgeTam: string } & Record<string, string | number>)[];
  donemSerisi: Record<string, string | number>[];
  kategori: { ad: string; deger: number }[];
}

const LISE_METRIK: Record<string, string> = {
  toplam: "Toplam Faaliyet", katilimci: "Toplam Katılımcı", ilkKez: "İlk Kez Katılan", yeniIntisap: "Yeni İntisap",
};

function Delta({ simdi, once }: { simdi: number; once: number }) {
  if (!once) return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted"><Minus size={11} /> önceki yıl verisi yok</span>;
  const yuzde = Math.round(((simdi - once) / once) * 100);
  if (yuzde === 0) return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted"><Minus size={11} /> değişim yok</span>;
  const artis = yuzde > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${artis ? "text-green-600" : "text-red-500"}`}>
      {artis ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      %{Math.abs(yuzde)} {artis ? "artış" : "azalış"}
    </span>
  );
}

function GrafikKart({ title, children, height = 280 }: { title: string; children: React.ReactElement; height?: number }) {
  return (
    <div className="sv-section p-5">
      <h2 className="text-[14px] font-bold text-heading mb-4">{title}</h2>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

/** Lise Gençlik Genel Bakış — yalnız LiseFaaliyet verisi (Eğitimci/Üniversite yok) */
function LiseGenelBakis({ data, yil, oncekiYil }: { data: LiseData; yil: number; oncekiYil: number }) {
  const [metrik, setMetrik] = useState("toplam");
  const selectCls = "rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition";
  const kpiler = [
    { label: `Toplam Faaliyet (${yil})`, value: data.toplam.toplam, delta: <Delta simdi={data.toplam.toplam} once={data.oncekiToplam.toplam} /> },
    { label: "Toplam Katılımcı", value: data.toplam.katilimci, delta: null },
    { label: "İlk Kez Katılan", value: data.toplam.ilkKez, delta: null },
    { label: "Yeni İntisap", value: data.toplam.yeniIntisap, delta: null },
  ];
  return (
    <>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {kpiler.map(k => (
          <div key={k.label} className="sv-stat-card">
            <div className="card-bar" style={{ background: "#7C3AED" }} />
            <p className="card-label">{k.label}</p>
            <p className="card-value text-heading">{k.value.toLocaleString("tr-TR")}</p>
            {k.delta && <div className="mt-2">{k.delta}</div>}
          </div>
        ))}
      </div>

      <div className="sv-section p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-[14px] font-bold text-heading">Bölge Karşılaştırması ({yil})</h2>
          <select value={metrik} onChange={e => setMetrik(e.target.value)} className={selectCls} aria-label="Metrik">
            {Object.entries(LISE_METRIK).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.bolgeSerisi} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bolge" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), LISE_METRIK[metrik]]} labelFormatter={(l, p) => (p?.[0]?.payload as { bolgeTam?: string })?.bolgeTam ?? l} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey={metrik} fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <GrafikKart title={`Dönem Trendi — ${yil} vs ${oncekiYil} (Toplam Faaliyet)`}>
          <LineChart data={data.donemSerisi}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="donem" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={String(yil)} stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey={String(oncekiYil)} stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
          </LineChart>
        </GrafikKart>
        <GrafikKart title="Faaliyet Kategori Dağılımı" height={300}>
          <PieChart>
            <Pie data={data.kategori.filter(k => k.deger > 0)} dataKey="deger" nameKey="ad" innerRadius={55} outerRadius={95} paddingAngle={3} label={(p) => `${p.name} (${p.value})`} labelLine={false} fontSize={11}>
              {data.kategori.filter(k => k.deger > 0).map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
          </PieChart>
        </GrafikKart>
      </div>
    </>
  );
}

export function AnalizClient({ data, liseModu, liseData }: { data: AnalizData; liseModu?: boolean; liseData?: LiseData | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"genel" | "harita">(searchParams.get("sekme") === "harita" ? "harita" : "genel");
  const [bolgeMetrik, setBolgeMetrik] = useState("yeniIntisap");

  // Soru bazlı bölge karşılaştırması (birim → soru → dönem)
  const [soruBirim, setSoruBirim] = useState<AnalizBirim>("ILKOGRETIM");
  const [soruKey, setSoruKey] = useState("ik_toplamDergah");
  const [soruDonem, setSoruDonem] = useState("");
  const soruLabel = ANALIZ_SORULAR[soruBirim].find(s => s.key === soruKey)?.label ?? "Soru";
  const soruGrafikVeri = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of data.bolgeSoruVeri) {
      if (soruDonem && String(r.donem) !== soruDonem) continue;
      const b = String(r.bolge);
      map.set(b, (map.get(b) ?? 0) + (Number(r[soruKey]) || 0));
    }
    return data.bolgeListesi.map(b => ({ bolge: `${b.no}. Bölge`, bolgeTam: b.ad, deger: map.get(b.ad) ?? 0 }));
  }, [data.bolgeSoruVeri, data.bolgeListesi, soruKey, soruDonem]);

  const hedefOrt = (() => {
    const gecerli = data.hedef.filter(h => h.hedef > 0);
    if (!gecerli.length) return null;
    return Math.round(gecerli.reduce((s, h) => s + Math.min(100, (h.gerceklesen / h.hedef) * 100), 0) / gecerli.length);
  })();

  const kpiler = [
    { label: `Toplam Faaliyet (${data.yil})`, value: data.toplam.toplamFaaliyet, delta: <Delta simdi={data.toplam.toplamFaaliyet} once={data.oncekiToplam.toplamFaaliyet} /> },
    { label: `Yeni İntisap (${data.yil})`,    value: data.toplam.yeniIntisap,    delta: <Delta simdi={data.toplam.yeniIntisap} once={data.oncekiToplam.yeniIntisap} /> },
    { label: "Kayıtlı Gönüllü",               value: data.gonullu.toplam,        delta: null },
    { label: "Hedef Gerçekleşme",             value: hedefOrt === null ? "—" : `%${hedefOrt}`, delta: null },
  ];

  const exportSpec = () => ({
    title: `Analiz Merkezi — ${data.yil} Bölge Özeti`,
    subtitle: "İl bazlı faaliyet verilerinin bölge toplamları",
    fileName: `analiz-${data.yil}`,
    columns: [
      { header: "Bölge", key: "bolgeTam" },
      ...Object.keys(METRIK_LABELS).map(k => ({ header: METRIK_LABELS[k], key: k })),
    ],
    rows: data.bolgeSerisi as Record<string, string | number>[],
  });

  const selectCls = "rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition";

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="sv-page-header" style={{ marginBottom: 0 }}>
          <h1>Rapor ve Analiz Merkezi</h1>
          <p>İl, bölge, hedef, gönüllü ve barınma verilerinin bütünleşik görünümü</p>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-[12px] font-bold text-muted uppercase tracking-wider">
            Yıl
            <select value={data.yil} onChange={e => router.push(`/panel/admin/analiz?yil=${e.target.value}`)} className={selectCls}>
              {data.yillar.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <ExportButtons getSpec={exportSpec} />
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        {([["genel", "Genel Bakış"], ["harita", "Türkiye Haritası"]] as const).map(([k, etiket]) => (
          <button key={k} onClick={() => setTab(k)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={tab === k ? { background: "var(--accent-solid)", color: "#fff" } : { color: "var(--text-muted)" }}>
            {etiket}
          </button>
        ))}
      </div>

      {tab === "harita" && <TurkiyeHarita />}

      {/* Lise Gençlik bağlamı: Genel Bakış yalnız Lise verisi */}
      {tab === "genel" && liseModu && liseData && <LiseGenelBakis data={liseData} yil={data.yil} oncekiYil={data.oncekiYil} />}

      {tab === "genel" && !liseModu && (<>
      {/* Faaliyet Takip Sistemi seçimi */}
      <div className="flex flex-wrap gap-2">
        <span className="px-4 py-2 rounded-xl text-[13px] font-bold text-white" style={{ background: "#0B6B3A" }}>Eğitimci</span>
        <Link href="/panel/admin/raporlar?sistem=UNIVERSITE" className="px-4 py-2 rounded-xl text-[13px] font-bold border hover:bg-th" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Üniversite Gençlik</Link>
        <Link href="/panel/admin/raporlar?sistem=LISE" className="px-4 py-2 rounded-xl text-[13px] font-bold border hover:bg-th" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Lise Gençlik</Link>
      </div>

      {/* KPI kartları */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {kpiler.map(k => (
          <div key={k.label} className="sv-stat-card">
            <div className="card-bar" style={{ background: "var(--accent-solid)" }} />
            <p className="card-label">{k.label}</p>
            <p className="card-value text-heading">{typeof k.value === "number" ? k.value.toLocaleString("tr-TR") : k.value}</p>
            {k.delta && <div className="mt-2">{k.delta}</div>}
          </div>
        ))}
      </div>

      {/* Bölge karşılaştırma */}
      <div className="sv-section p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-[14px] font-bold text-heading">Bölge Karşılaştırması ({data.yil})</h2>
          <select value={bolgeMetrik} onChange={e => setBolgeMetrik(e.target.value)} className={selectCls} aria-label="Karşılaştırma metriği">
            {Object.entries(METRIK_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.bolgeSerisi} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bolge" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), METRIK_LABELS[bolgeMetrik]]}
                labelFormatter={(l, p) => (p?.[0]?.payload as { bolgeTam?: string })?.bolgeTam ?? l}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey={bolgeMetrik} fill="#0B6B3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Soru bazlı bölge karşılaştırması (birim → soru → dönem) */}
      <div className="sv-section p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-[14px] font-bold text-heading">Soru Bazlı Bölge Karşılaştırması</h2>
          <div className="flex flex-wrap gap-2">
            <select value={soruBirim} onChange={e => { const b = e.target.value as AnalizBirim; setSoruBirim(b); setSoruKey(ANALIZ_SORULAR[b][0].key); }} className={selectCls} aria-label="Birim">
              {(Object.keys(ANALIZ_BIRIM_LABEL) as AnalizBirim[]).map(b => <option key={b} value={b}>{ANALIZ_BIRIM_LABEL[b]}</option>)}
            </select>
            <select value={soruKey} onChange={e => setSoruKey(e.target.value)} className={selectCls} aria-label="Soru">
              {ANALIZ_SORULAR[soruBirim].map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <select value={soruDonem} onChange={e => setSoruDonem(e.target.value)} className={selectCls} aria-label="Dönem">
              <option value="">Tüm Dönemler</option>
              <option value="DONEM_1">1. Dönem</option>
              <option value="DONEM_2">2. Dönem</option>
              <option value="YAZ_DONEMI">Yaz Dönemi</option>
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={soruGrafikVeri} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bolge" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), soruLabel]}
                labelFormatter={(l, p) => (p?.[0]?.payload as { bolgeTam?: string })?.bolgeTam ?? l}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="deger" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Dönem trendi — yıl karşılaştırmalı */}
        <GrafikKart title={`Dönem Trendi — ${data.yil} vs ${data.oncekiYil} (Toplam Faaliyet)`}>
          <LineChart data={data.donemSerisi}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="donem" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={String(data.yil)} stroke="#0B6B3A" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey={String(data.oncekiYil)} stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
          </LineChart>
        </GrafikKart>

        {/* Hedef gerçekleşme */}
        <div className="sv-section p-5">
          <h2 className="text-[14px] font-bold text-heading mb-4">Hedef Gerçekleşme ({data.yil} — Türkiye Toplamı)</h2>
          {data.hedef.every(h => h.hedef === 0) ? (
            <p className="text-[13px] text-muted py-8 text-center">Bu yıl için tanımlı bölge hedefi yok.</p>
          ) : (
            <div className="space-y-3.5">
              {data.hedef.filter(h => h.hedef > 0).map(h => {
                const pct = Math.round((h.gerceklesen / h.hedef) * 100);
                const renk = pct >= 100 ? "#0B6B3A" : pct >= 60 ? "#D97706" : "#DC2626";
                return (
                  <div key={h.metrik}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-semibold text-secondary">{METRIK_LABELS[h.metrik]}</span>
                      <span className="font-bold" style={{ color: renk }}>
                        {h.gerceklesen.toLocaleString("tr-TR")} / {h.hedef.toLocaleString("tr-TR")} (%{pct})
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: renk }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gönüllü öğrenim dağılımı */}
        <GrafikKart title={`Gönüllü Öğrenim Dağılımı (${data.gonullu.toplam.toLocaleString("tr-TR")} gönüllü)`} height={260}>
          <PieChart>
            <Pie
              data={data.gonullu.ogrenim.map(g => ({ ...g, ad: OGRENIM_LABELS[g.ad] ?? g.ad }))}
              dataKey="deger" nameKey="ad" innerRadius={55} outerRadius={90} paddingAngle={3}
              label={(p) => `${p.name} (${p.value})`} labelLine={false} fontSize={11}
            >
              {data.gonullu.ogrenim.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
          </PieChart>
        </GrafikKart>

        {/* Başvuru durumları */}
        <GrafikKart title="Başvuru Durumları (Burs + Ev/Yurt)" height={260}>
          <BarChart
            data={["BEKLEMEDE", "INCELENIYOR", "GORUSULDU", "ONAYLANDI", "REDDEDILDI"].map(d => ({
              durum: DURUM_LABELS[d],
              Burs: data.burs.find(b => b.ad === d)?.deger ?? 0,
              "Ev/Yurt": data.ekKayit.find(b => b.ad === d)?.deger ?? 0,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="durum" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Burs" fill="#0B6B3A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ev/Yurt" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </GrafikKart>

        {/* Gönüllü il dağılımı */}
        <GrafikKart title="Gönüllü Sayısı — İlk 8 İl" height={260}>
          <BarChart data={data.gonullu.iller} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }} allowDecimals={false} />
            <YAxis type="category" dataKey="ad" tick={{ fontSize: 11, fill: "var(--text-muted)" }} width={90} />
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
            <Bar dataKey="deger" name="Gönüllü" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </GrafikKart>

        {/* Barınma dağılımı */}
        <GrafikKart title={`Barınma Birimleri (${data.barinma.ogrenci.toLocaleString("tr-TR")} öğrenci)`} height={260}>
          <PieChart>
            <Pie
              data={data.barinma.tipler.map(t => ({ ...t, ad: t.ad === "EV" ? "Öğrenci Evi" : t.ad === "APART" ? "Apart" : t.ad === "YURT" ? "Yurt" : t.ad }))}
              dataKey="deger" nameKey="ad" innerRadius={55} outerRadius={90} paddingAngle={3}
              label={(p) => `${p.name} (${p.value})`} labelLine={false} fontSize={11}
            >
              {data.barinma.tipler.map((_, i) => <Cell key={i} fill={RENKLER[(i + 4) % RENKLER.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
          </PieChart>
        </GrafikKart>
      </div>
      </>)}
    </div>
  );
}
