"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ExportButtons } from "@/components/ui/ExportButtons";
import type { Donem } from "@/app/generated/prisma/client";

export type SistemKey = "EGITIMCI" | "UNIVERSITE" | "LISE";
/** Eğitimci sisteminin 3 birim durumu */
export interface EgitimciBirim {
  ILKOGRETIM: boolean;
  LISE: boolean;
  UNIVERSITE: boolean;
}
export interface SistemDurum {
  EGITIMCI: EgitimciBirim | null;
  /** Üniversite / Lise Gençlik: girilen faaliyet sayısı (faaliyet-bazlı) */
  UNIVERSITE: number | null;
  LISE: number | null;
}

/** Eğitimci sekmesinin açılır penceresindeki alt görünümler */
type EgitimciAlt = "GENEL" | "ILKOGRETIM" | "LISE" | "UNIVERSITE";

interface Il { id: string; ad: string }
interface Bolge { id: string; no: number; ad: string; iller: Il[] }

interface Props {
  bolgeler: Bolge[];
  /** ilId → 3 sistemin durumu; kayıt yoksa anahtar bulunmaz */
  sistemDurum: Record<string, SistemDurum>;
  yil: number;
  donem: Donem;
  yillar: number[];
  /** Sistem kısıtlı roller yalnızca kendi sistem sekmesini görür */
  kilitliSistem?: SistemKey | null;
}

const SISTEM_LABEL: Record<SistemKey, string> = {
  EGITIMCI:   "Eğitimci",
  UNIVERSITE: "Üniversite Gençlik",
  LISE:       "Lise Gençlik",
};

const EGITIMCI_ALT: { key: EgitimciAlt; label: string; aciklama: string }[] = [
  { key: "GENEL",      label: "Eğitimci",   aciklama: "3 birim de girildi mi" },
  { key: "UNIVERSITE", label: "Üniversite", aciklama: "Üniversite birimi" },
  { key: "LISE",       label: "Lise",       aciklama: "Lise birimi" },
  { key: "ILKOGRETIM", label: "İlköğretim", aciklama: "İlköğretim birimi" },
];

const DONEM_LABELS: Record<Donem, string> = {
  DONEM_1:    "1. Dönem",
  DONEM_2:    "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

const EKSIK_RENK = "#DC2626";
const EKSIK_ZEMIN = "rgba(220, 38, 38, 0.08)";

const BOS: SistemDurum = { EGITIMCI: null, UNIVERSITE: null, LISE: null };

/** Tek birim rozeti — ✓ yeşil / ✗ kırmızı-soluk */
function Rozet({ ad, tamam }: { ad: string; tamam: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={tamam
        ? { background: "var(--bg-active)", color: "var(--accent)" }
        : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}
      title={tamam ? `${ad}: veri girildi` : `${ad}: veri eksik`}
    >
      {tamam ? "✓" : "✗"} {ad}
    </span>
  );
}

export function BolgelerClient({ bolgeler, sistemDurum, yil, donem, yillar, kilitliSistem }: Props) {
  const router = useRouter();
  const [aktifSistem, setAktifSistem] = useState<SistemKey>(kilitliSistem ?? "EGITIMCI");
  const [egitimciAlt, setEgitimciAlt] = useState<EgitimciAlt>("GENEL");
  const [menuAcik, setMenuAcik] = useState(false);
  const [bolgeMenuAcik, setBolgeMenuAcik] = useState(false);
  const [acikBolgeler, setAcikBolgeler] = useState<Set<string>>(new Set());
  const [secilenBolgeler, setSecilenBolgeler] = useState<Set<string>>(new Set());
  const [arama, setArama] = useState("");
  const [sadeceEksik, setSadeceEksik] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bolgeMenuRef = useRef<HTMLDivElement>(null);
  const kapatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hover menüsü: girince hemen aç, ayrılınca kısa gecikmeyle kapat
  const acMenu = () => { if (kapatTimer.current) clearTimeout(kapatTimer.current); setMenuAcik(true); };
  const kapatMenuGecikmeli = () => {
    if (kapatTimer.current) clearTimeout(kapatTimer.current);
    kapatTimer.current = setTimeout(() => setMenuAcik(false), 160);
  };

  // Eğitimci menüsü: dışarı tıkla/Escape kapat
  useEffect(() => {
    if (!menuAcik) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAcik(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuAcik(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [menuAcik]);

  // Bölge filtre menüsü: dışarı tıkla kapat
  useEffect(() => {
    if (!bolgeMenuAcik) return;
    const onClick = (e: MouseEvent) => {
      if (bolgeMenuRef.current && !bolgeMenuRef.current.contains(e.target as Node)) setBolgeMenuAcik(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [bolgeMenuAcik]);

  const durumOf = (ilId: string): SistemDurum => sistemDurum[ilId] ?? BOS;

  /** Seçili sistem (+ Eğitimci alt görünümü) için bir il "tamam" mı? */
  const ilTamam = (ilId: string): boolean => {
    const d = durumOf(ilId);
    if (aktifSistem === "EGITIMCI") {
      const e = d.EGITIMCI;
      if (!e) return false;
      switch (egitimciAlt) {
        case "GENEL":      return e.ILKOGRETIM && e.LISE && e.UNIVERSITE;
        case "ILKOGRETIM": return e.ILKOGRETIM;
        case "LISE":       return e.LISE;
        case "UNIVERSITE": return e.UNIVERSITE;
      }
    }
    if (aktifSistem === "UNIVERSITE") return (d.UNIVERSITE ?? 0) > 0;
    return (d.LISE ?? 0) > 0;
  };

  function navigate(yeniYil: number, yeniDonem: string) {
    router.push(`/panel/admin/bolgeler?yil=${yeniYil}&donem=${yeniDonem}`);
  }

  function toggleBolge(id: string) {
    setAcikBolgeler(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function secEgitimci(alt: EgitimciAlt) {
    setAktifSistem("EGITIMCI");
    setEgitimciAlt(alt);
    setMenuAcik(false);
  }

  function toggleBolgeFiltre(id: string) {
    setSecilenBolgeler(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const yilSecenekleri = useMemo(
    () => (yillar.includes(yil) ? yillar : [yil, ...yillar]),
    [yillar, yil]
  );

  const aramaNorm = arama.trim().toLocaleLowerCase("tr");
  const filtreAktif = aramaNorm !== "" || sadeceEksik;
  const bolgeFiltresiAktif = secilenBolgeler.size > 0;

  const gorunurBolgeler = useMemo(() => {
    return bolgeler
      .filter(b => !bolgeFiltresiAktif || secilenBolgeler.has(b.id))
      .map(b => ({
        ...b,
        gorunurIller: b.iller.filter(il => {
          if (aramaNorm && !il.ad.toLocaleLowerCase("tr").includes(aramaNorm)) return false;
          if (sadeceEksik && ilTamam(il.id)) return false;
          return true;
        }),
      }))
      .filter(b => !filtreAktif || b.gorunurIller.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolgeler, aramaNorm, sadeceEksik, aktifSistem, egitimciAlt, sistemDurum, secilenBolgeler, bolgeFiltresiAktif]);

  const tumIller = useMemo(() => bolgeler.flatMap(b => b.iller), [bolgeler]);
  const tamamSayisi = tumIller.filter(il => ilTamam(il.id)).length;
  const eksikSayisi = tumIller.length - tamamSayisi;

  // Aktif görünüm etiketi
  const aktifLabel =
    aktifSistem === "EGITIMCI"
      ? (egitimciAlt === "GENEL" ? "Eğitimci (3 Birim)" : `Eğitimci · ${EGITIMCI_ALT.find(a => a.key === egitimciAlt)!.label}`)
      : SISTEM_LABEL[aktifSistem];

  // Eğitimci + GENEL görünümünde il satırında 3 birim rozeti gösterilir
  const birimRozetGoster = aktifSistem === "EGITIMCI" && egitimciAlt === "GENEL";

  const sekmeBtnStyle = (aktif: boolean) =>
    aktif
      ? { background: "var(--accent-solid)", color: "#fff" }
      : { color: "var(--text-muted)" };

  // Export için seçili görünümün flat satırlarını üretir
  function buildExportSpec() {
    const satırlar: Record<string, string>[] = [];
    const filtreliBolgeler = gorunurBolgeler;

    for (const bolge of filtreliBolgeler) {
      const iller = sadeceEksik
        ? bolge.gorunurIller.filter(il => !ilTamam(il.id))
        : bolge.gorunurIller;

      for (const il of iller) {
        const durum = durumOf(il.id);
        if (birimRozetGoster) {
          const e = durum.EGITIMCI;
          satırlar.push({
            bolge:      bolge.ad,
            il:         il.ad,
            ilkogretim: e?.ILKOGRETIM ? "Girildi" : "Eksik",
            lise:       e?.LISE       ? "Girildi" : "Eksik",
            universite: e?.UNIVERSITE ? "Girildi" : "Eksik",
            genel:      (e?.ILKOGRETIM && e.LISE && e.UNIVERSITE) ? "Tamam" : "Eksik",
          });
        } else if (aktifSistem === "UNIVERSITE" || aktifSistem === "LISE") {
          const sayi = (aktifSistem === "LISE" ? durum.LISE : durum.UNIVERSITE) ?? 0;
          satırlar.push({
            bolge:    bolge.ad,
            il:       il.ad,
            faaliyet: String(sayi),
            durum:    sayi > 0 ? "Girildi" : "Eksik",
          });
        } else {
          satırlar.push({
            bolge: bolge.ad,
            il:    il.ad,
            durum: ilTamam(il.id) ? "Tamam" : "Eksik",
          });
        }
      }
    }

    const baslik = `Eksik Veri Takip — ${aktifLabel} · ${yil} / ${DONEM_LABELS[donem]}`;

    if (birimRozetGoster) {
      return {
        title:   baslik,
        columns: [
          { header: "Bölge",       key: "bolge" },
          { header: "İl",          key: "il" },
          { header: "İlköğretim",  key: "ilkogretim" },
          { header: "Lise",        key: "lise" },
          { header: "Üniversite",  key: "universite" },
          { header: "Genel Durum", key: "genel" },
        ],
        rows: satırlar,
      };
    }
    if (aktifSistem === "UNIVERSITE" || aktifSistem === "LISE") {
      return {
        title:   baslik,
        columns: [
          { header: "Bölge",         key: "bolge" },
          { header: "İl",            key: "il" },
          { header: "Faaliyet Sayısı", key: "faaliyet" },
          { header: "Durum",         key: "durum" },
        ],
        rows: satırlar,
      };
    }
    return {
      title:   baslik,
      columns: [
        { header: "Bölge", key: "bolge" },
        { header: "İl",    key: "il" },
        { header: "Durum", key: "durum" },
      ],
      rows: satırlar,
    };
  }

  // Bölge filtresi için etiket
  const bolgeFiltrEtiket = bolgeFiltresiAktif
    ? secilenBolgeler.size === 1
      ? `${bolgeler.find(b => secilenBolgeler.has(b.id))?.ad ?? "1 Bölge"}`
      : `${secilenBolgeler.size} Bölge`
    : "Tüm Bölgeler";

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
            EKSİK VERİ TAKİP
          </p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Bölge & İl Veri Durumu
          </h1>
        </div>

        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select value={yil} onChange={e => navigate(Number(e.target.value), donem)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select value={donem} onChange={e => navigate(yil, e.target.value)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {(Object.keys(DONEM_LABELS) as Donem[]).map(d => <option key={d} value={d}>{DONEM_LABELS[d]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Sistem sekmeleri */}
      {kilitliSistem ? (
        <div className="flex items-center gap-2">
          <Badge tone="brand">{SISTEM_LABEL[kilitliSistem]}</Badge>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            sistemi görüntüleniyor — {yil} / {DONEM_LABELS[donem]}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-stretch gap-1 p-1 rounded-xl border w-fit"
          style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>

          {/* Eğitimci — hover/tıkla ile açılır pencereli */}
          <div
            ref={menuRef}
            className="relative"
            onMouseEnter={acMenu}
            onMouseLeave={kapatMenuGecikmeli}
          >
            <button
              onClick={() => setMenuAcik(v => !v)}
              aria-haspopup="menu"
              aria-expanded={menuAcik}
              className="h-full px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
              style={sekmeBtnStyle(aktifSistem === "EGITIMCI")}
            >
              {aktifSistem === "EGITIMCI" ? aktifLabel : "Eğitimci"}
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d={menuAcik ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {menuAcik && (
              <div className="absolute left-0 top-full pt-1.5 z-30 w-60">
                <div
                  role="menu"
                  className="rounded-xl border border-border bg-card shadow-xl py-1.5"
                >
                <p className="px-3.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Eğitimci Sistemi Birimleri
                </p>
                {EGITIMCI_ALT.map(alt => {
                  const aktif = aktifSistem === "EGITIMCI" && egitimciAlt === alt.key;
                  const eksik = tumIller.filter(il => {
                    const e = durumOf(il.id).EGITIMCI;
                    if (!e) return true;
                    if (alt.key === "GENEL") return !(e.ILKOGRETIM && e.LISE && e.UNIVERSITE);
                    return !e[alt.key];
                  }).length;
                  return (
                    <button
                      key={alt.key}
                      role="menuitem"
                      onClick={() => secEgitimci(alt.key)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-left transition hover:bg-[var(--bg-hover)]"
                      style={aktif ? { background: "var(--bg-active)" } : undefined}
                    >
                      <span>
                        <span className="block text-[13.5px] font-semibold" style={{ color: aktif ? "var(--accent)" : "var(--text-primary)" }}>
                          {alt.label}
                        </span>
                        <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>{alt.aciklama}</span>
                      </span>
                      {eksik > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                          {eksik} eksik
                        </span>
                      )}
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Üniversite Gençlik */}
          <button
            onClick={() => setAktifSistem("UNIVERSITE")}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
            style={sekmeBtnStyle(aktifSistem === "UNIVERSITE")}
          >
            Üniversite Gençlik
            <SekmeEksikRozet aktif={aktifSistem === "UNIVERSITE"} sayi={tumIller.filter(il => (durumOf(il.id).UNIVERSITE ?? 0) === 0).length} />
          </button>

          {/* Lise Gençlik */}
          <button
            onClick={() => setAktifSistem("LISE")}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
            style={sekmeBtnStyle(aktifSistem === "LISE")}
          >
            Lise Gençlik
            <SekmeEksikRozet aktif={aktifSistem === "LISE"} sayi={tumIller.filter(il => (durumOf(il.id).LISE ?? 0) === 0).length} />
          </button>
        </div>
      )}

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam İl",                  value: tumIller.length, renk: "var(--text-primary)", icon: "🗺️" },
          { label: `Tamamlanan (${aktifLabel})`, value: tamamSayisi,     renk: "var(--accent)",       icon: "✅" },
          { label: `Eksik (${aktifLabel})`,      value: eksikSayisi,     renk: EKSIK_RENK,            icon: "⚠️" },
        ].map(s => (
          <div key={s.label} className="sv-section p-5 flex items-center gap-4">
            <div className="text-3xl">{s.icon}</div>
            <div>
              <p className="text-3xl font-black" style={{ color: s.renk }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtreler + Export */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* İl arama */}
        <input
          type="text" value={arama} onChange={e => setArama(e.target.value)} placeholder="İl ara…"
          className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 w-52 focus:border-[var(--accent)] transition"
        />

        {/* Bölge filtresi */}
        <div ref={bolgeMenuRef} className="relative">
          <button
            onClick={() => setBolgeMenuAcik(v => !v)}
            className="px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition flex items-center gap-1.5"
            style={bolgeFiltresiAktif
              ? { background: "var(--bg-active)", color: "var(--accent)", borderColor: "var(--accent)" }
              : { background: "var(--bg-th)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {bolgeFiltrEtiket}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d={bolgeMenuAcik ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {bolgeMenuAcik && (
            <div className="absolute left-0 top-full mt-1.5 z-30 w-60 rounded-xl border border-border bg-card shadow-xl py-1.5">
              <p className="px-3.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Bölge Filtresi
              </p>
              {/* Tümünü seç / temizle */}
              <button
                onClick={() => setSecilenBolgeler(new Set())}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-left transition hover:bg-[var(--bg-hover)]"
                style={!bolgeFiltresiAktif ? { background: "var(--bg-active)" } : undefined}
              >
                <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                  style={!bolgeFiltresiAktif
                    ? { background: "var(--accent-solid)", borderColor: "var(--accent-solid)" }
                    : { borderColor: "var(--border)" }}>
                  {!bolgeFiltresiAktif && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Tüm Bölgeler</span>
              </button>
              <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
              {bolgeler.map(b => {
                const secili = secilenBolgeler.has(b.id);
                const eksikIl = b.iller.filter(il => !ilTamam(il.id)).length;
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleBolgeFiltre(b.id)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left transition hover:bg-[var(--bg-hover)]"
                    style={secili ? { background: "var(--bg-active)" } : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        style={secili
                          ? { background: "var(--accent-solid)", borderColor: "var(--accent-solid)" }
                          : { borderColor: "var(--border)" }}>
                        {secili && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span className="text-[13px] font-semibold" style={{ color: secili ? "var(--accent)" : "var(--text-primary)" }}>
                        {b.no}. {b.ad}
                      </span>
                    </span>
                    {eksikIl > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                        {eksikIl} eksik
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sadece eksikler */}
        <button
          onClick={() => setSadeceEksik(v => !v)}
          className="px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition"
          style={sadeceEksik
            ? { background: EKSIK_ZEMIN, color: EKSIK_RENK, borderColor: EKSIK_RENK }
            : { background: "var(--bg-th)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
          {sadeceEksik ? "✗ " : ""}Sadece eksikleri göster
        </button>

        {/* Filtreleri temizle */}
        {(filtreAktif || bolgeFiltresiAktif) && (
          <button onClick={() => { setArama(""); setSadeceEksik(false); setSecilenBolgeler(new Set()); }}
            className="px-3 py-2 rounded-xl text-[12.5px] font-semibold transition" style={{ color: "var(--text-muted)" }}>
            Temizle
          </button>
        )}

        {/* Export butonları */}
        <div className="ml-auto">
          <ExportButtons getSpec={buildExportSpec} />
        </div>
      </div>

      {/* Bölge akordeonları */}
      <div className="space-y-3">
        {gorunurBolgeler.length === 0 && (
          <div className="sv-section p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Filtreyle eşleşen il bulunamadı.
          </div>
        )}

        {gorunurBolgeler.map(bolge => {
          const acik = acikBolgeler.has(bolge.id) || filtreAktif || bolgeFiltresiAktif;
          const bolgeTamam = bolge.iller.filter(il => ilTamam(il.id)).length;
          const hepsiTamam = bolgeTamam === bolge.iller.length && bolge.iller.length > 0;

          return (
            <div key={bolge.id} className="sv-section overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[color:var(--bg-hover)] transition"
                onClick={() => toggleBolge(bolge.id)}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: "var(--accent-solid)" }}>{bolge.no}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{bolge.ad}</span>
                  <Badge tone="neutral">{bolge.iller.length} İl</Badge>
                  <Badge tone={hepsiTamam ? "brand" : "danger"}>{bolgeTamam}/{bolge.iller.length} il tamam</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  {(filtreAktif || bolgeFiltresiAktif) && <span>{bolge.gorunurIller.length} eşleşme</span>}
                  <span className="ml-2 text-lg">{acik ? "▲" : "▼"}</span>
                </div>
              </button>

              {acik && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["İl", birimRozetGoster ? "Birim Durumları (İlk · Lise · Üni)" : `${aktifLabel} Durumu`].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)", background: "var(--bg-th)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bolge.gorunurIller.map(il => {
                        const e = durumOf(il.id).EGITIMCI;
                        const tamam = ilTamam(il.id);
                        return (
                          <tr key={il.id}
                            className="border-t hover:bg-[color:var(--bg-hover)] transition"
                            style={{ borderColor: "var(--border)", background: !tamam ? "rgba(220, 38, 38, 0.04)" : undefined }}>
                            <td className="px-5 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>{il.ad}</td>
                            <td className="px-5 py-3">
                              {birimRozetGoster ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Rozet ad="İlk"  tamam={!!e?.ILKOGRETIM} />
                                  <Rozet ad="Lise" tamam={!!e?.LISE} />
                                  <Rozet ad="Üni"  tamam={!!e?.UNIVERSITE} />
                                  {tamam && (
                                    <span className="text-[11px] font-bold ml-1" style={{ color: "var(--accent)" }}>· tamam</span>
                                  )}
                                </div>
                              ) : (aktifSistem === "LISE" || aktifSistem === "UNIVERSITE") ? (
                                (() => {
                                  const c = (aktifSistem === "LISE" ? durumOf(il.id).LISE : durumOf(il.id).UNIVERSITE) ?? 0;
                                  return (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                      style={c > 0
                                        ? { background: "var(--bg-active)", color: "var(--accent)" }
                                        : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                                      📋 {c} faaliyet girildi
                                    </span>
                                  );
                                })()
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style={tamam
                                    ? { background: "var(--bg-active)", color: "var(--accent)" }
                                    : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                                  {tamam ? `✓ ${aktifLabel} Verileri Girildi` : `✗ ${aktifLabel} Verileri Eksik`}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Sekme üzerindeki eksik sayısı rozeti */
function SekmeEksikRozet({ aktif, sayi }: { aktif: boolean; sayi: number }) {
  if (sayi <= 0) return null;
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={aktif
        ? { background: "rgba(255,255,255,0.22)", color: "#fff" }
        : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
      {sayi}
    </span>
  );
}
