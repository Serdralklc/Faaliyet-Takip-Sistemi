"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ─── Tipler ─── */
import { ExportButtons } from "@/components/ui/ExportButtons";

interface Activity {
  id: string; yil: number; donem: string;
  ik_toplamDergah: number | null; ik_kursuYapilanDergah: number | null;
  ik_elifBaOgrenci: number | null; ik_kuranOgrenci: number | null; ik_gecisOgrenci: number | null;
  ls_toplamDergah: number | null; ls_liseliOgrenciSayisi: number | null; ls_yeniIntisap: number | null;
  ls_kafileSayisi: number | null; ls_kafileOgrenci: number | null;
  ls_ilimSohbetDergah: number | null; ls_mezunOgrenci: number | null;
  ls_ilimSohbetSayisi: number | null; ls_ilimSohbetKatilim: number | null;
  ls_sosyalSayisi: number | null; ls_sosyalKatilim: number | null;
  ls_sorumlulukSayisi: number | null; ls_sorumlulukKatilim: number | null;
  ls_muhabbetSayisi: number | null; ls_muhabbetKatilim: number | null;
  ls_namazSayisi: number | null; ls_namazKatilim: number | null;
  uni_toplamDergah: number | null; uni_universiteliOgrenciSayisi: number | null; uni_yeniIntisap: number | null;
  uni_kafileSayisi: number | null; uni_kafileOgrenci: number | null;
  uni_kykBulusmaSayisi: number | null; uni_kykKatilim: number | null;
  uni_ilimSohbetDergah: number | null; uni_sonSinifOgrenci: number | null; uni_aktifKulup: number | null;
  uni_ilimSohbetSayisi: number | null; uni_ilimSohbetKatilim: number | null;
  uni_kulupSayisi: number | null; uni_kulupKatilim: number | null;
  uni_sosyalSayisi: number | null; uni_sosyalKatilim: number | null;
  uni_sorumlulukSayisi: number | null; uni_sorumlulukKatilim: number | null;
  uni_muhabbetSayisi: number | null; uni_muhabbetKatilim: number | null;
  uni_namazSayisi: number | null; uni_namazKatilim: number | null;
  ortakKafileSayisi: number | null; ortakKafileLiseKatilim: number | null; ortakKafileUniKatilim: number | null;
  ortakSabahNamaziSayisi: number | null; ortakSabahNamaziLiseKatilim: number | null; ortakSabahNamaziUniKatilim: number | null;
}

/* ─── Yardımcılar ─── */
const n = (v: number | null | undefined) => v ?? 0;
const pct = (pay: number, payda: number) =>
  payda ? Math.round((pay / payda) * 100) : 0;

const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

/* ─── Yüzde Gösterge Çubuğu ─── */
function ProgressBar({ value, color }: { value: number; color: string }) {
  const safe = Math.min(100, Math.max(0, value));
  const barColor = safe >= 70 ? "#059669" : safe >= 40 ? "#D9BC4B" : "#DC2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${safe}%`, background: color ?? barColor }} />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color: color ?? barColor }}>%{value}</span>
    </div>
  );
}

/* ─── Metrik Satırı ─── */
function MetrikRow({ label, value, suffix = "", sub, bold }: {
  label: string; value: string | number; suffix?: string; sub?: string; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-sm" style={{ color: "var(--text-secondary)", fontWeight: bold ? 700 : 500 }}>
        {label}
      </span>
      <div className="text-right">
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {value}{suffix}
        </span>
        {sub && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Karşılaştırma ─── */
function Delta({ prev, curr, label }: { prev: number; curr: number; label: string }) {
  if (!prev && !curr) return null;
  const diff = curr - prev;
  const pctDiff = prev ? Math.round((diff / prev) * 100) : null;

  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const color = diff > 0 ? "#059669" : diff < 0 ? "#DC2626" : "var(--text-muted)";

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prev} → {curr}</span>
        <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}>
          <Icon size={11} />
          {diff > 0 ? "+" : ""}{diff}
          {pctDiff !== null && ` (%${Math.abs(pctDiff)})`}
        </div>
      </div>
    </div>
  );
}

/* ─── Birim Bölümü ─── */
function BirimSection({ title, color, children }: {
  title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="sv-section overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2 border-b"
        style={{ background: color, borderColor: "transparent" }}>
        <h3 className="font-bold text-sm text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Ana Client ─── */
export default function RaporlarClient({
  faaliyetler, ilAd, bolgeAd,
}: {
  faaliyetler: Activity[]; ilAd: string; bolgeAd: string;
}) {
  const yillar = useMemo(() =>
    [...new Set(faaliyetler.map(f => f.yil))].sort((a, b) => b - a)
  , [faaliyetler]);

  const [selectedYil, setSelectedYil] = useState<number>(yillar[0] ?? new Date().getFullYear());
  const [tab, setTab] = useState<"tek" | "karsilastir">("tek");
  const [selectedDonem, setSelectedDonem] = useState("DONEM_1");

  const donemMap = useMemo(() => {
    const m = new Map<string, Activity>();
    for (const f of faaliyetler) m.set(`${f.yil}-${f.donem}`, f);
    return m;
  }, [faaliyetler]);

  const f = donemMap.get(`${selectedYil}-${selectedDonem}`);

  /* Karşılaştırma için dönem listesi */
  const donemler = useMemo(() => {
    const year = faaliyetler.filter(x => x.yil === selectedYil);
    return year.map(x => x.donem);
  }, [faaliyetler, selectedYil]);

  /** Seçili yılın dönem kayıtlarını kurumsal şablonla dışa aktarır */
  function exportSpec() {
    const cols: { header: string; key: string }[] = [
      { header: "Dönem", key: "donemAd" },
      { header: "İlköğr. Elif-Ba", key: "ik_elifBaOgrenci" },
      { header: "İlköğr. Kur'an", key: "ik_kuranOgrenci" },
      { header: "Lise Top. Faaliyet", key: "lsToplamFaaliyet" },
      { header: "Lise Yeni İntisap", key: "ls_yeniIntisap" },
      { header: "Lise Kafile", key: "ls_kafileSayisi" },
      { header: "Lise Namaz", key: "ls_namazSayisi" },
      { header: "Üni Top. Faaliyet", key: "uniToplamFaaliyet" },
      { header: "Üni Yeni İntisap", key: "uni_yeniIntisap" },
      { header: "Üni Kafile", key: "uni_kafileSayisi" },
      { header: "Üni Namaz", key: "uni_namazSayisi" },
      { header: "Üni KYK Buluşma", key: "uni_kykBulusmaSayisi" },
      { header: "Ortak Kafile", key: "ortakKafileSayisi" },
      { header: "Ortak Sabah Nam.", key: "ortakSabahNamaziSayisi" },
      { header: "TOPLAM Kafile", key: "toplamKafile" },
      { header: "TOPLAM Sabah Nam.", key: "toplamSabahNamazi" },
      { header: "Toplam Ziyaret", key: "eay_toplamZiyaret" },
    ];
    const rows = faaliyetler
      .filter(x => x.yil === selectedYil)
      .map(x => ({
        ...x,
        donemAd: DONEM_LABEL[x.donem] ?? x.donem,
        lsToplamFaaliyet: n(x.ls_ilimSohbetSayisi) + n(x.ls_sosyalSayisi) + n(x.ls_sorumlulukSayisi) + n(x.ls_muhabbetSayisi) + n(x.ls_namazSayisi) + n(x.ls_kafileSayisi),
        uniToplamFaaliyet: n(x.uni_ilimSohbetSayisi) + n(x.uni_kulupSayisi) + n(x.uni_sosyalSayisi) + n(x.uni_sorumlulukSayisi) + n(x.uni_muhabbetSayisi) + n(x.uni_namazSayisi) + n(x.uni_kafileSayisi) + n(x.uni_kykBulusmaSayisi),
        toplamKafile: n(x.ls_kafileSayisi) + n(x.uni_kafileSayisi) + n(x.ortakKafileSayisi),
        toplamSabahNamazi: n(x.ls_namazSayisi) + n(x.uni_namazSayisi) + n(x.ortakSabahNamaziSayisi),
      } as unknown as Record<string, string | number>));
    return {
      title: `${ilAd} İl Raporu`,
      subtitle: `${bolgeAd} • ${selectedYil}`,
      fileName: `il-raporu-${ilAd}-${selectedYil}`,
      columns: cols,
      rows,
    };
  }

  /* ── Render ── */
  return (
    <div className="p-6 max-w-5xl space-y-6">

      {/* Başlık */}
      <div className="sv-page-header">
        <h1>Analitik Raporlar</h1>
        <p>{ilAd} · {bolgeAd} · {faaliyetler.length} dönem kaydı</p>
      </div>

      {faaliyetler.length === 0 && (
        <div className="sv-section p-12 text-center">
          <p className="font-semibold" style={{ color: "var(--text-muted)" }}>
            Henüz faaliyet kaydı yok. Faaliyet girdikten sonra raporlar burada görünecek.
          </p>
        </div>
      )}

      {faaliyetler.length > 0 && (
        <>
          {/* Mod seçici + dışa aktarma */}
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {[
              { key: "tek",         label: "Dönem Analizi" },
              { key: "karsilastir", label: "Dönem Karşılaştırması" },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => setTab(key as any)}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition"
                style={tab === key
                  ? { background: "var(--green-primary)", color: "#fff", borderColor: "transparent" }
                  : { background: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border)" }
                }>
                {label}
              </button>
            ))}
          </div>
          <ExportButtons getSpec={exportSpec} />
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Yıl */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Yıl</label>
              <select value={selectedYil} onChange={e => setSelectedYil(+e.target.value)}
                className="border-2 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
                {yillar.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Dönem (sadece tek modda) */}
            {tab === "tek" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Dönem</label>
                <div className="flex gap-1">
                  {["DONEM_1", "DONEM_2", "YAZ_DONEMI"].map(d => {
                    const has = donemMap.has(`${selectedYil}-${d}`);
                    return (
                      <button key={d}
                        disabled={!has}
                        onClick={() => setSelectedDonem(d)}
                        className="px-3 py-2 rounded-xl text-xs font-bold border transition"
                        style={selectedDonem === d && has
                          ? { background: "var(--green-primary)", color: "#fff", borderColor: "transparent" }
                          : has
                          ? { background: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border)" }
                          : { background: "var(--bg-hover)", color: "var(--text-muted)", borderColor: "var(--border)", opacity: 0.4 }
                        }>
                        {DONEM_LABEL[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══ TEK DÖNEM ANALİZİ ══ */}
          {tab === "tek" && (
            <>
              {!f ? (
                <div className="sv-section p-10 text-center">
                  <p style={{ color: "var(--text-muted)" }}>Bu dönem için veri girilmemiş.</p>
                </div>
              ) : (
                <div className="space-y-5">

                  {/* İLKÖĞRETİM */}
                  <BirimSection title="📚 İlköğretim Birimi" color="#006B3F">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Dergah</p>
                        <MetrikRow label="Toplam Dergah" value={n(f.ik_toplamDergah)} bold />
                        <MetrikRow label="Hafta Sonu Kursu Yapılan" value={n(f.ik_kursuYapilanDergah)} />
                        <div className="mt-2">
                          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kurs Yaygınlığı</p>
                          <ProgressBar value={pct(n(f.ik_kursuYapilanDergah), n(f.ik_toplamDergah))} color="#006B3F" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Öğrenci</p>
                        <MetrikRow label="Elif-Ba ile Başlayan" value={n(f.ik_elifBaOgrenci)} />
                        <MetrikRow label="Kur'an-ı Kerim ile Başlayan" value={n(f.ik_kuranOgrenci)} />
                        <MetrikRow label="Toplam Öğrenci"
                          value={n(f.ik_elifBaOgrenci) + n(f.ik_kuranOgrenci)} bold />
                        <MetrikRow label="Kur'an'a Geçen" value={n(f.ik_gecisOgrenci)} />
                        <div className="mt-2">
                          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kur'an'a Geçiş Başarısı (Geçen ÷ Elif Ba'dan Başlayan)</p>
                          <ProgressBar
                            value={pct(n(f.ik_gecisOgrenci), n(f.ik_elifBaOgrenci))}
                            color="#006B3F"
                          />
                        </div>
                      </div>
                    </div>
                  </BirimSection>

                  {/* LİSE */}
                  <BirimSection title="🎓 Lise Birimi" color="#0369A1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Öğrenci ve Dergâh</p>
                        <MetrikRow label="Toplam Dergâh" value={n(f.ls_toplamDergah)} bold />
                        <MetrikRow label="İlim/Sohbet Yapılan Dergâh" value={n(f.ls_ilimSohbetDergah)} />
                        <MetrikRow label="Toplam Liseli Öğrenci" value={n(f.ls_liseliOgrenciSayisi)} />
                        <MetrikRow label="Mezun Olacak Liseli" value={n(f.ls_mezunOgrenci)} />
                        <MetrikRow label="Yeni İntisap" value={n(f.ls_yeniIntisap)} bold />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Faaliyetler (sayı · katılan)</p>
                        <MetrikRow label="İlim / Sohbet"      value={n(f.ls_ilimSohbetSayisi)}  sub={`${n(f.ls_ilimSohbetKatilim)} katılım`} />
                        <MetrikRow label="Sosyal"             value={n(f.ls_sosyalSayisi)}      sub={`${n(f.ls_sosyalKatilim)} katılım`} />
                        <MetrikRow label="Sosyal Sorumluluk"  value={n(f.ls_sorumlulukSayisi)}  sub={`${n(f.ls_sorumlulukKatilim)} katılım`} />
                        <MetrikRow label="Muhabbet"           value={n(f.ls_muhabbetSayisi)}    sub={`${n(f.ls_muhabbetKatilim)} katılım`} />
                        <MetrikRow label="Namaz Buluşması"    value={n(f.ls_namazSayisi)}       sub={`${n(f.ls_namazKatilim)} katılım`} />
                        <MetrikRow label="Kafile"             value={n(f.ls_kafileSayisi)}      sub={`${n(f.ls_kafileOgrenci)} öğrenci`} />
                      </div>
                    </div>
                  </BirimSection>

                  {/* ÜNİVERSİTE */}
                  <BirimSection title="🎯 Üniversite Birimi" color="#7C3AED">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Öğrenci ve Dergâh</p>
                        <MetrikRow label="Toplam Dergâh" value={n(f.uni_toplamDergah)} bold />
                        <MetrikRow label="İlim/Sohbet Yapılan Dergâh" value={n(f.uni_ilimSohbetDergah)} />
                        <MetrikRow label="Toplam Üniversite Öğrenci" value={n(f.uni_universiteliOgrenciSayisi)} />
                        <MetrikRow label="Son Sınıf Öğrenci" value={n(f.uni_sonSinifOgrenci)} />
                        <MetrikRow label="Aktif Kulüp" value={n(f.uni_aktifKulup)} />
                        <MetrikRow label="Yeni İntisap" value={n(f.uni_yeniIntisap)} bold />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Faaliyetler (sayı · katılan)</p>
                        <MetrikRow label="İlim / Sohbet"      value={n(f.uni_ilimSohbetSayisi)} sub={`${n(f.uni_ilimSohbetKatilim)} katılım`} />
                        <MetrikRow label="Kulüp"              value={n(f.uni_kulupSayisi)}      sub={`${n(f.uni_kulupKatilim)} katılım`} />
                        <MetrikRow label="Sosyal"             value={n(f.uni_sosyalSayisi)}     sub={`${n(f.uni_sosyalKatilim)} katılım`} />
                        <MetrikRow label="Sosyal Sorumluluk"  value={n(f.uni_sorumlulukSayisi)} sub={`${n(f.uni_sorumlulukKatilim)} katılım`} />
                        <MetrikRow label="Muhabbet"           value={n(f.uni_muhabbetSayisi)}   sub={`${n(f.uni_muhabbetKatilim)} katılım`} />
                        <MetrikRow label="Namaz Buluşması"    value={n(f.uni_namazSayisi)}      sub={`${n(f.uni_namazKatilim)} katılım`} />
                        <MetrikRow label="Kafile"             value={n(f.uni_kafileSayisi)}     sub={`${n(f.uni_kafileOgrenci)} öğrenci`} />
                        <MetrikRow label="KYK Buluşması"      value={n(f.uni_kykBulusmaSayisi)} sub={`${n(f.uni_kykKatilim)} katılım`} />
                      </div>
                    </div>
                  </BirimSection>

                  {/* ORTAK FAALİYETLER */}
                  <BirimSection title="🤝 Ortak Faaliyetler (Lise + Üniversite birlikte)" color="#B45309">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Kafile</p>
                        <MetrikRow label="Ortak Kafile" value={n(f.ortakKafileSayisi)} bold />
                        <MetrikRow label="Katılan Liseli" value={n(f.ortakKafileLiseKatilim)} />
                        <MetrikRow label="Katılan Üniversiteli" value={n(f.ortakKafileUniKatilim)} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Sabah Namazı</p>
                        <MetrikRow label="Ortak Sabah Namazı" value={n(f.ortakSabahNamaziSayisi)} bold />
                        <MetrikRow label="Katılan Liseli" value={n(f.ortakSabahNamaziLiseKatilim)} />
                        <MetrikRow label="Katılan Üniversiteli" value={n(f.ortakSabahNamaziUniKatilim)} />
                      </div>
                    </div>
                  </BirimSection>

                  {/* İL GENELİ TOPLAM (Lise + Üniversite + Ortak) */}
                  <BirimSection title="🧮 İl Geneli Toplam (Lise + Üniversite + Ortak)" color="#0B6B3A">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          label: "Toplam Kafile",
                          ls: n(f.ls_kafileSayisi), uni: n(f.uni_kafileSayisi), ortak: n(f.ortakKafileSayisi),
                        },
                        {
                          label: "Toplam Namaz Buluşması",
                          ls: n(f.ls_namazSayisi), uni: n(f.uni_namazSayisi), ortak: n(f.ortakSabahNamaziSayisi),
                        },
                      ].map(c => (
                        <div key={c.label} className="rounded-2xl border p-4"
                          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{c.label}</p>
                          <p className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>{c.ls + c.uni + c.ortak}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            Lise {c.ls} · Üniversite {c.uni} · Ortak {c.ortak}
                          </p>
                        </div>
                      ))}
                    </div>
                  </BirimSection>

                </div>
              )}
            </>
          )}

          {/* ══ DÖNEM KARŞILAŞTIRMASI ══ */}
          {tab === "karsilastir" && (
            <div className="space-y-5">
              {donemler.length < 2 ? (
                <div className="sv-section p-10 text-center">
                  <p style={{ color: "var(--text-muted)" }}>
                    Karşılaştırma için {selectedYil} yılına ait en az 2 dönem verisi gereklidir.
                  </p>
                </div>
              ) : (
                <>
                  {/* Dönem çiftleri */}
                  {donemler.slice(0, -1).map((d, i) => {
                    const d1 = donemMap.get(`${selectedYil}-${d}`)!;
                    const d2 = donemMap.get(`${selectedYil}-${donemler[i + 1]}`)!;
                    return (
                      <div key={d} className="sv-section overflow-hidden">
                        <div className="px-5 py-3 flex items-center gap-3 border-b"
                          style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
                          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {DONEM_LABEL[d]} → {DONEM_LABEL[donemler[i + 1]]}
                          </span>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">

                          {/* İlköğretim */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#006B3F" }}>
                              📚 İlköğretim
                            </p>
                            <Delta
                              label="Kurs Yaygınlığı %"
                              prev={pct(n(d1.ik_kursuYapilanDergah), n(d1.ik_toplamDergah))}
                              curr={pct(n(d2.ik_kursuYapilanDergah), n(d2.ik_toplamDergah))}
                            />
                            <Delta
                              label="Toplam Öğrenci"
                              prev={n(d1.ik_elifBaOgrenci) + n(d1.ik_kuranOgrenci)}
                              curr={n(d2.ik_elifBaOgrenci) + n(d2.ik_kuranOgrenci)}
                            />
                            <Delta
                              label="Kur'an'a Geçen"
                              prev={n(d1.ik_gecisOgrenci)}
                              curr={n(d2.ik_gecisOgrenci)}
                            />
                          </div>

                          {/* Lise */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#0369A1" }}>
                              🎓 Lise
                            </p>
                            <Delta
                              label="İlim/Sohbet Dergâh Yaygınlığı %"
                              prev={pct(n(d1.ls_ilimSohbetDergah), n(d1.ls_toplamDergah))}
                              curr={pct(n(d2.ls_ilimSohbetDergah), n(d2.ls_toplamDergah))}
                            />
                            <Delta label="İlim/Sohbet Katılım" prev={n(d1.ls_ilimSohbetKatilim)} curr={n(d2.ls_ilimSohbetKatilim)} />
                            <Delta label="Kafile"     prev={n(d1.ls_kafileSayisi)}    curr={n(d2.ls_kafileSayisi)} />
                            <Delta label="Yeni İntisap" prev={n(d1.ls_yeniIntisap)}  curr={n(d2.ls_yeniIntisap)} />
                          </div>

                          {/* Üniversite */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#7C3AED" }}>
                              🎯 Üniversite
                            </p>
                            <Delta
                              label="İlim/Sohbet Dergâh Yaygınlığı %"
                              prev={pct(n(d1.uni_ilimSohbetDergah), n(d1.uni_toplamDergah))}
                              curr={pct(n(d2.uni_ilimSohbetDergah), n(d2.uni_toplamDergah))}
                            />
                            <Delta label="İlim/Sohbet Katılım" prev={n(d1.uni_ilimSohbetKatilim)} curr={n(d2.uni_ilimSohbetKatilim)} />
                            <Delta label="KYK Buluşma" prev={n(d1.uni_kykBulusmaSayisi)} curr={n(d2.uni_kykBulusmaSayisi)} />
                            <Delta label="Yeni İntisap" prev={n(d1.uni_yeniIntisap)}  curr={n(d2.uni_yeniIntisap)} />
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
