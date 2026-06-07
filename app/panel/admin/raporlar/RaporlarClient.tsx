"use client";

import { useState, useMemo } from "react";

/* ── Types ── */
interface Activity {
  id: string; yil: number; donem: string;
  ik_toplamDergah: number; ik_kursuYapilanDergah: number;
  ik_egitmenSayisi: number; ik_egitmenYardimciSayisi: number;
  ik_elifBaOgrenci: number; ik_kuranOgrenci: number; ik_gecisOgrenci: number;
  ls_toplamDergah: number; ls_ilimDersYeri: number; ls_ilimDersKatilim: number;
  ls_sabahNamaziSayisi: number; ls_sabahNamaziKatilim: number;
  ls_kafileSayisi: number; ls_kafileOgrenci: number;
  ls_toplamFaaliyet: number; ls_yeniIntisap: number;
  uni_toplamDergah: number; uni_ilimDersYeri: number; uni_ilimDersKatilim: number;
  uni_sabahNamaziSayisi: number; uni_sabahNamaziKatilim: number;
  uni_kafileSayisi: number; uni_kafileOgrenci: number;
  uni_toplamFaaliyet: number; uni_kykBulusmaSayisi: number;
  uni_kykKatilim: number; uni_yeniIntisap: number;
  eay_mevcutEv: number; eay_mevcutApart: number; eay_mevcutYurt: number;
  eay_acilacakEv: number; eay_acilacakApart: number; eay_acilacakYurt: number;
  eay_kapanacakEv: number; eay_kapanacakApart: number; eay_kapanacakYurt: number;
  eay_bursBalan: number; eay_iliskiKesme: number; eay_toplamZiyaret: number;
}
interface Il { id: string; ad: string; activities: Activity[] }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

interface Props { bolgeler: Bolge[]; yillar: number[] }

/* ── Constants ── */
const TABS = [
  { key: "genel",    label: "Türkiye Geneli" },
  { key: "ilk",     label: "İlköğretim Birimi" },
  { key: "lise",    label: "Lise Birimi" },
  { key: "uni",     label: "Üniversite Birimi" },
  { key: "eay",     label: "Öğrenci Ev/Apart/Yurt" },
] as const;
type TabKey = typeof TABS[number]["key"];

const BIRIMLER = [
  { key: "ilk",  label: "İlköğretim" },
  { key: "lise", label: "Lise" },
  { key: "uni",  label: "Üniversite" },
] as const;

const DONEMLER: Record<string, string[]> = {
  ilk:  ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
  lise: ["DONEM_1", "DONEM_2"],
  uni:  ["DONEM_1", "DONEM_2"],
};
const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

/* ── Helpers ── */
function n(v: number | null | undefined) { return v ?? 0; }
function fmt(v: number) { return v.toLocaleString("tr-TR"); }

function sum(acts: Activity[], field: keyof Activity): number {
  return acts.reduce((s, a) => s + n(a[field] as number), 0);
}

function filterActs(acts: Activity[], yil: number, donem: string) {
  return acts.filter(a => a.yil === yil && a.donem === donem);
}

/* ── Components ── */
function TabBar({ tabs, active, onChange }: {
  tabs: readonly { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl border" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
          style={active === t.key
            ? { background: "var(--green-primary)", color: "#fff", boxShadow: "0 2px 8px rgba(0,107,63,0.25)" }
            : { color: "var(--text-muted)" }
          }>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${center ? "text-center" : "text-left"}`}
      style={{ color: "var(--text-muted)", background: "var(--bg-th)" }}>
      {children}
    </th>
  );
}
function Td({ children, center, bold }: { children: React.ReactNode; center?: boolean; bold?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-sm ${center ? "text-center" : "text-left"} ${bold ? "font-bold" : "font-medium"}`}
      style={{ color: bold ? "var(--text-primary)" : "var(--text-secondary)" }}>
      {children}
    </td>
  );
}

/* ══════════════════════════════════════
   TÜRKIYE GENELİ SEKMESİ
══════════════════════════════════════ */
function GenelTab({ bolgeler, yillar }: { bolgeler: Bolge[]; yillar: number[] }) {
  const thisYear = new Date().getFullYear();
  const [yil, setYil] = useState(String(yillar[0] ?? thisYear));
  const [birim, setBirim] = useState<"ilk" | "lise" | "uni">("ilk");
  const [donem, setDonem] = useState("DONEM_1");

  // Dönem seçenekleri birime göre
  const donemOps = DONEMLER[birim].map(d => ({ value: d, label: DONEM_LABEL[d] }));

  // Aktif dönem birim değişince reset
  function handleBirim(b: "ilk" | "lise" | "uni") {
    setBirim(b);
    setDonem(DONEMLER[b][0]);
  }

  const tumIller = bolgeler.flatMap(b => b.iller);

  // Seçili yıl+dönem için tüm iller
  const filteredActs = (il: Il) => filterActs(il.activities, Number(yil), donem);

  /* Sütunlar birime göre */
  const cols = birim === "ilk" ? [
    { label: "Toplam Dergah", fn: (a: Activity[]) => sum(a, "ik_toplamDergah") },
    { label: "Kurs Yapılan", fn: (a: Activity[]) => sum(a, "ik_kursuYapilanDergah") },
    { label: "Eğitmen", fn: (a: Activity[]) => sum(a, "ik_egitmenSayisi") },
    { label: "Eğt. Yard.", fn: (a: Activity[]) => sum(a, "ik_egitmenYardimciSayisi") },
    { label: "Elif-Ba Öğr.", fn: (a: Activity[]) => sum(a, "ik_elifBaOgrenci") },
    { label: "Kuran Öğr.", fn: (a: Activity[]) => sum(a, "ik_kuranOgrenci") },
    { label: "Geçiş Öğr.", fn: (a: Activity[]) => sum(a, "ik_gecisOgrenci") },
  ] : birim === "lise" ? [
    { label: "Toplam Dergah", fn: (a: Activity[]) => sum(a, "ls_toplamDergah") },
    { label: "İlim Ders Yeri", fn: (a: Activity[]) => sum(a, "ls_ilimDersYeri") },
    { label: "İlim Ders Katılım", fn: (a: Activity[]) => sum(a, "ls_ilimDersKatilim") },
    { label: "Sabah Namazı", fn: (a: Activity[]) => sum(a, "ls_sabahNamaziSayisi") },
    { label: "SN Katılım", fn: (a: Activity[]) => sum(a, "ls_sabahNamaziKatilim") },
    { label: "Kafile", fn: (a: Activity[]) => sum(a, "ls_kafileSayisi") },
    { label: "Kafile Öğr.", fn: (a: Activity[]) => sum(a, "ls_kafileOgrenci") },
    { label: "Toplam Faaliyet", fn: (a: Activity[]) => sum(a, "ls_toplamFaaliyet") },
    { label: "Yeni İntisap", fn: (a: Activity[]) => sum(a, "ls_yeniIntisap") },
  ] : [
    { label: "Toplam Dergah", fn: (a: Activity[]) => sum(a, "uni_toplamDergah") },
    { label: "İlim Ders Yeri", fn: (a: Activity[]) => sum(a, "uni_ilimDersYeri") },
    { label: "İlim Ders Katılım", fn: (a: Activity[]) => sum(a, "uni_ilimDersKatilim") },
    { label: "Sabah Namazı", fn: (a: Activity[]) => sum(a, "uni_sabahNamaziSayisi") },
    { label: "SN Katılım", fn: (a: Activity[]) => sum(a, "uni_sabahNamaziKatilim") },
    { label: "Kafile", fn: (a: Activity[]) => sum(a, "uni_kafileSayisi") },
    { label: "Kafile Öğr.", fn: (a: Activity[]) => sum(a, "uni_kafileOgrenci") },
    { label: "Toplam Faaliyet", fn: (a: Activity[]) => sum(a, "uni_toplamFaaliyet") },
    { label: "KYK Buluşma", fn: (a: Activity[]) => sum(a, "uni_kykBulusmaSayisi") },
    { label: "KYK Katılım", fn: (a: Activity[]) => sum(a, "uni_kykKatilim") },
    { label: "Yeni İntisap", fn: (a: Activity[]) => sum(a, "uni_yeniIntisap") },
  ];

  // Tüm iller toplam satırı
  const toplamActs = tumIller.flatMap(il => filteredActs(il));

  return (
    <div className="space-y-5">
      {/* Filtreler */}
      <div className="sv-section p-4 flex flex-wrap gap-4 items-center">
        <Select label="Yıl"
          value={yil}
          options={yillar.map(y => ({ value: String(y), label: String(y) }))}
          onChange={setYil}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Birim:</span>
          <div className="flex gap-1">
            {BIRIMLER.map(b => (
              <button key={b.key} onClick={() => handleBirim(b.key as "ilk" | "lise" | "uni")}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition"
                style={birim === b.key
                  ? { background: "var(--green-primary)", color: "#fff", borderColor: "var(--green-primary)" }
                  : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" }
                }>
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <Select label="Dönem"
          value={donem}
          options={donemOps}
          onChange={setDonem}
        />
      </div>

      {/* Tablo */}
      <div className="sv-section overflow-x-auto">
        <div className="sv-section-header">
          <h2>{yil} / {DONEM_LABEL[donem]} — Türkiye Geneli</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
            {toplamActs.length} il
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              <Th>Bölge</Th>
              <Th>İl</Th>
              {cols.map(c => <Th key={c.label} center>{c.label}</Th>)}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {bolgeler.map(bolge => {
              const bolgeActs = bolge.iller.flatMap(il => filteredActs(il));
              const rows = bolge.iller.map(il => ({
                il,
                acts: filteredActs(il),
              })).filter(r => r.acts.length > 0);

              if (rows.length === 0) return null;

              return rows.map((r, idx) => (
                <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                  {idx === 0 && (
                    <td rowSpan={rows.length} className="px-3 py-2.5 font-bold text-sm align-top border-r"
                      style={{ color: "var(--green-primary)", borderColor: "var(--border)", verticalAlign: "middle" }}>
                      {bolge.no}. Bölge
                    </td>
                  )}
                  <Td>{r.il.ad}</Td>
                  {cols.map(c => <Td key={c.label} center>{fmt(c.fn(r.acts))}</Td>)}
                </tr>
              ));
            })}
            {/* Genel Toplam */}
            <tr style={{ background: "var(--green-light)" }}>
              <Td bold>Türkiye</Td>
              <Td bold>Toplam</Td>
              {cols.map(c => (
                <td key={c.label} className="px-3 py-2.5 text-center text-sm font-black"
                  style={{ color: "var(--green-primary)" }}>
                  {fmt(c.fn(toplamActs))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BİRİM SEKMELERİ (İlk / Lise / Üni / EAY)
══════════════════════════════════════ */
interface BirimTabProps {
  bolgeler: Bolge[];
  yillar: number[];
  birim: "ilk" | "lise" | "uni" | "eay";
}

function BirimTab({ bolgeler, yillar, birim }: BirimTabProps) {
  const thisYear = new Date().getFullYear();
  const [yil, setYil] = useState(String(yillar[0] ?? thisYear));

  const donemList = birim === "ilk" ? ["DONEM_1", "DONEM_2", "YAZ_DONEMI"] : ["DONEM_1", "DONEM_2"];

  const ikCols = [
    { label: "Toplam Dergah", field: "ik_toplamDergah" as keyof Activity },
    { label: "Kurs Yapılan", field: "ik_kursuYapilanDergah" as keyof Activity },
    { label: "Eğitmen", field: "ik_egitmenSayisi" as keyof Activity },
    { label: "Elif-Ba", field: "ik_elifBaOgrenci" as keyof Activity },
    { label: "Kuran Öğr.", field: "ik_kuranOgrenci" as keyof Activity },
    { label: "Geçiş Öğr.", field: "ik_gecisOgrenci" as keyof Activity },
  ];
  const lsCols = [
    { label: "Toplam Dergah", field: "ls_toplamDergah" as keyof Activity },
    { label: "İlim Ders Yeri", field: "ls_ilimDersYeri" as keyof Activity },
    { label: "Ders Katılım", field: "ls_ilimDersKatilim" as keyof Activity },
    { label: "Sabah Namazı", field: "ls_sabahNamaziSayisi" as keyof Activity },
    { label: "SN Katılım", field: "ls_sabahNamaziKatilim" as keyof Activity },
    { label: "Kafile", field: "ls_kafileSayisi" as keyof Activity },
    { label: "Kafile Öğr.", field: "ls_kafileOgrenci" as keyof Activity },
    { label: "Top. Faaliyet", field: "ls_toplamFaaliyet" as keyof Activity },
    { label: "Yeni İntisap", field: "ls_yeniIntisap" as keyof Activity },
  ];
  const uniCols = [
    { label: "Toplam Dergah", field: "uni_toplamDergah" as keyof Activity },
    { label: "İlim Ders Yeri", field: "uni_ilimDersYeri" as keyof Activity },
    { label: "Ders Katılım", field: "uni_ilimDersKatilim" as keyof Activity },
    { label: "Sabah Namazı", field: "uni_sabahNamaziSayisi" as keyof Activity },
    { label: "SN Katılım", field: "uni_sabahNamaziKatilim" as keyof Activity },
    { label: "Kafile", field: "uni_kafileSayisi" as keyof Activity },
    { label: "Kafile Öğr.", field: "uni_kafileOgrenci" as keyof Activity },
    { label: "Top. Faaliyet", field: "uni_toplamFaaliyet" as keyof Activity },
    { label: "KYK Buluşma", field: "uni_kykBulusmaSayisi" as keyof Activity },
    { label: "KYK Katılım", field: "uni_kykKatilim" as keyof Activity },
    { label: "Yeni İntisap", field: "uni_yeniIntisap" as keyof Activity },
  ];
  const eayCols = [
    { label: "Mevcut Ev", field: "eay_mevcutEv" as keyof Activity },
    { label: "Mevcut Apart", field: "eay_mevcutApart" as keyof Activity },
    { label: "Mevcut Yurt", field: "eay_mevcutYurt" as keyof Activity },
    { label: "Açılacak Apart", field: "eay_acilacakApart" as keyof Activity },
    { label: "Açılacak Yurt", field: "eay_acilacakYurt" as keyof Activity },
    { label: "Kapanacak Apart", field: "eay_kapanacakApart" as keyof Activity },
    { label: "Kapanacak Yurt", field: "eay_kapanacakYurt" as keyof Activity },
    { label: "Burs Balan.", field: "eay_bursBalan" as keyof Activity },
    { label: "İliş. Kesme", field: "eay_iliskiKesme" as keyof Activity },
    { label: "Top. Ziyaret", field: "eay_toplamZiyaret" as keyof Activity },
  ];

  const cols = birim === "ilk" ? ikCols : birim === "lise" ? lsCols : birim === "uni" ? uniCols : eayCols;

  return (
    <div className="space-y-5">
      {/* Filtre */}
      <div className="sv-section p-4 flex gap-4 items-center">
        <Select label="Yıl"
          value={yil}
          options={yillar.map(y => ({ value: String(y), label: String(y) }))}
          onChange={setYil}
        />
      </div>

      {/* Her dönem için ayrı tablo */}
      {donemList.map(donem => {
        const tumIlActs = bolgeler.flatMap(b =>
          b.iller.map(il => ({ il, bolge: b, acts: filterActs(il.activities, Number(yil), donem) }))
        );
        const herhangiVeri = tumIlActs.some(r => r.acts.length > 0);

        return (
          <div key={donem} className="sv-section overflow-x-auto">
            <div className="sv-section-header">
              <h2>{DONEM_LABEL[donem]}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--green-light)", color: "var(--green-primary)" }}>
                {tumIlActs.filter(r => r.acts.length > 0).length} il
              </span>
            </div>

            {!herhangiVeri ? (
              <p className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Bu dönem için henüz veri girilmemiş.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Bölge</Th>
                    <Th>İl</Th>
                    {cols.map(c => <Th key={c.label} center>{c.label}</Th>)}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {bolgeler.map(bolge => {
                    const rows = bolge.iller.map(il => ({
                      il,
                      acts: filterActs(il.activities, Number(yil), donem),
                    }));
                    const hasData = rows.some(r => r.acts.length > 0);
                    if (!hasData) return null;

                    // Bölge toplamı
                    const bolgeActs = rows.flatMap(r => r.acts);

                    return [
                      /* İl satırları */
                      ...rows.map((r, idx) => {
                        const isFirst = idx === rows.findIndex(rr => rr.acts.length > 0);
                        const rowCount = rows.filter(rr => rr.acts.length > 0).length;
                        if (r.acts.length === 0) return null;
                        return (
                          <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                            {isFirst && (
                              <td rowSpan={rowCount + 1}
                                className="px-3 py-2.5 text-sm font-bold border-r align-top"
                                style={{ color: "var(--green-primary)", borderColor: "var(--border)", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                                {bolge.no}. Bölge
                              </td>
                            )}
                            <Td>{r.il.ad}</Td>
                            {cols.map(c => <Td key={c.label} center>{fmt(n(r.acts[0]?.[c.field] as number))}</Td>)}
                          </tr>
                        );
                      }).filter(Boolean),
                      /* Bölge toplam satırı */
                      <tr key={`${bolge.id}-top`}
                        style={{ background: "var(--bg-th)" }}>
                        <td className="px-3 py-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                          Bölge Toplamı
                        </td>
                        {cols.map(c => (
                          <td key={c.label} className="px-3 py-2 text-center text-xs font-bold"
                            style={{ color: "var(--green-primary)" }}>
                            {fmt(sum(bolgeActs, c.field))}
                          </td>
                        ))}
                      </tr>,
                    ];
                  })}

                  {/* Türkiye Toplamı */}
                  <tr style={{ background: "var(--green-light)" }}>
                    <td colSpan={2} className="px-3 py-2.5 text-sm font-black"
                      style={{ color: "var(--green-primary)" }}>
                      🇹🇷 Türkiye Toplamı
                    </td>
                    {cols.map(c => {
                      const total = sum(
                        bolgeler.flatMap(b => b.iller.flatMap(il => filterActs(il.activities, Number(yil), donem))),
                        c.field
                      );
                      return (
                        <td key={c.label} className="px-3 py-2.5 text-center text-sm font-black"
                          style={{ color: "var(--green-primary)" }}>
                          {fmt(total)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════
   ANA COMPONENT
══════════════════════════════════════ */
export function RaporlarClient({ bolgeler, yillar }: Props) {
  const [tab, setTab] = useState<TabKey>("genel");

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="sv-page-header">
        <h1>Raporlar</h1>
        <p>Türkiye geneli faaliyet ve barınma verileri</p>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={k => setTab(k as TabKey)} />

      <div>
        {tab === "genel" && <GenelTab bolgeler={bolgeler} yillar={yillar} />}
        {tab === "ilk"  && <BirimTab bolgeler={bolgeler} yillar={yillar} birim="ilk" />}
        {tab === "lise" && <BirimTab bolgeler={bolgeler} yillar={yillar} birim="lise" />}
        {tab === "uni"  && <BirimTab bolgeler={bolgeler} yillar={yillar} birim="uni" />}
        {tab === "eay"  && <BirimTab bolgeler={bolgeler} yillar={yillar} birim="eay" />}
      </div>
    </div>
  );
}
