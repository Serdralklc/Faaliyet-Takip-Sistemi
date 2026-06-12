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

/* ── Helpers ── */
const n = (v: number | null | undefined) => v ?? 0;
const fmt = (v: number) => v === 0 ? "—" : v.toLocaleString("tr-TR");
function sum(acts: Activity[], field: keyof Activity): number {
  return acts.reduce((s, a) => s + n(a[field] as number), 0);
}
function filterActs(acts: Activity[], yil: number, donem: string) {
  return acts.filter(a => a.yil === yil && a.donem === donem);
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
function Th({ children, center, span }: { children: React.ReactNode; center?: boolean; span?: number }) {
  return (
    <th
      colSpan={span}
      className={`px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border ${center ? "text-center" : "text-left"}`}
      style={{ color: "var(--text-muted)", background: "var(--bg-th)", borderColor: "var(--border)" }}
    >
      {children}
    </th>
  );
}
function Td({ children, center, bold, green }: { children: React.ReactNode; center?: boolean; bold?: boolean; green?: boolean }) {
  return (
    <td
      className={`px-2.5 py-2 text-sm border ${center ? "text-center" : "text-left"} ${bold ? "font-bold" : "font-medium"}`}
      style={{
        color: green ? "var(--green-primary)" : bold ? "var(--text-primary)" : "var(--text-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {children}
    </td>
  );
}

function SistemSelect({ color, yil, yillar, donem, donemler, onYil, onDonem, bolgeId, bolgeler, onBolge }: {
  color: string; yil: string; yillar: number[];
  donem: string; donemler: string[];
  onYil: (y: string) => void; onDonem: (d: string) => void;
  bolgeId: string; bolgeler: { id: string; no: number; ad: string }[]; onBolge: (id: string) => void;
}) {
  const selectCls = "border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none cursor-pointer";
  const selectStyle = { borderColor: "var(--border-input)", background: "var(--bg-input)", color: "var(--text-primary)" };
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Yıl</span>
        <select value={yil} onChange={e => onYil(e.target.value)} className={selectCls} style={selectStyle}>
          {yillar.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Bölge</span>
        <select value={bolgeId} onChange={e => onBolge(e.target.value)} className={selectCls} style={selectStyle}>
          <option value="TUM">Tüm Bölgeler</option>
          {bolgeler.map(b => <option key={b.id} value={b.id}>{b.no}. Bölge</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Dönem</span>
        <div className="flex gap-1">
          <button
            onClick={() => onDonem("TUM")}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition"
            style={donem === "TUM"
              ? { background: color, color: "#fff", borderColor: color }
              : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" }}
          >
            Tümü
          </button>
          {donemler.map(d => (
            <button key={d}
              onClick={() => onDonem(d)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition"
              style={donem === d
                ? { background: color, color: "#fff", borderColor: color }
                : { background: "var(--bg-card)", color: "var(--text-muted)", borderColor: "var(--border)" }}
            >
              {DONEM_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BİRİM TABLO (ilk / lise / uni)
══════════════════════════════════════ */
function BirimTable({
  bolgeler, yil, donem, cols, color,
}: {
  bolgeler: Bolge[];
  yil: number;
  donem: string;
  cols: { label: string; field: keyof Activity }[];
  color: string;
}) {
  const tumActs = bolgeler.flatMap(b => b.iller.flatMap(il => filterActs(il.activities, yil, donem)));

  return (
    <div className="sv-section overflow-x-auto">
      {/* Dönem başlığı */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          {yil} / {DONEM_LABEL[donem]}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: color + "18", color }}>
          {bolgeler.flatMap(b => b.iller).filter(il => filterActs(il.activities, yil, donem).length > 0).length} il
        </span>
      </div>
      <table className="w-max min-w-full text-sm">
        <thead>
          <tr>
            <Th>Bölge</Th>
            <Th>İl</Th>
            {cols.map(c => <Th key={c.label} center>{c.label}</Th>)}
          </tr>
        </thead>
        <tbody>
          {bolgeler.map(bolge => {
            const rows = bolge.iller
              .map(il => ({ il, acts: filterActs(il.activities, yil, donem) }))
              .filter(r => r.acts.length > 0);
            if (rows.length === 0) return null;
            const bolgeActs = rows.flatMap(r => r.acts);

            return [
              ...rows.map((r, idx) => (
                <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                  {idx === 0 && (
                    <td
                      rowSpan={rows.length + 1}
                      className="px-2.5 py-2 text-sm font-bold border align-middle whitespace-nowrap"
                      style={{ color, borderColor: "var(--border)", verticalAlign: "middle" }}
                    >
                      {bolge.no}. Bölge
                    </td>
                  )}
                  <Td>{r.il.ad}</Td>
                  {cols.map(c => (
                    <Td key={c.label} center>{fmt(n(r.acts[0]?.[c.field] as number))}</Td>
                  ))}
                </tr>
              )),
              <tr key={`${bolge.id}-top`} style={{ background: "var(--bg-th)" }}>
                <td className="px-2.5 py-1.5 text-xs font-bold border" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                  Bölge Toplamı
                </td>
                {cols.map(c => (
                  <td key={c.label} className="px-2.5 py-1.5 text-center text-xs font-bold border" style={{ color, borderColor: "var(--border)" }}>
                    {fmt(sum(bolgeActs, c.field))}
                  </td>
                ))}
              </tr>,
            ];
          })}
          {/* Türkiye Toplam */}
          <tr style={{ background: color + "12" }}>
            <td colSpan={2} className="px-2.5 py-2.5 text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
              🇹🇷 Türkiye Toplamı
            </td>
            {cols.map(c => (
              <td key={c.label} className="px-2.5 py-2.5 text-center text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
                {fmt(sum(tumActs, c.field))}
              </td>
            ))}
          </tr>
          {tumActs.length === 0 && (
            <tr>
              <td colSpan={cols.length + 2} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Bu dönem için henüz veri girilmemiş.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════
   EV / APART / YURT TABLO
══════════════════════════════════════ */
function EAYTable({ bolgeler, yil, donem, color }: {
  bolgeler: Bolge[];
  yil: number;
  donem: string;
  color: string;
}) {
  const tumActs = bolgeler.flatMap(b => b.iller.flatMap(il => filterActs(il.activities, yil, donem)));

  return (
    <div className="sv-section overflow-x-auto">
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          {yil} / {DONEM_LABEL[donem]}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: color + "18", color }}>
          {bolgeler.flatMap(b => b.iller).filter(il => filterActs(il.activities, yil, donem).length > 0).length} il
        </span>
      </div>
      <table className="w-max min-w-full text-sm">
        <thead>
          {/* Üst grup başlıkları */}
          <tr>
            <Th span={2}>{""}</Th>
            <Th center span={3}>Var Olan</Th>
            <Th center span={3}>Açılacak</Th>
            <Th center span={3}>Kapanacak</Th>
            <Th center>Burs</Th>
            <Th center>İliş. Kesme</Th>
            <Th center>Top. Ziyaret</Th>
          </tr>
          {/* Alt başlıklar */}
          <tr>
            <Th>Bölge</Th>
            <Th>İl</Th>
            <Th center>Ev</Th>
            <Th center>Apart</Th>
            <Th center>Yurt</Th>
            <Th center>Ev</Th>
            <Th center>Apart</Th>
            <Th center>Yurt</Th>
            <Th center>Ev</Th>
            <Th center>Apart</Th>
            <Th center>Yurt</Th>
            <Th center>Alan</Th>
            <Th center>Talep</Th>
            <Th center>Ziyaret</Th>
          </tr>
        </thead>
        <tbody>
          {bolgeler.map(bolge => {
            const rows = bolge.iller
              .map(il => ({ il, acts: filterActs(il.activities, yil, donem) }))
              .filter(r => r.acts.length > 0);
            if (rows.length === 0) return null;
            const ba = rows.flatMap(r => r.acts);

            const eayRow = (acts: Activity[]) => [
              sum(acts, "eay_mevcutEv"),    sum(acts, "eay_mevcutApart"),    sum(acts, "eay_mevcutYurt"),
              sum(acts, "eay_acilacakEv"),  sum(acts, "eay_acilacakApart"),  sum(acts, "eay_acilacakYurt"),
              sum(acts, "eay_kapanacakEv"), sum(acts, "eay_kapanacakApart"), sum(acts, "eay_kapanacakYurt"),
              sum(acts, "eay_bursBalan"),   sum(acts, "eay_iliskiKesme"),    sum(acts, "eay_toplamZiyaret"),
            ];

            return [
              ...rows.map((r, idx) => {
                const vals = eayRow(r.acts);
                return (
                  <tr key={r.il.id} className="hover:bg-[color:var(--bg-hover)] transition">
                    {idx === 0 && (
                      <td rowSpan={rows.length + 1}
                        className="px-2.5 py-2 text-sm font-bold border align-middle whitespace-nowrap"
                        style={{ color, borderColor: "var(--border)", verticalAlign: "middle" }}>
                        {bolge.no}. Bölge
                      </td>
                    )}
                    <Td>{r.il.ad}</Td>
                    {vals.map((v, i) => <Td key={i} center>{fmt(v)}</Td>)}
                  </tr>
                );
              }),
              <tr key={`${bolge.id}-top`} style={{ background: "var(--bg-th)" }}>
                <td className="px-2.5 py-1.5 text-xs font-bold border" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                  Bölge Top.
                </td>
                {eayRow(ba).map((v, i) => (
                  <td key={i} className="px-2.5 py-1.5 text-center text-xs font-bold border" style={{ color, borderColor: "var(--border)" }}>
                    {fmt(v)}
                  </td>
                ))}
              </tr>,
            ];
          })}
          {/* Türkiye toplam */}
          <tr style={{ background: color + "12" }}>
            <td colSpan={2} className="px-2.5 py-2.5 text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
              🇹🇷 Türkiye Toplamı
            </td>
            {[
              sum(tumActs, "eay_mevcutEv"),    sum(tumActs, "eay_mevcutApart"),    sum(tumActs, "eay_mevcutYurt"),
              sum(tumActs, "eay_acilacakEv"),  sum(tumActs, "eay_acilacakApart"),  sum(tumActs, "eay_acilacakYurt"),
              sum(tumActs, "eay_kapanacakEv"), sum(tumActs, "eay_kapanacakApart"), sum(tumActs, "eay_kapanacakYurt"),
              sum(tumActs, "eay_bursBalan"),   sum(tumActs, "eay_iliskiKesme"),    sum(tumActs, "eay_toplamZiyaret"),
            ].map((v, i) => (
              <td key={i} className="px-2.5 py-2.5 text-center text-sm font-black border" style={{ color, borderColor: "var(--border)" }}>
                {fmt(v)}
              </td>
            ))}
          </tr>
          {tumActs.length === 0 && (
            <tr>
              <td colSpan={14} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                Bu dönem için henüz veri girilmemiş.
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
   (yıl+dönem filtresi + tablolar)
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
  const [donem, setDonem] = useState("TUM");  // TUM = tüm dönemler
  const [bolgeId, setBolgeId] = useState("TUM"); // TUM = tüm bölgeler

  const donemler = DONEMLER_BY_BIRIM[birim];
  const gosterilecekDonemler = donem === "TUM" ? donemler : [donem];
  const gosterilecekBolgeler = bolgeId === "TUM" ? bolgeler : bolgeler.filter(b => b.id === bolgeId);

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

  return (
    <div className="space-y-5">
      {/* Filtre + dışa aktarma */}
      <div className="sv-section p-4 flex flex-wrap items-center justify-between gap-3">
        <SistemSelect
          color={color}
          yil={yil} yillar={yillar}
          donem={donem} donemler={donemler}
          onYil={setYil} onDonem={setDonem}
          bolgeId={bolgeId} bolgeler={bolgeler} onBolge={setBolgeId}
        />
        <ExportButtons getSpec={exportSpec} />
      </div>

      {/* Tablolar (her gösterilen dönem için) */}
      {gosterilecekDonemler.map(d =>
        birim === "eay" ? (
          <EAYTable key={d} bolgeler={gosterilecekBolgeler} yil={Number(yil)} donem={d} color={color} />
        ) : (
          <BirimTable key={d} bolgeler={gosterilecekBolgeler} yil={Number(yil)} donem={d} cols={COLS_BY_BIRIM[birim]} color={color} />
        )
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
