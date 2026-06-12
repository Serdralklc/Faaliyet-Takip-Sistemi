"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import type { Donem } from "@/app/generated/prisma/client";

export type Kategori = "ILKOGRETIM" | "LISE" | "UNIVERSITE" | "ORTAK";
export interface KategoriDurum {
  ILKOGRETIM: boolean;
  LISE: boolean;
  UNIVERSITE: boolean;
  ORTAK: boolean;
}

type Sekme = "TUMU" | Kategori;

interface Il {
  id: string;
  ad: string;
}

interface Bolge {
  id: string;
  no: number;
  ad: string;
  iller: Il[];
}

interface Props {
  bolgeler: Bolge[];
  /** ilId → kategori bazlı girildi/eksik durumu; kayıt yoksa anahtar bulunmaz (4 kategori de eksik) */
  kategoriDurum: Record<string, KategoriDurum>;
  yil: number;
  donem: Donem;
  yillar: number[];
  /** Sistem kısıtlı roller yalnızca kendi kategorisini görür */
  kilitliKategori?: Kategori | null;
}

const KATEGORILER: Kategori[] = ["ILKOGRETIM", "LISE", "UNIVERSITE", "ORTAK"];

const KATEGORI_CONFIG: Record<Kategori, { label: string; kisa: string }> = {
  ILKOGRETIM: { label: "İlköğretim", kisa: "İlk" },
  LISE:       { label: "Lise",       kisa: "Lise" },
  UNIVERSITE: { label: "Üniversite", kisa: "Üni" },
  ORTAK:      { label: "Ortak",      kisa: "Ortak" },
};

const DONEM_LABELS: Record<Donem, string> = {
  DONEM_1:    "1. Dönem",
  DONEM_2:    "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

const BOS_DURUM: KategoriDurum = { ILKOGRETIM: false, LISE: false, UNIVERSITE: false, ORTAK: false };

const EKSIK_RENK = "#DC2626";
const EKSIK_ZEMIN = "rgba(220, 38, 38, 0.08)";

/** Tek kategori rozeti — ✓ yeşil / ✗ kırmızı-soluk */
function KategoriRozet({ ad, tamam }: { ad: string; tamam: boolean }) {
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

export function BolgelerClient({ bolgeler, kategoriDurum, yil, donem, yillar, kilitliKategori }: Props) {
  const router = useRouter();
  const [aktifSekme, setAktifSekme] = useState<Sekme>(kilitliKategori ?? "TUMU");
  const [acikBolgeler, setAcikBolgeler] = useState<Set<string>>(new Set());
  const [arama, setArama] = useState("");
  const [sadeceEksik, setSadeceEksik] = useState(false);

  const durumOf = (ilId: string): KategoriDurum => kategoriDurum[ilId] ?? BOS_DURUM;

  /** Seçili sekmeye göre bir il "tamam" mı? Tümü ⇒ 4 kategori de girildi */
  const ilTamam = (ilId: string, sekme: Sekme): boolean => {
    const d = durumOf(ilId);
    return sekme === "TUMU" ? KATEGORILER.every(k => d[k]) : d[sekme];
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

  // Yıl seçenekleri — seçili yıl listede yoksa başa ekle (örn. hiç kayıt yokken içinde bulunulan yıl)
  const yilSecenekleri = useMemo(
    () => (yillar.includes(yil) ? yillar : [yil, ...yillar]),
    [yillar, yil]
  );

  // Arama + "sadece eksikler" filtresi
  const aramaNorm = arama.trim().toLocaleLowerCase("tr");
  const filtreAktif = aramaNorm !== "" || sadeceEksik;

  const gorunurBolgeler = useMemo(() => {
    return bolgeler
      .map(b => ({
        ...b,
        gorunurIller: b.iller.filter(il => {
          if (aramaNorm && !il.ad.toLocaleLowerCase("tr").includes(aramaNorm)) return false;
          if (sadeceEksik && ilTamam(il.id, aktifSekme)) return false;
          return true;
        }),
      }))
      .filter(b => !filtreAktif || b.gorunurIller.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bolgeler, aramaNorm, sadeceEksik, aktifSekme, kategoriDurum]);

  // Üst istatistikler — seçili sekmeye göre
  const tumIller = useMemo(() => bolgeler.flatMap(b => b.iller), [bolgeler]);
  const tamamSayisi = tumIller.filter(il => ilTamam(il.id, aktifSekme)).length;
  const eksikSayisi = tumIller.length - tamamSayisi;

  // Sekme başına eksik sayıları (sekme etiketlerinde gösterilir)
  const sekmeEksik = (sekme: Sekme) =>
    tumIller.filter(il => !ilTamam(il.id, sekme)).length;

  const aktifLabel = aktifSekme === "TUMU" ? "Tüm Kategoriler" : KATEGORI_CONFIG[aktifSekme].label;

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>
            COĞRAFİ YAPI
          </p>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Bölge & İl Yönetimi
          </h1>
        </div>

        {/* Yıl + dönem seçici — değişince sunucu yeniden çeker */}
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Yıl</span>
            <select
              value={yil}
              onChange={e => navigate(Number(e.target.value), donem)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition"
            >
              {yilSecenekleri.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dönem</span>
            <select
              value={donem}
              onChange={e => navigate(yil, e.target.value)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition"
            >
              {(Object.keys(DONEM_LABELS) as Donem[]).map(d => (
                <option key={d} value={d}>{DONEM_LABELS[d]}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Kategori sekmeleri — kilitli kategori varsa tek başlık göster */}
      {kilitliKategori ? (
        <div className="flex items-center gap-2">
          <Badge tone="brand">{KATEGORI_CONFIG[kilitliKategori].label}</Badge>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            kategorisi görüntüleniyor — {yil} / {DONEM_LABELS[donem]}
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 p-1 rounded-xl border w-fit"
          style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
          {(["TUMU", ...KATEGORILER] as Sekme[]).map(s => {
            const aktif = aktifSekme === s;
            const eksik = sekmeEksik(s);
            return (
              <button key={s}
                onClick={() => setAktifSekme(s)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                style={aktif
                  ? { background: "var(--accent-solid)", color: "#fff" }
                  : { color: "var(--text-muted)" }}>
                {s === "TUMU" ? "Tümü" : KATEGORI_CONFIG[s].label}
                {eksik > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={aktif
                      ? { background: "rgba(255,255,255,0.22)", color: "#fff" }
                      : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                    {eksik}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* İstatistik kartları — seçili sekmeye göre */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam İl",                       value: tumIller.length, renk: "var(--text-primary)", icon: "🗺️" },
          { label: `Tamamlanan (${aktifLabel})`,      value: tamamSayisi,     renk: "var(--accent)",       icon: "✅" },
          { label: `Eksik (${aktifLabel})`,           value: eksikSayisi,     renk: EKSIK_RENK,            icon: "⚠️" },
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

      {/* Arama + sadece eksikler */}
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={arama}
          onChange={e => setArama(e.target.value)}
          placeholder="İl ara…"
          className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 w-56 focus:border-[var(--accent)] transition"
        />
        <button
          onClick={() => setSadeceEksik(v => !v)}
          className="px-3 py-2 rounded-xl text-[12.5px] font-semibold border transition"
          style={sadeceEksik
            ? { background: EKSIK_ZEMIN, color: EKSIK_RENK, borderColor: EKSIK_RENK }
            : { background: "var(--bg-th)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
          {sadeceEksik ? "✗ " : ""}Sadece eksikleri göster
        </button>
        {filtreAktif && (
          <button
            onClick={() => { setArama(""); setSadeceEksik(false); }}
            className="px-3 py-2 rounded-xl text-[12.5px] font-semibold transition"
            style={{ color: "var(--text-muted)" }}>
            Temizle
          </button>
        )}
      </div>

      {/* Bölge akordeonları */}
      <div className="space-y-3">
        {gorunurBolgeler.length === 0 && (
          <div className="sv-section p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Filtreyle eşleşen il bulunamadı.
          </div>
        )}

        {gorunurBolgeler.map(bolge => {
          const acik = acikBolgeler.has(bolge.id) || filtreAktif;
          const bolgeTamam = bolge.iller.filter(il => ilTamam(il.id, aktifSekme)).length;
          const hepsiTamam = bolgeTamam === bolge.iller.length && bolge.iller.length > 0;

          return (
            <div key={bolge.id} className="sv-section overflow-hidden">
              {/* Bölge başlığı */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[color:var(--bg-hover)] transition"
                onClick={() => toggleBolge(bolge.id)}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: "var(--accent-solid)" }}>
                    {bolge.no}
                  </span>
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {bolge.ad}
                  </span>
                  <Badge tone="neutral">{bolge.iller.length} İl</Badge>
                  <Badge tone={hepsiTamam ? "brand" : "danger"}>
                    {bolgeTamam}/{bolge.iller.length} il tamam
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                  {filtreAktif && <span>{bolge.gorunurIller.length} eşleşme</span>}
                  <span className="ml-2 text-lg">{acik ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* İl tablosu */}
              {acik && (
                <div className="border-t" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["İl", aktifSekme === "TUMU" ? "Kategori Durumları" : `${aktifLabel} Durumu`].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)", background: "var(--bg-th)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bolge.gorunurIller.map(il => {
                        const d = durumOf(il.id);
                        const tamam = ilTamam(il.id, aktifSekme);
                        return (
                          <tr key={il.id}
                            className="border-t hover:bg-[color:var(--bg-hover)] transition"
                            style={{
                              borderColor: "var(--border)",
                              // Tek kategori sekmesinde eksik iller vurgulu
                              background: aktifSekme !== "TUMU" && !tamam ? "rgba(220, 38, 38, 0.04)" : undefined,
                            }}>
                            <td className="px-5 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                              {il.ad}
                            </td>
                            <td className="px-5 py-3">
                              {aktifSekme === "TUMU" ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {KATEGORILER.map(k => (
                                    <KategoriRozet key={k} ad={KATEGORI_CONFIG[k].kisa} tamam={d[k]} />
                                  ))}
                                </div>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                  style={tamam
                                    ? { background: "var(--bg-active)", color: "var(--accent)" }
                                    : { background: EKSIK_ZEMIN, color: EKSIK_RENK }}>
                                  {tamam
                                    ? `✓ ${aktifLabel} Verileri Girildi`
                                    : `✗ ${aktifLabel} Verileri Eksik`}
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
