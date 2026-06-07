"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Users, TrendingUp, Heart, Compass, Sun, Home, Building2, Hotel, Eye, Target } from "lucide-react";

/* ─── Tipler ─── */
interface Activity {
  id: string; yil: number; donem: string;
  ik_toplamDergah: number | null; ik_kursuYapilanDergah: number | null;
  ik_elifBaOgrenci: number | null; ik_kuranOgrenci: number | null; ik_gecisOgrenci: number | null;
  ls_toplamDergah: number | null; ls_ilimDersYeri: number | null;
  ls_ilimDersKatilim: number | null; ls_sabahNamaziSayisi: number | null;
  ls_kafileSayisi: number | null; ls_toplamFaaliyet: number | null; ls_yeniIntisap: number | null;
  uni_toplamDergah: number | null; uni_ilimDersYeri: number | null;
  uni_ilimDersKatilim: number | null; uni_sabahNamaziSayisi: number | null;
  uni_kafileSayisi: number | null; uni_kykBulusmaSayisi: number | null;
  uni_toplamFaaliyet: number | null; uni_yeniIntisap: number | null;
}
interface Il { ad: string; bolge: { ad: string } }

/* ─── Yardımcılar ─── */
const n = (v: number | null | undefined) => v ?? 0;
const pct = (pay: number, payda: number) => payda ? Math.round((pay / payda) * 100) : 0;

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

const DONEM_SHORT: Record<string, string> = {
  DONEM_1: "D1", DONEM_2: "D2", YAZ_DONEMI: "Yaz",
};

/* ─── Yüzde Göstergesi ─── */
function PctRing({ value, size = 64, stroke = 6, color }: {
  value: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-hover)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} />
    </svg>
  );
}

/* ─── Mini Stat Kartı ─── */
function MiniCard({ label, value, icon: Icon, color, sub, href }: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string; href?: string;
}) {
  const inner = (
    <div className="sv-stat-card group cursor-pointer transition-all duration-200"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="card-bar" style={{ background: color }} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider leading-tight"
            style={{ color: "var(--text-muted)" }}>{label}</p>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18` }}>
            <Icon size={15} style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Performans Kartı ─── */
function PerfCard({ birim, color, pctVal, katilim, intisap, faaliyet }: {
  birim: string; color: string; pctVal: number;
  katilim: number; intisap: number; faaliyet: number;
}) {
  return (
    <div className="sv-section p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{birim}</h3>
        <span className="text-xs font-bold px-2 py-1 rounded-full"
          style={{ background: `${color}18`, color }}>
          {pctVal}% yaygınlık
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <PctRing value={pctVal} size={72} stroke={7} color={color} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black" style={{ color }}>%{pctVal}</span>
          </div>
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Katılımcı</span>
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{katilim}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Yeni İntisap</span>
            <span className="text-xs font-bold" style={{ color: "var(--green-primary)" }}>{intisap}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Faaliyet</span>
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{faaliyet}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hedef Tipi ─── */
interface IlHedef {
  id: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
}

const HEDEF_LABELS = [
  { key: "yeniIntisap",    label: "Yeni İntisap" },
  { key: "sosyalFaaliyet", label: "Sosyal Faaliyet" },
  { key: "kafile",         label: "Kafile" },
  { key: "kykBulusma",     label: "KYK Buluşması" },
] as const;

function hedefGerceklesen(f: Activity, key: string): number {
  const m: Record<string, number> = {
    yeniIntisap:    n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap),
    sosyalFaaliyet: n(f.ls_toplamFaaliyet) + n(f.uni_toplamFaaliyet),
    kafile:         n(f.ls_kafileSayisi) + n(f.uni_kafileSayisi),
    kykBulusma:     n(f.uni_kykBulusmaSayisi),
  };
  return m[key] ?? 0;
}

/* ─── Ana Client ─── */
export default function IlDashboardClient({
  il, faaliyetler, evSayisi, apartSayisi, yurtSayisi, ziyaretSayisi, ilHedefler,
}: {
  il: Il;
  faaliyetler: Activity[];
  evSayisi: number; apartSayisi: number; yurtSayisi: number; ziyaretSayisi: number;
  ilHedefler: IlHedef[];
}) {
  const son = faaliyetler[0] ?? null;

  /* Tüm dönemlerin toplamları */
  const totals = useMemo(() => {
    let toplamOgrenci = 0, toplamIntisap = 0, toplamFaaliyet = 0,
      toplamKafile = 0, toplamSabah = 0;
    for (const f of faaliyetler) {
      toplamOgrenci   += n(f.ik_elifBaOgrenci) + n(f.ik_kuranOgrenci)
        + n(f.ls_ilimDersKatilim) + n(f.uni_ilimDersKatilim);
      toplamIntisap   += n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap);
      toplamFaaliyet  += n(f.ls_toplamFaaliyet) + n(f.uni_toplamFaaliyet);
      toplamKafile    += n(f.ls_kafileSayisi) + n(f.uni_kafileSayisi);
      toplamSabah     += n(f.ls_sabahNamaziSayisi) + n(f.uni_sabahNamaziSayisi);
    }
    return { toplamOgrenci, toplamIntisap, toplamFaaliyet, toplamKafile, toplamSabah };
  }, [faaliyetler]);

  /* Grafik verisi */
  const chartData = useMemo(() =>
    faaliyetler.slice().reverse().map(f => ({
      name: `${f.yil} ${DONEM_SHORT[f.donem]}`,
      "Yeni İntisap": n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap),
      "Öğrenci": n(f.ik_elifBaOgrenci) + n(f.ik_kuranOgrenci),
      "Faaliyet": n(f.ls_toplamFaaliyet) + n(f.uni_toplamFaaliyet),
    }))
  , [faaliyetler]);

  /* Son dönem performans */
  const ikPct  = son ? pct(n(son.ik_kursuYapilanDergah),  n(son.ik_toplamDergah))  : 0;
  const lsPct  = son ? pct(n(son.ls_ilimDersYeri),  n(son.ls_toplamDergah))  : 0;
  const uniPct = son ? pct(n(son.uni_ilimDersYeri), n(son.uni_toplamDergah)) : 0;

  return (
    <div className="p-6 max-w-6xl space-y-7">

      {/* ── Başlık ── */}
      <div className="sv-page-header">
        <div>
          <h1>{il.ad} İl Paneli</h1>
          <p>{il.bolge.ad} · {faaliyetler.length} dönem kaydı</p>
        </div>
        <Link href="/panel/il/faaliyet/ilkogretim"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--green-primary)" }}>
          + Faaliyet Gir
        </Link>
      </div>

      {/* ── Özet mini kartlar ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>Genel Özet (Tüm Dönemler)</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MiniCard label="Toplam Öğrenci"    value={totals.toplamOgrenci}  icon={Users}    color="#006B3F" />
          <MiniCard label="Yeni İntisap"      value={totals.toplamIntisap}  icon={Heart}    color="#D9BC4B" />
          <MiniCard label="Sosyal Faaliyet"   value={totals.toplamFaaliyet} icon={TrendingUp} color="#0369A1" />
          <MiniCard label="Toplam Kafile"     value={totals.toplamKafile}   icon={Compass}  color="#7C3AED" />
          <MiniCard label="Sabah Namazı"      value={totals.toplamSabah}    icon={Sun}      color="#EA580C" />
        </div>
      </div>

      {/* ── Barınma & Ziyaret ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>Barınma</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniCard label="Aktif Ev"     value={evSayisi}     icon={Home}      color="#006B3F" href="/panel/il/barinma" />
          <MiniCard label="Aktif Apart"  value={apartSayisi}  icon={Building2} color="#0369A1" href="/panel/il/barinma" />
          <MiniCard label="Aktif Yurt"   value={yurtSayisi}   icon={Hotel}     color="#7C3AED" href="/panel/il/barinma" />
          <MiniCard label="Toplam Ziyaret" value={ziyaretSayisi} icon={Eye}   color="#EA580C" href="/panel/il/barinma/ziyaret" />
        </div>
      </div>

      {/* ── Son dönem performans kartları ── */}
      {son && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}>
            Son Dönem Performansı — {son.yil} / {DONEM_LABEL[son.donem]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PerfCard
              birim="İlköğretim Birimi" color="#006B3F" pctVal={ikPct}
              katilim={n(son.ik_elifBaOgrenci) + n(son.ik_kuranOgrenci)}
              intisap={0}
              faaliyet={n(son.ik_kursuYapilanDergah)}
            />
            <PerfCard
              birim="Lise Birimi" color="#0369A1" pctVal={lsPct}
              katilim={n(son.ls_ilimDersKatilim)}
              intisap={n(son.ls_yeniIntisap)}
              faaliyet={n(son.ls_toplamFaaliyet)}
            />
            <PerfCard
              birim="Üniversite Birimi" color="#7C3AED" pctVal={uniPct}
              katilim={n(son.uni_ilimDersKatilim)}
              intisap={n(son.uni_yeniIntisap)}
              faaliyet={n(son.uni_toplamFaaliyet)}
            />
          </div>
        </div>
      )}

      {/* ── Grafikler ── */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* İntisap trendi */}
          <div className="sv-section p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
              Yeni İntisap Trendi
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }} />
                <Bar dataKey="Yeni İntisap" fill="#D9BC4B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Öğrenci & Faaliyet trendi */}
          <div className="sv-section p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
              Öğrenci & Faaliyet Trendi
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }} />
                <Legend />
                <Line type="monotone" dataKey="Öğrenci" stroke="#006B3F" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Faaliyet" stroke="#0369A1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Hedef Takip Merkezi Widget ── */}
      {ilHedefler.length > 0 && (() => {
        const sonHedef = ilHedefler[0];
        const sonF = faaliyetler.find(f => f.yil === sonHedef.yil && f.donem === sonHedef.donem);
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Hedef Takip Merkezi — {sonHedef.yil} / {DONEM_LABEL[sonHedef.donem]}
              </p>
              <Link href="/panel/il/hedefler"
                className="text-xs font-bold" style={{ color: "var(--green-primary)" }}>
                Tümünü Gör →
              </Link>
            </div>
            <div className="sv-section p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {HEDEF_LABELS.map(({ key, label }) => {
                  const hedefVal = (sonHedef as any)[key] as number;
                  const gerceklesVal = sonF ? hedefGerceklesen(sonF, key) : 0;
                  const oran = hedefVal ? Math.round((gerceklesVal / hedefVal) * 100) : 0;
                  const color = oran >= 90 ? "#059669" : oran >= 70 ? "#D9BC4B" : "#DC2626";
                  const kalan = Math.max(0, hedefVal - gerceklesVal);
                  return (
                    <div key={key} className="text-center p-3 rounded-xl border"
                      style={{ background: `${color}08`, borderColor: `${color}30` }}>
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <Target size={12} style={{ color }} />
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          {label}
                        </p>
                      </div>
                      <p className="text-xl font-black" style={{ color }}>
                        {sonF ? gerceklesVal : "—"}
                        {hedefVal > 0 && <span className="text-xs font-bold ml-1" style={{ color: "var(--text-muted)" }}>/ {hedefVal}</span>}
                      </p>
                      {hedefVal > 0 && (
                        <>
                          <div className="h-1.5 rounded-full overflow-hidden mx-auto mt-2 mb-1" style={{ background: "var(--bg-hover)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, oran)}%`, background: color }} />
                          </div>
                          <p className="text-[10px] font-bold" style={{ color }}>%{oran}</p>
                          {kalan > 0 && sonF && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Kalan: {kalan}</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {faaliyetler.length === 0 && (
        <div className="sv-section p-12 text-center">
          <p className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Henüz faaliyet kaydı yok</p>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>İlk kaydı oluşturarak analitik raporları görmeye başlayın</p>
          <Link href="/panel/il/faaliyet/ilkogretim"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: "var(--green-primary)" }}>
            + Faaliyet Gir
          </Link>
        </div>
      )}
    </div>
  );
}
