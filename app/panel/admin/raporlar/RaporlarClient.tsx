"use client";

import { useState, useMemo } from "react";
import { ExportButtons } from "@/components/ui/ExportButtons";

/* ── Types ── */
interface Activity {
  id: string; yil: number; donem: string;
  ik_toplamDergah: number; ik_kursuYapilanDergah: number;
  ik_egitmenSayisi: number; ik_egitmenYardimciSayisi: number;
  ik_elifBaOgrenci: number; ik_kuranOgrenci: number; ik_gecisOgrenci: number;
  ls_toplamDergah: number; ls_liseliOgrenciSayisi: number; ls_yeniIntisap: number;
  ls_kafileSayisi: number; ls_kafileOgrenci: number;
  ls_ilimSohbetDergah: number; ls_mezunOgrenci: number;
  ls_ilimSohbetSayisi: number; ls_ilimSohbetKatilim: number;
  ls_sosyalSayisi: number; ls_sosyalKatilim: number;
  ls_sorumlulukSayisi: number; ls_sorumlulukKatilim: number;
  ls_muhabbetSayisi: number; ls_muhabbetKatilim: number;
  ls_namazSayisi: number; ls_namazKatilim: number;
  uni_toplamDergah: number; uni_universiteliOgrenciSayisi: number; uni_yeniIntisap: number;
  uni_kafileSayisi: number; uni_kafileOgrenci: number;
  uni_kykBulusmaSayisi: number; uni_kykKatilim: number;
  uni_ilimSohbetDergah: number; uni_sonSinifOgrenci: number; uni_aktifKulup: number;
  uni_ilimSohbetSayisi: number; uni_ilimSohbetKatilim: number;
  uni_kulupSayisi: number; uni_kulupKatilim: number;
  uni_sosyalSayisi: number; uni_sosyalKatilim: number;
  uni_sorumlulukSayisi: number; uni_sorumlulukKatilim: number;
  uni_muhabbetSayisi: number; uni_muhabbetKatilim: number;
  uni_namazSayisi: number; uni_namazKatilim: number;
  ortakKafileSayisi: number; ortakKafileLiseKatilim: number; ortakKafileUniKatilim: number;
  ortakSabahNamaziSayisi: number; ortakSabahNamaziLiseKatilim: number; ortakSabahNamaziUniKatilim: number;
  eay_mevcutEv: number; eay_mevcutApart: number; eay_mevcutYurt: number;
  eay_acilacakEv: number; eay_acilacakApart: number; eay_acilacakYurt: number;
  eay_kapanacakEv: number; eay_kapanacakApart: number; eay_kapanacakYurt: number;
  eay_bursBalan: number; eay_iliskiKesme: number; eay_toplamZiyaret: number;
}
interface Il    { id: string; ad: string; activities: Activity[] }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

interface Props {
  sistem: string;
  bolgeler: Bolge[];
  yillar: number[];
}

/* ── Constants ── */
const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

const SISTEM_INFO: Record<string, { title: string; color: string }> = {
  EGITIMCI:   { title: "Eğitimci Sistemi",          color: "#0B6B3A" },
  UNIVERSITE: { title: "Üniversite Gençlik Sistemi", color: "#1D4ED8" },
  LISE:       { title: "Lise Gençlik Sistemi",       color: "#7C3AED" },
};

// Eğitimci sistem sekmeleri (5 birim)
const EGITIMCI_TABS = [
  { key: "uni",   label: "Üniversite Birimi" },
  { key: "lise",  label: "Lise Birimi" },
  { key: "ilk",   label: "İlköğretim Birimi" },
  { key: "ortak", label: "Ortak Faaliyetler" },
  { key: "eay",   label: "Ev / Apart / Yurt" },
] as const;

const UNIVERSITE_TABS = [
  { key: "uni", label: "Üniversite Birimi" },
  { key: "eay", label: "Ev / Apart / Yurt" },
] as const;

const LISE_TABS = [
  { key: "lise", label: "Lise Birimi" },
  { key: "eay",  label: "Ev / Apart / Yurt" },
] as const;

/* ── Görüntüleme boyutları (Kapsam / Scope) ── */
type Scope = "turkey" | "region" | "province";
const SCOPE_OPTS: { key: Scope; label: string }[] = [
  { key: "turkey",   label: "Türkiye" },
  { key: "region",   label: "Bölge" },
  { key: "province", label: "İl" },
];
type SortDir = null | "asc" | "desc";

/* ── Helpers ── */
const n = (v: number | null | undefined) => v ?? 0;
// Sayıyı olduğu gibi gösterir (gerçek 0 → "0"). Veri yokluğu için DASH ayrı kullanılır.
const DASH = "–";
const fmtNum = (v: number) => v.toLocaleString("tr-TR");
function sum(acts: Activity[], field: keyof Activity): number {
  return acts.reduce((s, a) => s + n(a[field] as number), 0);
}
function filterActs(acts: Activity[], yil: number, donem: string) {
  return acts.filter(a => a.yil === yil && a.donem === donem);
}
// Bir bölgenin (seçili yıl/dönem) tüm il kayıtları
function regionActs(b: Bolge, yil: number, donem: string): Activity[] {
  return b.iller.flatMap(il => filterActs(il.activities, yil, donem));
}
// Bir satırın "faaliyet hacmi" (sıralama için): gösterilen tüm sütunların toplamı
function rowTotal(acts: Activity[], cols: { field: keyof Activity }[]): number {
  return cols.reduce((s, c) => s + sum(acts, c.field), 0);
}

/* ── Column defs ── */
const IK_COLS: { label: string; field: keyof Activity }[] = [
  { label: "Toplam Dergah",    field: "ik_toplamDergah" },
  { label: "Kurs Yapılan",     field: "ik_kursuYapilanDergah" },
  { label: "Eğitmen",          field: "ik_egitmenSayisi" },
  { label: "Eğt. Yardımcı",   field: "ik_egitmenYardimciSayisi" },
  { label: "Elif-Ba Öğr.",     field: "ik_elifBaOgrenci" },
  { label: "Kuran Öğr.",       field: "ik_kuranOgrenci" },
  { label: "Geçiş Öğr.",      field: "ik_gecisOgrenci" },
];
const LS_COLS: { label: string; field: keyof Activity }[] = [
  { label: "Toplam Dergâh",       field: "ls_toplamDergah" },
  { label: "İlim/Sohbet Dergâh",  field: "ls_ilimSohbetDergah" },
  { label: "Liseli Öğrenci",      field: "ls_liseliOgrenciSayisi" },
  { label: "Mezun Olacak",        field: "ls_mezunOgrenci" },
  { label: "Yeni İntisap",        field: "ls_yeniIntisap" },
  { label: "İlim/Sohbet",         field: "ls_ilimSohbetSayisi" },
  { label: "İlim/Sohbet Kat.",    field: "ls_ilimSohbetKatilim" },
  { label: "Sosyal",              field: "ls_sosyalSayisi" },
  { label: "Sosyal Kat.",         field: "ls_sosyalKatilim" },
  { label: "Sos. Sorumluluk",     field: "ls_sorumlulukSayisi" },
  { label: "Sos. Sor. Kat.",      field: "ls_sorumlulukKatilim" },
  { label: "Muhabbet",            field: "ls_muhabbetSayisi" },
  { label: "Muhabbet Kat.",       field: "ls_muhabbetKatilim" },
  { label: "Namaz",               field: "ls_namazSayisi" },
  { label: "Namaz Kat.",          field: "ls_namazKatilim" },
  { label: "Kafile",              field: "ls_kafileSayisi" },
  { label: "Kafile Öğr.",         field: "ls_kafileOgrenci" },
];
const UNI_COLS: { label: string; field: keyof Activity }[] = [
  { label: "Toplam Dergâh",       field: "uni_toplamDergah" },
  { label: "İlim/Sohbet Dergâh",  field: "uni_ilimSohbetDergah" },
  { label: "Üni. Öğrenci",        field: "uni_universiteliOgrenciSayisi" },
  { label: "Son Sınıf",           field: "uni_sonSinifOgrenci" },
  { label: "Aktif Kulüp",         field: "uni_aktifKulup" },
  { label: "Yeni İntisap",        field: "uni_yeniIntisap" },
  { label: "İlim/Sohbet",         field: "uni_ilimSohbetSayisi" },
  { label: "İlim/Sohbet Kat.",    field: "uni_ilimSohbetKatilim" },
  { label: "Kulüp",               field: "uni_kulupSayisi" },
  { label: "Kulüp Kat.",          field: "uni_kulupKatilim" },
  { label: "Sosyal",              field: "uni_sosyalSayisi" },
  { label: "Sosyal Kat.",         field: "uni_sosyalKatilim" },
  { label: "Sos. Sorumluluk",     field: "uni_sorumlulukSayisi" },
  { label: "Sos. Sor. Kat.",      field: "uni_sorumlulukKatilim" },
  { label: "Muhabbet",            field: "uni_muhabbetSayisi" },
  { label: "Muhabbet Kat.",       field: "uni_muhabbetKatilim" },
  { label: "Namaz",               field: "uni_namazSayisi" },
  { label: "Namaz Kat.",          field: "uni_namazKatilim" },
  { label: "Kafile",              field: "uni_kafileSayisi" },
  { label: "Kafile Öğr.",         field: "uni_kafileOgrenci" },
  { label: "KYK Buluşma",         field: "uni_kykBulusmaSayisi" },
  { label: "KYK Katılım",         field: "uni_kykKatilim" },
];
// Ortak Faaliyetler (lise + üniversite birlikte)
const ORTAK_COLS: { label: string; field: keyof Activity }[] = [
  { label: "Kafile",           field: "ortakKafileSayisi" },
  { label: "Kafile Liseli",    field: "ortakKafileLiseKatilim" },
  { label: "Kafile Üni.",      field: "ortakKafileUniKatilim" },
  { label: "Sabah Namazı",     field: "ortakSabahNamaziSayisi" },
  { label: "SN Liseli",        field: "ortakSabahNamaziLiseKatilim" },
  { label: "SN Üni.",          field: "ortakSabahNamaziUniKatilim" },
];

/* ── UI Atoms ── */
function Th({ children, center, span, sticky, wrap }: { children: React.ReactNode; center?: boolean; span?: number; sticky?: boolean; wrap?: boolean }) {
  return (
    <th
      colSpan={span}
      className={`px-2 py-2 text-[10px] font-bold uppercase tracking-wide border ${wrap ? "leading-[1.2] align-bottom" : "whitespace-nowrap"} ${center ? "text-center" : "text-left"}`}
      style={{
        color: "var(--text-muted)", background: "var(--bg-th)", borderColor: "var(--border)",
        ...(wrap ? { maxWidth: 52, minWidth: 44, whiteSpace: "normal" } : {}),
        ...(sticky ? { position: "sticky", top: 0, zIndex: 2 } : {}),
      }}
    >
      {children}
    </th>
  );
}
function Td({ children, center, bold, green }: { children: React.ReactNode; center?: boolean; bold?: boolean; green?: boolean }) {
  return (
    <td
      className={`px-2 py-2 text-[13px] border ${center ? "text-center" : "text-left"} ${bold ? "font-bold" : "font-medium"}`}
      style={{
        color: green ? "var(--green-primary)" : bold ? "var(--text-primary)" : "var(--text-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {children}
    </td>
  );
}

/* Sayı hücresi — veri yoksa soluk "–", varsa gerçek değer (0 dahil) */
function numTd(
  key: React.Key,
  acts: Activity[],
  field: keyof Activity,
  opts?: { color?: string; weight?: 0 | 1 | 2 },
) {
  const empty = acts.length === 0;
  const txt = empty ? DASH : fmtNum(sum(acts, field));
  const weight = opts?.weight ?? 0;
  return (
    <td
      key={key}
      className="px-2 py-2 text-[13px] text-center border"
      style={{
        color: empty ? "var(--text-muted)" : (opts?.color ?? "var(--text-secondary)"),
        opacity: empty ? 0.45 : 1,
        borderColor: "var(--border)",
        fontWeight: weight === 2 ? 800 : weight === 1 ? 700 : 500,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {txt}
    </td>
  );
}

/* ── Kapsam (Scope) segmentli kontrolü ── */
function ScopeToggle({ scope, onScope, color }: { scope: Scope; onScope: (s: Scope) => void; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Kapsam</span>
      <div className="flex gap-1 p-1 rounded-lg border" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        {SCOPE_OPTS.map(s => (
          <button key={s.key}
            onClick={() => onScope(s.key)}
            className="px-3 py-1 rounded-md text-sm font-semibold transition-all"
            style={scope === s.key
              ? { background: color, color: "#fff", boxShadow: `0 1px 4px ${color}40` }
              : { color: "var(--text-muted)" }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Çoklu bölge seçici (açılır + arama + tümünü seç) ── */
function MultiRegionSelect({ bolgeler, selected, onChange, color }: {
  bolgeler: { id: string; no: number }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const allIds = bolgeler.map(b => b.id);
  const isAll = selected.length === 0;
  const label = isAll ? "Tüm Bölgeler" : `${selected.length} Bölge`;

  function toggle(id: string) {
    const current = isAll ? allIds : selected;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    if (next.length === 0 || next.length === allIds.length) onChange([]);
    else onChange(next);
  }
  const filtered = bolgeler.filter(b => String(b.no).includes(q.trim()));

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Bölge</span>
      <button
        onClick={() => setOpen(o => !o)}
        className="border rounded-lg px-3 py-1.5 text-sm font-semibold flex items-center gap-2 cursor-pointer"
        style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}
      >
        {label}
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-40 w-56 rounded-xl border shadow-lg p-2"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <input
              value={q} onChange={e => setQ(e.target.value)} placeholder="Bölge no ara…"
              className="w-full mb-2 px-2 py-1.5 text-sm rounded-lg border focus:outline-none"
              style={{ borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => onChange([])}
              className="w-full mb-1 px-2 py-1.5 text-xs font-bold rounded-lg transition"
              style={{ background: isAll ? color : "var(--bg-th)", color: isAll ? "#fff" : "var(--text-muted)" }}
            >
              Tümünü Seç
            </button>
            <div className="max-h-56 overflow-y-auto">
              {filtered.map(b => {
                const checked = isAll || selected.includes(b.id);
                return (
                  <label key={b.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[color:var(--bg-hover)] transition">
                    <input type="checkbox" checked={checked} onChange={() => toggle(b.id)} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{b.no}. Bölge</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Dönem çipleri + Sıralama hızlı butonu ── */
function DonemChips({ donem, donemler, onDonem, color }: {
  donem: string; donemler: string[]; onDonem: (d: string) => void; color: string;
}) {
  const chip = (active: boolean) => active
    ? { background: color, color: "#fff", borderColor: color }
    : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Dönem</span>
      <div className="flex gap-1">
        <button onClick={() => onDonem("TUM")} className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(donem === "TUM")}>Tümü</button>
        {donemler.map(d => (
          <button key={d} onClick={() => onDonem(d)} className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(donem === d)}>
            {DONEM_LABEL[d]}
          </button>
        ))}
      </div>
    </div>
  );
}

function SortQuick({ sortDir, onSort, color }: { sortDir: SortDir; onSort: (d: SortDir) => void; color: string }) {
  const chip = (active: boolean) => active
    ? { background: color, color: "#fff", borderColor: color }
    : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Sırala</span>
      <div className="flex gap-1">
        <button onClick={() => onSort(sortDir === "desc" ? null : "desc")} className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(sortDir === "desc")}>En Yüksek</button>
        <button onClick={() => onSort(sortDir === "asc" ? null : "asc")} className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition" style={chip(sortDir === "asc")}>En Düşük</button>
      </div>
    </div>
  );
}

/* ── Aktif filtre çipleri ── */
function FilterChips({ items, onClear }: { items: { id: string; label: string; onRemove: () => void }[]; onClear: () => void }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(it => (
        <span key={it.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{ background: "var(--bg-th)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>
          {it.label}
          <button onClick={it.onRemove} className="leading-none" style={{ opacity: 0.6 }} aria-label="Filtreyi kaldır">✕</button>
        </span>
      ))}
      <button onClick={onClear} className="text-xs font-bold underline" style={{ color: "var(--text-muted)" }}>
        Filtreleri Temizle
      </button>
    </div>
  );
}

/* Kapsam etiketi başlığı (Bölge / İl / Kapsam) */
function LabelHead({ scope }: { scope: Scope }) {
  if (scope === "province") return <><Th sticky>Bölge</Th><Th sticky>İl</Th></>;
  if (scope === "region") return <Th sticky>Bölge</Th>;
  return <Th sticky>Kapsam</Th>;
}

/* ══════════════════════════════════════
   BİRİM TABLO (ilk / lise / uni / ortak) — kapsam destekli
══════════════════════════════════════ */
function BirimTable({
  bolgeler, yil, donem, cols, color, scope, sortDir,
}: {
  bolgeler: Bolge[];
  yil: number;
  donem: string;
  cols: { label: string; field: keyof Activity }[];
  color: string;
  scope: Scope;
  sortDir: SortDir;
}) {
  const tumActs = bolgeler.flatMap(b => regionActs(b, yil, donem));
  const labelSpan = scope === "province" ? 2 : 1;
  const ilCount = bolgeler.flatMap(b => b.iller).filter(il => filterActs(il.activities, yil, donem).length > 0).length;

  const sortRegions = (arr: Bolge[]) =>
    sortDir ? [...arr].sort((a, b) => (rowTotal(regionActs(a, yil, donem), cols) - rowTotal(regionActs(b, yil, donem), cols)) * (sortDir === "asc" ? 1 : -1)) : arr;

  const turkeyRow = (
    <tr style={{ background: color + "12" }}>
      <td colSpan={labelSpan} className="px-2.5 py-2.5 text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
        🇹🇷 Türkiye Toplamı
      </td>
      {cols.map(c => numTd(c.label, tumActs, c.field, { color, weight: 2 }))}
    </tr>
  );

  return (
    <div className="sv-section sv-fade" style={{ overflowX: "auto" }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          {yil} / {DONEM_LABEL[donem]}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: color + "18", color }}>
          {ilCount} il
        </span>
      </div>
      <table className="w-max min-w-full text-sm">
        <thead>
          <tr>
            <LabelHead scope={scope} />
            {cols.map(c => <Th key={c.label} center sticky wrap>{c.label}</Th>)}
          </tr>
        </thead>
        <tbody>
          {/* TÜRKİYE GENELİ — tek satır */}
          {scope === "turkey" && turkeyRow}

          {/* BÖLGE BAZLI — her bölge bir satır */}
          {scope === "region" && (
            <>
              {sortRegions(bolgeler).map(bolge => {
                const acts = regionActs(bolge, yil, donem);
                return (
                  <tr key={bolge.id} className="hover:bg-[color:var(--bg-hover)] transition">
                    <Td bold><span style={{ color }}>{bolge.no}. Bölge</span></Td>
                    {cols.map(c => numTd(c.label, acts, c.field))}
                  </tr>
                );
              })}
              {turkeyRow}
            </>
          )}

          {/* İL BAZLI — bölge başlığı + iller + bölge ara toplamı */}
          {scope === "province" && (
            <>
              {sortRegions(bolgeler).map(bolge => {
                const ilRows0 = bolge.iller.map(il => ({ il, acts: filterActs(il.activities, yil, donem) }));
                const ilRows = sortDir
                  ? [...ilRows0].sort((a, b) => (rowTotal(a.acts, cols) - rowTotal(b.acts, cols)) * (sortDir === "asc" ? 1 : -1))
                  : ilRows0;
                const bolgeActs = ilRows.flatMap(r => r.acts);
                if (ilRows.length === 0) return null;
                return [
                  ...ilRows.map((r, idx) => (
                    <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                      {idx === 0 && (
                        <td rowSpan={ilRows.length + 1}
                          className="px-2.5 py-2 text-sm font-bold border align-middle whitespace-nowrap"
                          style={{ color, borderColor: "var(--border)", verticalAlign: "middle" }}>
                          {bolge.no}. Bölge
                        </td>
                      )}
                      <Td>{r.il.ad}</Td>
                      {cols.map(c => numTd(c.label, r.acts, c.field))}
                    </tr>
                  )),
                  <tr key={`${bolge.id}-top`} style={{ background: "var(--bg-th)" }}>
                    <td className="px-2.5 py-1.5 text-xs font-bold border" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      Bölge Toplamı
                    </td>
                    {cols.map(c => numTd(`${bolge.id}-${c.label}`, bolgeActs, c.field, { color, weight: 1 }))}
                  </tr>,
                ];
              })}
              {turkeyRow}
            </>
          )}

          {tumActs.length === 0 && (
            <tr>
              <td colSpan={cols.length + labelSpan} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Seçili filtrelerle veri bulunmuyor.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════
   EV / APART / YURT TABLO — kapsam destekli
══════════════════════════════════════ */
const EAY_FIELDS: (keyof Activity)[] = [
  "eay_mevcutEv", "eay_mevcutApart", "eay_mevcutYurt",
  "eay_acilacakEv", "eay_acilacakApart", "eay_acilacakYurt",
  "eay_kapanacakEv", "eay_kapanacakApart", "eay_kapanacakYurt",
  "eay_bursBalan", "eay_iliskiKesme", "eay_toplamZiyaret",
];

function EAYTable({ bolgeler, yil, donem, color, scope, sortDir }: {
  bolgeler: Bolge[];
  yil: number;
  donem: string;
  color: string;
  scope: Scope;
  sortDir: SortDir;
}) {
  const tumActs = bolgeler.flatMap(b => regionActs(b, yil, donem));
  const labelSpan = scope === "province" ? 2 : 1;
  const ilCount = bolgeler.flatMap(b => b.iller).filter(il => filterActs(il.activities, yil, donem).length > 0).length;
  const eayCols = EAY_FIELDS.map(f => ({ field: f }));

  const sortRegions = (arr: Bolge[]) =>
    sortDir ? [...arr].sort((a, b) => (rowTotal(regionActs(a, yil, donem), eayCols) - rowTotal(regionActs(b, yil, donem), eayCols)) * (sortDir === "asc" ? 1 : -1)) : arr;

  const turkeyRow = (
    <tr style={{ background: color + "12" }}>
      <td colSpan={labelSpan} className="px-2.5 py-2.5 text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
        🇹🇷 Türkiye Toplamı
      </td>
      {EAY_FIELDS.map(f => numTd(f, tumActs, f, { color, weight: 2 }))}
    </tr>
  );

  return (
    <div className="sv-section sv-fade" style={{ overflowX: "auto" }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          {yil} / {DONEM_LABEL[donem]}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: color + "18", color }}>
          {ilCount} il
        </span>
      </div>
      <table className="w-max min-w-full text-sm">
        <thead>
          <tr>
            <Th span={labelSpan} sticky>{""}</Th>
            <Th center span={3} sticky>Var Olan</Th>
            <Th center span={3} sticky>Açılacak</Th>
            <Th center span={3} sticky>Kapanacak</Th>
            <Th center sticky>Burs</Th>
            <Th center sticky>İliş. Kesme</Th>
            <Th center sticky>Top. Ziyaret</Th>
          </tr>
          <tr>
            <LabelHead scope={scope} />
            <Th center>Ev</Th><Th center>Apart</Th><Th center>Yurt</Th>
            <Th center>Ev</Th><Th center>Apart</Th><Th center>Yurt</Th>
            <Th center>Ev</Th><Th center>Apart</Th><Th center>Yurt</Th>
            <Th center>Alan</Th><Th center>Talep</Th><Th center>Ziyaret</Th>
          </tr>
        </thead>
        <tbody>
          {scope === "turkey" && turkeyRow}

          {scope === "region" && (
            <>
              {sortRegions(bolgeler).map(bolge => {
                const acts = regionActs(bolge, yil, donem);
                return (
                  <tr key={bolge.id} className="hover:bg-[color:var(--bg-hover)] transition">
                    <Td bold><span style={{ color }}>{bolge.no}. Bölge</span></Td>
                    {EAY_FIELDS.map(f => numTd(`${bolge.id}-${f}`, acts, f))}
                  </tr>
                );
              })}
              {turkeyRow}
            </>
          )}

          {scope === "province" && (
            <>
              {sortRegions(bolgeler).map(bolge => {
                const ilRows0 = bolge.iller.map(il => ({ il, acts: filterActs(il.activities, yil, donem) }));
                const ilRows = sortDir
                  ? [...ilRows0].sort((a, b) => (rowTotal(a.acts, eayCols) - rowTotal(b.acts, eayCols)) * (sortDir === "asc" ? 1 : -1))
                  : ilRows0;
                const bolgeActs = ilRows.flatMap(r => r.acts);
                if (ilRows.length === 0) return null;
                return [
                  ...ilRows.map((r, idx) => (
                    <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                      {idx === 0 && (
                        <td rowSpan={ilRows.length + 1}
                          className="px-2.5 py-2 text-sm font-bold border align-middle whitespace-nowrap"
                          style={{ color, borderColor: "var(--border)", verticalAlign: "middle" }}>
                          {bolge.no}. Bölge
                        </td>
                      )}
                      <Td>{r.il.ad}</Td>
                      {EAY_FIELDS.map(f => numTd(`${r.il.id}-${f}`, r.acts, f))}
                    </tr>
                  )),
                  <tr key={`${bolge.id}-top`} style={{ background: "var(--bg-th)" }}>
                    <td className="px-2.5 py-1.5 text-xs font-bold border" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      Bölge Top.
                    </td>
                    {EAY_FIELDS.map(f => numTd(`${bolge.id}-tot-${f}`, bolgeActs, f, { color, weight: 1 }))}
                  </tr>,
                ];
              })}
              {turkeyRow}
            </>
          )}

          {tumActs.length === 0 && (
            <tr>
              <td colSpan={12 + labelSpan} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Seçili filtrelerle veri bulunmuyor.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════
   BİRİM SEKMESİ WRAPPER
══════════════════════════════════════ */
type BirimKey = "uni" | "lise" | "ilk" | "ortak" | "eay";

const DONEMLER_BY_BIRIM: Record<BirimKey, string[]> = {
  ilk:   ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
  lise:  ["DONEM_1", "DONEM_2"],
  uni:   ["DONEM_1", "DONEM_2"],
  ortak: ["DONEM_1", "DONEM_2"],
  eay:   ["DONEM_1", "DONEM_2"],
};
const COLS_BY_BIRIM: Record<string, { label: string; field: keyof Activity }[]> = {
  ilk:   IK_COLS,
  lise:  LS_COLS,
  uni:   UNI_COLS,
  ortak: ORTAK_COLS,
};

const BIRIM_LABEL: Record<BirimKey, string> = {
  ilk: "İlköğretim Birimi", lise: "Lise Birimi", uni: "Üniversite Birimi",
  ortak: "Ortak Faaliyetler", eay: "Ev / Apart / Yurt",
};

/* Ev/Apart/Yurt dışa aktarma sütunları */
const EAY_EXPORT_COLS: { label: string; field: keyof Activity }[] = [
  { label: "Mevcut Ev",       field: "eay_mevcutEv" },
  { label: "Mevcut Apart",    field: "eay_mevcutApart" },
  { label: "Mevcut Yurt",     field: "eay_mevcutYurt" },
  { label: "Açılacak Ev",     field: "eay_acilacakEv" },
  { label: "Açılacak Apart",  field: "eay_acilacakApart" },
  { label: "Açılacak Yurt",   field: "eay_acilacakYurt" },
  { label: "Kapanacak Ev",    field: "eay_kapanacakEv" },
  { label: "Kapanacak Apart", field: "eay_kapanacakApart" },
  { label: "Kapanacak Yurt",  field: "eay_kapanacakYurt" },
  { label: "Burs Bağlanan",   field: "eay_bursBalan" },
  { label: "İlişik Kesme",    field: "eay_iliskiKesme" },
  { label: "Toplam Ziyaret",  field: "eay_toplamZiyaret" },
];

/* ══════════════════════════════════════
   KATEGORİ BAZLI TOPLAM (alt bölüm) — 3 renk grubu, Türkiye geneli
══════════════════════════════════════ */
// Alt paneli config ile açıp kapatmak için (spec §7)
const SHOW_CATEGORY_SUMMARY = true;
// 3 ayrışan renk ailesi (açık/koyu temada da okunur)
const TONE_A = "#0B6B3A"; // yeşil
const TONE_B = "#1D4ED8"; // mavi
const TONE_C = "#B45309"; // kehribar

type CatGroup = { title: string; tone: string; metrics: { label: string; field: keyof Activity }[] };

const CATEGORY_GROUPS: Record<BirimKey, CatGroup[]> = {
  ilk: [
    { title: "Dergâh", tone: TONE_A, metrics: [
      { label: "Toplam Dergah", field: "ik_toplamDergah" }, { label: "Kurs Yapılan", field: "ik_kursuYapilanDergah" } ] },
    { title: "Eğitmen", tone: TONE_B, metrics: [
      { label: "Eğitmen", field: "ik_egitmenSayisi" }, { label: "Eğt. Yardımcı", field: "ik_egitmenYardimciSayisi" } ] },
    { title: "Öğrenci", tone: TONE_C, metrics: [
      { label: "Elif-Ba", field: "ik_elifBaOgrenci" }, { label: "Kuran", field: "ik_kuranOgrenci" }, { label: "Geçiş", field: "ik_gecisOgrenci" } ] },
  ],
  lise: [
    { title: "Dergâh & Öğrenci", tone: TONE_A, metrics: [
      { label: "Toplam Dergâh", field: "ls_toplamDergah" }, { label: "İlim/Sohbet Dergâh", field: "ls_ilimSohbetDergah" },
      { label: "Liseli Öğrenci", field: "ls_liseliOgrenciSayisi" }, { label: "Mezun Olacak", field: "ls_mezunOgrenci" },
      { label: "Yeni İntisap", field: "ls_yeniIntisap" }, { label: "Kafile", field: "ls_kafileSayisi" }, { label: "Kafile Öğr.", field: "ls_kafileOgrenci" } ] },
    { title: "Faaliyet Sayısı", tone: TONE_B, metrics: [
      { label: "İlim/Sohbet", field: "ls_ilimSohbetSayisi" }, { label: "Sosyal", field: "ls_sosyalSayisi" },
      { label: "Sos. Sorumluluk", field: "ls_sorumlulukSayisi" }, { label: "Muhabbet", field: "ls_muhabbetSayisi" }, { label: "Namaz", field: "ls_namazSayisi" } ] },
    { title: "Katılım", tone: TONE_C, metrics: [
      { label: "İlim/Sohbet", field: "ls_ilimSohbetKatilim" }, { label: "Sosyal", field: "ls_sosyalKatilim" },
      { label: "Sos. Sorumluluk", field: "ls_sorumlulukKatilim" }, { label: "Muhabbet", field: "ls_muhabbetKatilim" }, { label: "Namaz", field: "ls_namazKatilim" } ] },
  ],
  uni: [
    { title: "Dergâh & Öğrenci", tone: TONE_A, metrics: [
      { label: "Toplam Dergâh", field: "uni_toplamDergah" }, { label: "İlim/Sohbet Dergâh", field: "uni_ilimSohbetDergah" },
      { label: "Üni. Öğrenci", field: "uni_universiteliOgrenciSayisi" }, { label: "Son Sınıf", field: "uni_sonSinifOgrenci" },
      { label: "Aktif Kulüp", field: "uni_aktifKulup" }, { label: "Yeni İntisap", field: "uni_yeniIntisap" },
      { label: "Kafile", field: "uni_kafileSayisi" }, { label: "Kafile Öğr.", field: "uni_kafileOgrenci" } ] },
    { title: "Faaliyet Sayısı", tone: TONE_B, metrics: [
      { label: "İlim/Sohbet", field: "uni_ilimSohbetSayisi" }, { label: "Kulüp", field: "uni_kulupSayisi" },
      { label: "Sosyal", field: "uni_sosyalSayisi" }, { label: "Sos. Sorumluluk", field: "uni_sorumlulukSayisi" },
      { label: "Muhabbet", field: "uni_muhabbetSayisi" }, { label: "Namaz", field: "uni_namazSayisi" }, { label: "KYK Buluşma", field: "uni_kykBulusmaSayisi" } ] },
    { title: "Katılım", tone: TONE_C, metrics: [
      { label: "İlim/Sohbet", field: "uni_ilimSohbetKatilim" }, { label: "Kulüp", field: "uni_kulupKatilim" },
      { label: "Sosyal", field: "uni_sosyalKatilim" }, { label: "Sos. Sorumluluk", field: "uni_sorumlulukKatilim" },
      { label: "Muhabbet", field: "uni_muhabbetKatilim" }, { label: "Namaz", field: "uni_namazKatilim" }, { label: "KYK Katılım", field: "uni_kykKatilim" } ] },
  ],
  ortak: [
    { title: "Kafile", tone: TONE_A, metrics: [
      { label: "Kafile", field: "ortakKafileSayisi" }, { label: "Liseli Katılım", field: "ortakKafileLiseKatilim" }, { label: "Üni. Katılım", field: "ortakKafileUniKatilim" } ] },
    { title: "Sabah Namazı", tone: TONE_B, metrics: [
      { label: "Sabah Namazı", field: "ortakSabahNamaziSayisi" }, { label: "Liseli Katılım", field: "ortakSabahNamaziLiseKatilim" }, { label: "Üni. Katılım", field: "ortakSabahNamaziUniKatilim" } ] },
  ],
  eay: [
    { title: "Var Olan", tone: TONE_A, metrics: [
      { label: "Ev", field: "eay_mevcutEv" }, { label: "Apart", field: "eay_mevcutApart" }, { label: "Yurt", field: "eay_mevcutYurt" } ] },
    { title: "Açılacak / Kapanacak", tone: TONE_B, metrics: [
      { label: "Açılacak Ev", field: "eay_acilacakEv" }, { label: "Açılacak Apart", field: "eay_acilacakApart" }, { label: "Açılacak Yurt", field: "eay_acilacakYurt" },
      { label: "Kapanacak Ev", field: "eay_kapanacakEv" }, { label: "Kapanacak Apart", field: "eay_kapanacakApart" }, { label: "Kapanacak Yurt", field: "eay_kapanacakYurt" } ] },
    { title: "Burs & Ziyaret", tone: TONE_C, metrics: [
      { label: "Burs Bağlanan", field: "eay_bursBalan" }, { label: "İlişik Kesme", field: "eay_iliskiKesme" }, { label: "Toplam Ziyaret", field: "eay_toplamZiyaret" } ] },
  ],
};

function CategorySummary({ groups, acts, yil, periodLabel }: {
  groups: CatGroup[];
  acts: Activity[];
  yil: string;
  periodLabel: string;
}) {
  const empty = acts.length === 0;
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Kategori Bazlı Toplam · 🇹🇷 Türkiye Geneli
        </h3>
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{yil} • {periodLabel}</span>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {groups.map(g => (
          <div key={g.title} className="sv-section overflow-hidden sv-fade">
            <div className="px-4 py-2.5 border-b font-bold text-sm" style={{ color: g.tone, background: g.tone + "12", borderColor: "var(--border)" }}>
              {g.title}
            </div>
            <div>
              {g.metrics.map((m, i) => (
                <div key={m.field as string}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{m.label}</span>
                  <span style={{ fontWeight: 700, color: empty ? "var(--text-muted)" : "var(--text-primary)", opacity: empty ? 0.45 : 1, fontVariantNumeric: "tabular-nums" }}>
                    {empty ? DASH : fmtNum(sum(acts, m.field))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BirimTabPanel({
  bolgeler, yillar, birim, color,
}: {
  bolgeler: Bolge[];
  yillar: number[];
  birim: BirimKey;
  color: string;
}) {
  const thisYear = new Date().getFullYear();
  const [yil, setYil]   = useState(String(yillar[0] ?? thisYear));
  const [donem, setDonem] = useState("TUM");          // TUM = tüm dönemler
  const [scope, setScope] = useState<Scope>("region"); // varsayılan: Bölge Bazlı
  const [regionIds, setRegionIds] = useState<string[]>([]); // boş = tüm bölgeler
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const donemler = DONEMLER_BY_BIRIM[birim];
  const gosterilecekDonemler = donem === "TUM" ? donemler : [donem];
  const gosterilecekBolgeler = useMemo(
    () => (regionIds.length === 0 ? bolgeler : bolgeler.filter(b => regionIds.includes(b.id))),
    [bolgeler, regionIds],
  );

  // Kategori özeti: her zaman tüm Türkiye (kapsam/bölge seçiminden bağımsız), yalnız dönem filtresine duyarlı
  const summaryActs = useMemo(() => {
    const dons = donem === "TUM" ? donemler : [donem];
    return bolgeler
      .flatMap(b => b.iller)
      .flatMap(il => il.activities.filter(a => a.yil === Number(yil) && dons.includes(a.donem)));
  }, [bolgeler, yil, donem, donemler]);

  // Aktif filtre çipleri
  const chips: { id: string; label: string; onRemove: () => void }[] = [];
  if (scope !== "region") chips.push({ id: "scope", label: `Kapsam: ${SCOPE_OPTS.find(s => s.key === scope)!.label}`, onRemove: () => setScope("region") });
  if (donem !== "TUM") chips.push({ id: "donem", label: DONEM_LABEL[donem] ?? donem, onRemove: () => setDonem("TUM") });
  if (regionIds.length > 0) {
    const noLabel = bolgeler.filter(b => regionIds.includes(b.id)).sort((a, b) => a.no - b.no).map(b => b.no).join(", ");
    chips.push({ id: "regions", label: `Bölge: ${noLabel}`, onRemove: () => setRegionIds([]) });
  }
  if (sortDir) chips.push({ id: "sort", label: sortDir === "desc" ? "En Yüksek" : "En Düşük", onRemove: () => setSortDir(null) });

  function clearAll() { setDonem("TUM"); setScope("region"); setRegionIds([]); setSortDir(null); }

  /** Ekrandaki (filtrelenmiş) tabloyu kurumsal şablonla dışa aktarır */
  function exportSpec() {
    const cols = birim === "eay" ? EAY_EXPORT_COLS : COLS_BY_BIRIM[birim];
    const rows: Record<string, string | number>[] = [];
    for (const d of gosterilecekDonemler) {
      for (const bolge of gosterilecekBolgeler) {
        for (const il of bolge.iller) {
          const acts = filterActs(il.activities, Number(yil), d);
          if (!acts.length) continue;
          const row: Record<string, string | number> = { bolge: bolge.ad, il: il.ad, donem: DONEM_LABEL[d] ?? d };
          for (const c of cols) row[c.field as string] = sum(acts, c.field);
          rows.push(row);
        }
      }
    }
    return {
      title: `Faaliyet Raporu — ${BIRIM_LABEL[birim]}`,
      subtitle: `${yil} • ${donem === "TUM" ? "Tüm Dönemler" : DONEM_LABEL[donem] ?? donem}`,
      fileName: `rapor-${birim}-${yil}`,
      columns: [
        { header: "Bölge", key: "bolge" },
        { header: "İl", key: "il" },
        { header: "Dönem", key: "donem" },
        ...cols.map(c => ({ header: c.label, key: c.field as string })),
      ],
      rows,
    };
  }

  const selectCls = "border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none cursor-pointer";
  const selectStyle = { borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" } as const;

  return (
    <div className="space-y-5">
      {/* Kontrol katmanı — yapışkan */}
      <div className="sv-section p-4 space-y-3 sticky top-0 z-20" style={{ background: "var(--bg-card)", overflow: "visible" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <ScopeToggle scope={scope} onScope={setScope} color={color} />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Yıl</span>
              <select value={yil} onChange={e => setYil(e.target.value)} className={selectCls} style={selectStyle}>
                {yillar.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            <MultiRegionSelect bolgeler={bolgeler} selected={regionIds} onChange={setRegionIds} color={color} />
            <DonemChips donem={donem} donemler={donemler} onDonem={setDonem} color={color} />
            <SortQuick sortDir={sortDir} onSort={setSortDir} color={color} />
          </div>
          <ExportButtons getSpec={exportSpec} />
        </div>
        <FilterChips items={chips} onClear={clearAll} />
      </div>

      {/* Tablolar (her gösterilen dönem için) */}
      {gosterilecekDonemler.map(d =>
        birim === "eay" ? (
          <EAYTable key={`${d}-${scope}`} bolgeler={gosterilecekBolgeler} yil={Number(yil)} donem={d} color={color} scope={scope} sortDir={sortDir} />
        ) : (
          <BirimTable key={`${d}-${scope}`} bolgeler={gosterilecekBolgeler} yil={Number(yil)} donem={d} cols={COLS_BY_BIRIM[birim]} color={color} scope={scope} sortDir={sortDir} />
        )
      )}

      {/* Kategori bazlı toplam (alt bölüm) */}
      {SHOW_CATEGORY_SUMMARY && (
        <CategorySummary
          groups={CATEGORY_GROUPS[birim]}
          acts={summaryActs}
          yil={yil}
          periodLabel={donem === "TUM" ? "Tüm Dönemler" : DONEM_LABEL[donem] ?? donem}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   ANA COMPONENT
══════════════════════════════════════ */
export function RaporlarClient({ sistem, bolgeler, yillar }: Props) {
  const info  = SISTEM_INFO[sistem] ?? SISTEM_INFO.EGITIMCI;
  const color = info.color;

  const tabs =
    sistem === "UNIVERSITE" ? UNIVERSITE_TABS :
    sistem === "LISE"       ? LISE_TABS       :
    EGITIMCI_TABS;

  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">

      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Raporlar
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {info.title} · Türkiye geneli faaliyet verileri
        </p>
      </div>

      {/* Birim sekmeleri */}
      <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={activeTab === t.key
              ? { background: color, color: "#fff", boxShadow: `0 2px 8px ${color}40` }
              : { color: "var(--text-muted)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab içeriği */}
      <BirimTabPanel
        key={activeTab}
        bolgeler={bolgeler}
        yillar={yillar}
        birim={activeTab as BirimKey}
        color={color}
      />
    </div>
  );
}
