"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Users, TrendingUp, Heart, Compass, Sun, Home,
  Building2, Hotel, Eye, Target, GraduationCap, School, BookOpen, UserCheck,
} from "lucide-react";

/* ─── Tipler ─── */
interface Activity {
  id: string; yil: number; donem: string;
  ik_toplamDergah: number | null; ik_kursuYapilanDergah: number | null;
  ik_elifBaOgrenci: number | null; ik_kuranOgrenci: number | null; ik_gecisOgrenci: number | null;
  ls_toplamDergah: number | null; ls_ilimSohbetDergah: number | null;
  ls_kafileSayisi: number | null; ls_yeniIntisap: number | null;
  ls_ilimSohbetSayisi: number | null; ls_ilimSohbetKatilim: number | null;
  ls_sosyalSayisi: number | null; ls_sorumlulukSayisi: number | null;
  ls_muhabbetSayisi: number | null; ls_namazSayisi: number | null;
  uni_toplamDergah: number | null; uni_ilimSohbetDergah: number | null;
  uni_kafileSayisi: number | null; uni_kykBulusmaSayisi: number | null; uni_yeniIntisap: number | null;
  uni_ilimSohbetSayisi: number | null; uni_ilimSohbetKatilim: number | null;
  uni_kulupSayisi: number | null; uni_sosyalSayisi: number | null;
  uni_sorumlulukSayisi: number | null; uni_muhabbetSayisi: number | null; uni_namazSayisi: number | null;
  ortakKafileSayisi: number | null;
  ortakSabahNamaziSayisi: number | null;
}
interface Il { ad: string; bolge: { ad: string } }
interface IlHedef {
  id: string; yil: number; donem: string;
  yeniIntisap: number; sosyalFaaliyet: number; kafile: number;
  sabahNamazi: number; ilimDersi: number; kykBulusma: number; ziyaret: number;
}

/* ─── Yardımcılar ─── */
const n = (v: number | null | undefined) => v ?? 0;
const pct = (pay: number, payda: number) => payda ? Math.round((pay / payda) * 100) : 0;

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};
const DONEM_SHORT: Record<string, string> = {
  DONEM_1: "D1", DONEM_2: "D2", YAZ_DONEMI: "Yaz",
};

/* ─── Yüzde Halkası ─── */
function PctRing({ value, size = 64, stroke = 6, color }: {
  value: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(100, value) / 100) * circ;
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
function PerfCard({ birim, color, children }: {
  birim: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="sv-section p-5 space-y-3">
      <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{birim}</h3>
      {children}
    </div>
  );
}

function PerfRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: color ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function PctBadge({ value, color }: { value: number; color: string }) {
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}>
      %{value}
    </span>
  );
}

const HEDEF_LABELS = [
  { key: "yeniIntisap",    label: "Yeni İntisap" },
  { key: "sosyalFaaliyet", label: "Sosyal Faaliyet" },
  { key: "kafile",         label: "Kafile" },
  { key: "kykBulusma",     label: "KYK Buluşması" },
] as const;

function lsToplamFaaliyet(f: Activity): number {
  return n(f.ls_ilimSohbetSayisi) + n(f.ls_sosyalSayisi) + n(f.ls_sorumlulukSayisi) +
    n(f.ls_muhabbetSayisi) + n(f.ls_namazSayisi) + n(f.ls_kafileSayisi);
}
function uniToplamFaaliyet(f: Activity): number {
  return n(f.uni_ilimSohbetSayisi) + n(f.uni_kulupSayisi) + n(f.uni_sosyalSayisi) +
    n(f.uni_sorumlulukSayisi) + n(f.uni_muhabbetSayisi) + n(f.uni_namazSayisi) +
    n(f.uni_kafileSayisi) + n(f.uni_kykBulusmaSayisi);
}

function hedefGerceklesen(f: Activity, key: string): number {
  const m: Record<string, number> = {
    yeniIntisap:    n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap),
    sosyalFaaliyet: lsToplamFaaliyet(f) + uniToplamFaaliyet(f),
    kafile:         n(f.ls_kafileSayisi) + n(f.uni_kafileSayisi) + n(f.ortakKafileSayisi),
    kykBulusma:     n(f.uni_kykBulusmaSayisi),
  };
  return m[key] ?? 0;
}

/* ─── Ana Client ─── */
export default function IlDashboardClient({
  il, faaliyetler, evSayisi, apartSayisi, yurtSayisi, ziyaretSayisi,
  ilHedefler, toplamOgrenciBarinma, nezirBursuSayisi,
}: {
  il: Il;
  faaliyetler: Activity[];
  evSayisi: number; apartSayisi: number; yurtSayisi: number; ziyaretSayisi: number;
  ilHedefler: IlHedef[];
  toplamOgrenciBarinma: number;
  nezirBursuSayisi: number;
}) {
  const son = faaliyetler[0] ?? null;

  /* Tüm dönemlerin toplamları */
  const totals = useMemo(() => {
    let ikOgrenci = 0, lsOgrenci = 0, uniOgrenci = 0;
    let toplamIntisap = 0, toplamFaaliyet = 0, toplamKafile = 0, toplamSabah = 0;
    for (const f of faaliyetler) {
      ikOgrenci    += n(f.ik_elifBaOgrenci) + n(f.ik_kuranOgrenci);
      lsOgrenci    += n(f.ls_ilimSohbetKatilim);
      uniOgrenci   += n(f.uni_ilimSohbetKatilim);
      toplamIntisap   += n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap);
      toplamFaaliyet  += lsToplamFaaliyet(f) + uniToplamFaaliyet(f);
      toplamKafile    += n(f.ls_kafileSayisi) + n(f.uni_kafileSayisi) + n(f.ortakKafileSayisi);
      toplamSabah     += n(f.ls_namazSayisi) + n(f.uni_namazSayisi) + n(f.ortakSabahNamaziSayisi);
    }
    return { ikOgrenci, lsOgrenci, uniOgrenci, toplamIntisap, toplamFaaliyet, toplamKafile, toplamSabah };
  }, [faaliyetler]);

  /* Grafik verisi */
  const chartData = useMemo(() =>
    faaliyetler.slice().reverse().map(f => ({
      name: `${f.yil} ${DONEM_SHORT[f.donem]}`,
      "Yeni İntisap": n(f.ls_yeniIntisap) + n(f.uni_yeniIntisap),
      "Öğrenci (İK)": n(f.ik_elifBaOgrenci) + n(f.ik_kuranOgrenci),
      "Faaliyet": lsToplamFaaliyet(f) + uniToplamFaaliyet(f),
    }))
  , [faaliyetler]);

  /* Son dönem hesapları */
  const ikPct  = son ? pct(n(son.ik_kursuYapilanDergah),  n(son.ik_toplamDergah))  : 0;
  const lsPct  = son ? pct(n(son.ls_ilimSohbetDergah),  n(son.ls_toplamDergah))  : 0;
  const uniPct = son ? pct(n(son.uni_ilimSohbetDergah), n(son.uni_toplamDergah)) : 0;
  const ikGecis = son ? pct(n(son.ik_gecisOgrenci), n(son.ik_elifBaOgrenci) + n(son.ik_kuranOgrenci)) : 0;
  const sonLabel = son ? `${son.yil} / ${DONEM_LABEL[son.donem]}` : "";

  return (
    <div className="p-6 max-w-6xl space-y-7">

      {/* Başlık */}
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

      {/* ── Öğrenci Özeti ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>Öğrenci Özeti (Tüm Dönemler)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MiniCard label="İlköğretim Öğrenci"  value={totals.ikOgrenci}   icon={BookOpen}      color="#006B3F" href="/panel/il/faaliyet/ilkogretim" />
          <MiniCard label="Lise Öğrenci"         value={totals.lsOgrenci}   icon={School}        color="#0369A1" href="/panel/il/faaliyet/lise" />
          <MiniCard label="Üniversite Öğrenci"   value={totals.uniOgrenci}  icon={GraduationCap} color="#7C3AED" href="/panel/il/faaliyet/universite" />
        </div>
      </div>

      {/* ── Faaliyet Özeti ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>Faaliyet Özeti (Tüm Dönemler)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniCard label="Yeni İntisap"    value={totals.toplamIntisap}  icon={Heart}     color="#D9BC4B" />
          <MiniCard label="Sosyal Faaliyet" value={totals.toplamFaaliyet} icon={TrendingUp} color="#0369A1" />
          <MiniCard label="Toplam Kafile"   value={totals.toplamKafile}   icon={Compass}   color="#7C3AED" />
          <MiniCard label="Sabah Namazı"    value={totals.toplamSabah}    icon={Sun}       color="#EA580C" />
        </div>
      </div>

      {/* ── Barınma ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>Barınma</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniCard label="Aktif Ev"          value={evSayisi}              icon={Home}      color="#006B3F" href="/panel/il/barinma" />
          <MiniCard label="Aktif Apart"       value={apartSayisi}           icon={Building2} color="#0369A1" href="/panel/il/barinma" />
          <MiniCard label="Aktif Yurt"        value={yurtSayisi}            icon={Hotel}     color="#7C3AED" href="/panel/il/barinma" />
          <MiniCard label="Toplam Ziyaret"    value={ziyaretSayisi}         icon={Eye}       color="#EA580C" href="/panel/il/barinma/ziyaret" />
          <MiniCard label="Barınan Öğrenci"   value={toplamOgrenciBarinma}  icon={Users}     color="#059669" href="/panel/il/barinma/ogrenci" />
          <MiniCard label="Nezir Bursu Alan"  value={nezirBursuSayisi}      icon={UserCheck} color="#D9BC4B" href="/panel/il/barinma/ogrenci" />
        </div>
      </div>

      {/* ── Son dönem performans ── */}
      {son && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)" }}>Son Dönem — {sonLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* İlköğretim */}
            <PerfCard birim="📚 İlköğretim" color="#006B3F">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative flex-shrink-0">
                  <PctRing value={ikPct} size={60} stroke={6} color="#006B3F" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black" style={{ color: "#006B3F" }}>%{ikPct}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Kurs Yaygınlığı</p>
                  <PctBadge value={ikPct} color="#006B3F" />
                </div>
              </div>
              <PerfRow label="Toplam Öğrenci" value={n(son.ik_elifBaOgrenci) + n(son.ik_kuranOgrenci)} />
              <PerfRow label="Kur'an'a Geçen" value={n(son.ik_gecisOgrenci)} color="#006B3F" />
              <PerfRow label="Geçiş Başarısı" value={`%${ikGecis}`} color={ikGecis >= 70 ? "#059669" : "#D9BC4B"} />
            </PerfCard>

            {/* Lise */}
            <PerfCard birim="🎓 Lise" color="#0369A1">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative flex-shrink-0">
                  <PctRing value={lsPct} size={60} stroke={6} color="#0369A1" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black" style={{ color: "#0369A1" }}>%{lsPct}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>İlim Yaygınlığı</p>
                  <PctBadge value={lsPct} color="#0369A1" />
                </div>
              </div>
              <PerfRow label="İlim/Sohbet Katılım" value={n(son.ls_ilimSohbetKatilim)} />
              <PerfRow label="Yeni İntisap" value={n(son.ls_yeniIntisap)} color="#059669" />
              <PerfRow label="Toplam Faaliyet" value={lsToplamFaaliyet(son)} />
            </PerfCard>

            {/* Üniversite */}
            <PerfCard birim="🎯 Üniversite" color="#7C3AED">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative flex-shrink-0">
                  <PctRing value={uniPct} size={60} stroke={6} color="#7C3AED" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black" style={{ color: "#7C3AED" }}>%{uniPct}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>İlim Yaygınlığı</p>
                  <PctBadge value={uniPct} color="#7C3AED" />
                </div>
              </div>
              <PerfRow label="İlim/Sohbet Katılım" value={n(son.uni_ilimSohbetKatilim)} />
              <PerfRow label="Yeni İntisap" value={n(son.uni_yeniIntisap)} color="#059669" />
              <PerfRow label="Toplam Faaliyet" value={uniToplamFaaliyet(son)} />
            </PerfCard>

          </div>
        </div>
      )}

      {/* ── Grafikler ── */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="sv-section p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Yeni İntisap</h3>
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
          <div className="sv-section p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Öğrenci & Faaliyet</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }} />
                <Legend />
                <Line type="monotone" dataKey="Öğrenci (İK)" stroke="#006B3F" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Faaliyet" stroke="#0369A1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Muradımız widget'ı kaldırıldı (F1) — F12 (İl Eğitim anasayfa yenileme) ile kod tamamen silinecek */}
      {false && ilHedefler.length > 0 && (() => {
        const sonHedef = ilHedefler[0];
        const sonF = faaliyetler.find(f => f.yil === sonHedef.yil && f.donem === sonHedef.donem);
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Muradımız — {sonHedef.yil} / {DONEM_LABEL[sonHedef.donem]}
              </p>
              <Link href="/panel/il/hedefler" className="text-xs font-bold" style={{ color: "var(--green-primary)" }}>
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
