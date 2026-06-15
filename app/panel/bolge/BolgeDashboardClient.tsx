"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend,
} from "recharts";
import { type BirimDurum, type BirimKey, BIRIMLER, BIRIM_ETIKET, BIRIM_RENK } from "@/lib/birimDurum";
import { ANALIZ_SORULAR, ANALIZ_BIRIM_LABEL, type AnalizBirim } from "@/lib/analiz-sorular";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

const DURUM_RENK: Record<BirimDurum, string> = {
  girildi: "#16a34a",
  girilmedi: "#dc2626",
  muaf: "#9ca3af",
};
const DURUM_ETIKET: Record<BirimDurum, string> = {
  girildi: "Girildi",
  girilmedi: "Girilmedi",
  muaf: "Muaf",
};

export interface IlDurum {
  id: string;
  ad: string;
  sorumlu: string | null;
  sorumluAtanmis: boolean;
  durumlar: Record<BirimKey, BirimDurum>;
  veriVar: boolean;
  tamam: boolean;
}

// Birim bazında özet hesaplama
function birimOzet(iller: IlDurum[]) {
  return BIRIMLER.map(b => {
    const girildi = iller.filter(i => i.durumlar[b] === "girildi").length;
    const muaf    = iller.filter(i => i.durumlar[b] === "muaf").length;
    const giri    = iller.filter(i => i.durumlar[b] === "girilmedi").length;
    return { birim: b, label: BIRIM_ETIKET[b], girildi, muaf, girilmedi: giri, toplam: iller.length };
  });
}

// Radar için bölge ortalaması (seçili soru grubu per birim, normalize 0-100)
function radarVerisi(ilAnaliz: Record<string, string | number>[]) {
  if (!ilAnaliz.length) return [];
  const birimAnahtarlar: Record<AnalizBirim, string> = {
    ILKOGRETIM: "ik_toplamDergah",
    LISE:       "ls_toplamDergah",
    UNIVERSITE: "uni_toplamDergah",
  };
  return Object.entries(birimAnahtarlar).map(([birim, alan]) => {
    const vals = ilAnaliz.map(r => Number(r[alan]) || 0);
    const ort  = vals.reduce((s, v) => s + v, 0) / vals.length;
    const maks = Math.max(...vals, 1);
    return { birim: ANALIZ_BIRIM_LABEL[birim as AnalizBirim], deger: Math.round((ort / maks) * 100) };
  });
}

export function BolgeDashboardClient({
  bolgeAd, iller, ilAnaliz, yil, donem, yillar,
}: {
  bolgeAd: string; iller: IlDurum[]; ilAnaliz: Record<string, string | number>[]; yil: number; donem: string; yillar: number[];
}) {
  const router = useRouter();
  const [soruBirim, setSoruBirim] = useState<AnalizBirim>("ILKOGRETIM");
  const [soruKey, setSoruKey] = useState("ik_toplamDergah");
  const soruGrafik = ilAnaliz.map(r => ({ il: String(r.il), deger: Number(r[soruKey]) || 0 }));
  const soruLabel = ANALIZ_SORULAR[soruBirim].find(s => s.key === soruKey)?.label ?? "Soru";
  const yilSecenekleri = yillar.includes(yil) ? yillar : [yil, ...yillar];

  // Ek analiz verileri
  const ozet = birimOzet(iller);
  const radar = radarVerisi(ilAnaliz);

  // İl sıralaması: veri girilen birimi en çok olan iller önce
  const ilSiralama = [...iller]
    .map(il => ({
      ...il,
      puan: BIRIMLER.filter(b => il.durumlar[b] === "girildi").length,
    }))
    .sort((a, b) => b.puan - a.puan);

  function navigate(yeniYil: number, yeniDonem: string) {
    router.push(`/panel/bolge?yil=${yeniYil}&donem=${yeniDonem}`);
  }

  const tamamSayi  = iller.filter(i => i.tamam).length;
  const eksikSayi  = iller.filter(i => !i.tamam).length;
  const sorumluSayi = iller.filter(i => i.sorumluAtanmis).length;

  const kartlar = [
    { label: "Toplam İl",       val: iller.length, color: "border-blue-200 bg-blue-50 text-blue-800" },
    { label: "Tamamlandı",      val: tamamSayi,    color: "border-green-200 bg-green-50 text-green-800" },
    { label: "Eksik Var",       val: eksikSayi,    color: "border-red-200 bg-red-50 text-red-800" },
    { label: "Sorumlu Atanmış", val: sorumluSayi,  color: "border-purple-200 bg-purple-50 text-purple-800" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Başlık + dönem seçimi */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{bolgeAd}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Bölge Sorumlusu Paneli — illerin birim bazlı veri durumu
          </p>
        </div>
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => navigate(Number(e.target.value), donem)}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select value={donem} onChange={e => navigate(yil, e.target.value)}
              className="rounded-xl border px-3 py-2 text-[13px] font-bold focus:outline-none"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {Object.keys(DONEM_LABEL).map(d => <option key={d} value={d}>{DONEM_LABEL[d]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kartlar.map(c => (
          <div key={c.label} className={`rounded-xl border p-4 text-center ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-3xl font-black mt-1">{c.val}</p>
          </div>
        ))}
      </div>

      {/* Soru bazlı il karşılaştırması */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Soru Bazlı İl Karşılaştırması — {yil} / {DONEM_LABEL[donem]}
          </h2>
          <div className="flex flex-wrap gap-2">
            <select value={soruBirim} onChange={e => { const b = e.target.value as AnalizBirim; setSoruBirim(b); setSoruKey(ANALIZ_SORULAR[b][0].key); }}
              className="rounded-lg border px-2.5 py-1.5 text-[13px]" style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {(Object.keys(ANALIZ_BIRIM_LABEL) as AnalizBirim[]).map(b => <option key={b} value={b}>{ANALIZ_BIRIM_LABEL[b]}</option>)}
            </select>
            <select value={soruKey} onChange={e => setSoruKey(e.target.value)}
              className="rounded-lg border px-2.5 py-1.5 text-[13px]" style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
              {ANALIZ_SORULAR[soruBirim].map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={soruGrafik} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="il" tick={{ fontSize: 10, fill: "var(--text-muted)" }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip formatter={(v) => [Number(v ?? 0).toLocaleString("tr-TR"), soruLabel]}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="deger" fill="#0B6B3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── YENİ ANALİZ BÖLÜMLERİ ── */}

      {/* 1. Birim Bazlı Tamamlanma */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
          Birim Bazlı Veri Tamamlanma Durumu
        </h2>
        <div className="space-y-4">
          {ozet.map(o => {
            const pct = iller.length ? Math.round((o.girildi / iller.length) * 100) : 0;
            const muafPct = iller.length ? Math.round((o.muaf / iller.length) * 100) : 0;
            const eksikPct = 100 - pct - muafPct;
            return (
              <div key={o.birim}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{o.label}</span>
                  <div className="flex gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    <span className="text-green-600 font-bold">{o.girildi} girildi</span>
                    {o.muaf > 0 && <span className="text-gray-400">{o.muaf} muaf</span>}
                    <span className="text-red-500">{o.girilmedi} eksik</span>
                  </div>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--bg-th)" }}>
                  {pct > 0 && <div className="h-full transition-all" style={{ width: `${pct}%`, background: BIRIM_RENK[o.birim] }} />}
                  {muafPct > 0 && <div className="h-full transition-all bg-gray-300" style={{ width: `${muafPct}%` }} />}
                  {eksikPct > 0 && <div className="h-full transition-all bg-red-200" style={{ width: `${eksikPct}%` }} />}
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#0B6B3A]" /> Girildi</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-gray-300" /> Muaf</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-red-200" /> Eksik</span>
        </div>
      </div>

      {/* 2. İl × Birim Durum Matrisi + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* İl Durum Matrisi */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>İl × Birim Durum Matrisi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  <th className="text-left pb-2 pr-3 font-semibold" style={{ color: "var(--text-muted)" }}>İl</th>
                  {BIRIMLER.map(b => (
                    <th key={b} className="pb-2 px-1 text-center font-semibold" style={{ color: "var(--text-muted)" }}>
                      {BIRIM_ETIKET[b]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ilSiralama.map(il => (
                  <tr key={il.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 pr-3 font-medium" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
                    {BIRIMLER.map(b => {
                      const d = il.durumlar[b];
                      return (
                        <td key={b} className="py-2 px-1 text-center">
                          <span
                            className="inline-block w-5 h-5 rounded-full"
                            title={DURUM_ETIKET[d]}
                            style={{ background: DURUM_RENK[d] }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600" /> Girildi</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600" /> Girilmedi</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-gray-400" /> Muaf</span>
          </div>
        </div>

        {/* Radar — birim bazlı doluluk (normalize) */}
        <div className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Birim Doluluk Oranı (Radar)</h2>
          <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>
            Her birim için toplam dergâh/etkinlik ortalamasının maksimuma oranı (%)
          </p>
          {radar.length > 0 ? (
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="birim" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                  <Radar name="Bölge" dataKey="deger" stroke="#0B6B3A" fill="#0B6B3A" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`%${v}`, "Doluluk"]}
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>Veri yok</p>
          )}
        </div>
      </div>

      {/* 3. İl Sıralaması (Tamamlanan birim sayısına göre) */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>İl Performans Sıralaması</h2>
        <div style={{ width: "100%", height: Math.max(180, iller.length * 36) }}>
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={ilSiralama.map(il => ({ ad: il.ad, puan: il.puan, sorumlu: il.sorumlu ?? "Atanmamış" }))}
              margin={{ left: 10, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, BIRIMLER.length]} ticks={[0,1,2,3,4]} tickFormatter={v => `${v} birim`}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis type="category" dataKey="ad" width={90} tick={{ fontSize: 11, fill: "var(--text-primary)" }} />
              <Tooltip
                formatter={(v) => [`${v} / ${BIRIMLER.length} birim`, "Tamamlanan"]}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="puan" fill="#0B6B3A" radius={[0, 4, 4, 0]}
                label={{ position: "right", fontSize: 11, fill: "var(--text-muted)", formatter: (v: unknown) => Number(v) === BIRIMLER.length ? "✓" : "" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* İl veri durumu linki */}
      <button onClick={() => router.push("/panel/bolge/iller")}
        className="w-full rounded-xl border p-5 flex items-center justify-between text-left transition hover:bg-[color:var(--bg-hover)]"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div>
          <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            İl Veri Durumları (girildi / eksik)
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {tamamSayi} il tamam · {eksikSayi} il eksik — il × birim detayları için tıklayın
          </p>
        </div>
        <span className="text-sm font-bold px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-th)", color: "var(--text-secondary)" }}>
          Eksik Veri Girişi – İller →
        </span>
      </button>
    </div>
  );
}
