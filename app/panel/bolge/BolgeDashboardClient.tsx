"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { type BirimDurum, type BirimKey } from "@/lib/birimDurum";
import { ANALIZ_SORULAR, ANALIZ_BIRIM_LABEL, type AnalizBirim } from "@/lib/analiz-sorular";

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
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

  function navigate(yeniYil: number, yeniDonem: string) {
    router.push(`/panel/bolge?yil=${yeniYil}&donem=${yeniDonem}`);
  }

  const tamamSayi = iller.filter(i => i.tamam).length;
  const eksikSayi = iller.filter(i => !i.tamam).length;
  const sorumluSayi = iller.filter(i => i.sorumluAtanmis).length;

  const kartlar = [
    { label: "Toplam İl", val: iller.length, color: "border-blue-200 bg-blue-50 text-blue-800" },
    { label: "Tamamlandı", val: tamamSayi, color: "border-green-200 bg-green-50 text-green-800" },
    { label: "Eksik Var", val: eksikSayi, color: "border-red-200 bg-red-50 text-red-800" },
    { label: "Sorumlu Atanmış", val: sorumluSayi, color: "border-purple-200 bg-purple-50 text-purple-800" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

      {/* Soru bazlı il karşılaştırması (faaliyet analizi) */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Soru Bazlı İl Karşılaştırması — {yil} / {DONEM_LABEL[donem]}</h2>
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

      {/* İl bazlı veri durumu detayları "Eksik Veri Girişi – İller" sekmesinde */}
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
