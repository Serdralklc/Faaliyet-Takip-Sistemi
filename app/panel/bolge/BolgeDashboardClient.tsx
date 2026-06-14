"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  BIRIMLER, BIRIM_ETIKET, durumEtiket,
  type BirimDurum, type BirimKey,
} from "@/lib/birimDurum";
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

function DurumPill({ durum, birim }: { durum: BirimDurum; birim: BirimKey }) {
  const stil =
    durum === "girildi"
      ? { background: "rgba(5,150,105,0.12)", color: "#047857", dot: "#10B981" }
      : durum === "muaf"
      ? { background: "rgba(120,113,108,0.12)", color: "#57534E", dot: "#A8A29E" }
      : { background: "rgba(220,38,38,0.10)", color: "#DC2626", dot: "#EF4444" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap"
      style={{ background: stil.background, color: stil.color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: stil.dot }} />
      {durumEtiket(durum, birim)}
    </span>
  );
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

      {/* İl × birim durum tablosu */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>İl Durumları</h2>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {yil} / {DONEM_LABEL[donem]}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bg-th)" }}>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["İl", "İl Eğitimcisi", ...BIRIMLER.map(b => BIRIM_ETIKET[b])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {iller.map(il => (
                <tr key={il.id} className="border-t hover:bg-[color:var(--bg-hover)] transition" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                    {il.sorumlu ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  {BIRIMLER.map(b => (
                    <td key={b} className="px-4 py-3">
                      <DurumPill durum={il.durumlar[b]} birim={b} />
                    </td>
                  ))}
                </tr>
              ))}
              {iller.length === 0 && (
                <tr>
                  <td colSpan={2 + BIRIMLER.length} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Bölgenize henüz il atanmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        <strong>Girildi</strong>: il eğitimcisi o birime veri girmiş ·
        {" "}<strong>Girilmedi</strong>: veri bekleniyor ·
        {" "}<strong>Çalışma yok / Ev-apart-yurt yok</strong>: il eğitimcisi o birimi muaf işaretlemiş (faaliyet/birim yok).
        {" "}Detay için <strong>İller</strong> sayfasına bakın.
      </p>
    </div>
  );
}
