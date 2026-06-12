"use client";

/**
 * Bölge eğitimcisi — İl Kontrol Paneli.
 * Bölgesindeki illerin (il eğitimcilerinin girdiği) faaliyet verilerini
 * SALT-OKUNUR görüntüler ve kontrol eder. Veri girişi/düzenleme yoktur.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Donem } from "@/app/generated/prisma/client";
import {
  birimDurum, durumEtiket, BIRIMLER, BIRIM_KISA,
  type BirimDurum, type BirimKey,
} from "@/lib/birimDurum";

const DONEM_LABELS: Record<Donem, string> = {
  DONEM_1: "1. Dönem", DONEM_2: "2. Dönem", YAZ_DONEMI: "Yaz Dönemi",
};

/** Detayda birim gruplu gösterilecek alanlar (geçmiş kayıtların tüm alanları dahil) */
const BIRIM_GRUPLARI: { baslik: string; renk: string; birim?: BirimKey; alanlar: { key: string; label: string }[] }[] = [
  {
    baslik: "İlköğretim", renk: "#006B3F", birim: "ILKOGRETIM",
    alanlar: [
      { key: "ik_toplamDergah", label: "Toplam Dergah" },
      { key: "ik_kursuYapilanDergah", label: "Kurs Yapılan Dergah" },
      { key: "ik_egitmenSayisi", label: "Eğitmen" },
      { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı" },
      { key: "ik_elifBaOgrenci", label: "Elif-Ba Öğrenci" },
      { key: "ik_kuranOgrenci", label: "Kur'an Öğrenci" },
      { key: "ik_gecisOgrenci", label: "Geçiş Öğrenci" },
    ],
  },
  {
    baslik: "Lise", renk: "#0369A1", birim: "LISE",
    alanlar: [
      { key: "ls_toplamDergah", label: "Toplam Dergâh" },
      { key: "ls_ilimSohbetDergah", label: "İlim/Sohbet Dergâh" },
      { key: "ls_liseliOgrenciSayisi", label: "Liseli Öğrenci" },
      { key: "ls_mezunOgrenci", label: "Mezun Olacak" },
      { key: "ls_yeniIntisap", label: "Yeni İntisap" },
      { key: "ls_ilimSohbetSayisi", label: "İlim/Sohbet" },
      { key: "ls_ilimSohbetKatilim", label: "İlim/Sohbet Kat." },
      { key: "ls_sosyalSayisi", label: "Sosyal" },
      { key: "ls_sosyalKatilim", label: "Sosyal Kat." },
      { key: "ls_sorumlulukSayisi", label: "Sos. Sorumluluk" },
      { key: "ls_sorumlulukKatilim", label: "Sos. Sor. Kat." },
      { key: "ls_muhabbetSayisi", label: "Muhabbet" },
      { key: "ls_muhabbetKatilim", label: "Muhabbet Kat." },
      { key: "ls_namazSayisi", label: "Namaz" },
      { key: "ls_namazKatilim", label: "Namaz Kat." },
      { key: "ls_kafileSayisi", label: "Kafile" },
      { key: "ls_kafileOgrenci", label: "Kafile Öğr." },
    ],
  },
  {
    baslik: "Üniversite", renk: "#7C3AED", birim: "UNIVERSITE",
    alanlar: [
      { key: "uni_toplamDergah", label: "Toplam Dergâh" },
      { key: "uni_ilimSohbetDergah", label: "İlim/Sohbet Dergâh" },
      { key: "uni_universiteliOgrenciSayisi", label: "Üni. Öğrenci" },
      { key: "uni_sonSinifOgrenci", label: "Son Sınıf" },
      { key: "uni_aktifKulup", label: "Aktif Kulüp" },
      { key: "uni_yeniIntisap", label: "Yeni İntisap" },
      { key: "uni_ilimSohbetSayisi", label: "İlim/Sohbet" },
      { key: "uni_ilimSohbetKatilim", label: "İlim/Sohbet Kat." },
      { key: "uni_kulupSayisi", label: "Kulüp" },
      { key: "uni_kulupKatilim", label: "Kulüp Kat." },
      { key: "uni_sosyalSayisi", label: "Sosyal" },
      { key: "uni_sosyalKatilim", label: "Sosyal Kat." },
      { key: "uni_sorumlulukSayisi", label: "Sos. Sorumluluk" },
      { key: "uni_sorumlulukKatilim", label: "Sos. Sor. Kat." },
      { key: "uni_muhabbetSayisi", label: "Muhabbet" },
      { key: "uni_muhabbetKatilim", label: "Muhabbet Kat." },
      { key: "uni_namazSayisi", label: "Namaz" },
      { key: "uni_namazKatilim", label: "Namaz Kat." },
      { key: "uni_kafileSayisi", label: "Kafile" },
      { key: "uni_kafileOgrenci", label: "Kafile Öğr." },
      { key: "uni_kykBulusmaSayisi", label: "KYK Buluşma" },
      { key: "uni_kykKatilim", label: "KYK Katılım" },
    ],
  },
  {
    baslik: "Ortak Faaliyetler", renk: "#B45309",
    alanlar: [
      { key: "ortakKafileSayisi", label: "Ortak Kafile" },
      { key: "ortakKafileLiseKatilim", label: "Kafile Liseli" },
      { key: "ortakKafileUniKatilim", label: "Kafile Üniversiteli" },
      { key: "ortakSabahNamaziSayisi", label: "Ortak Sabah Namazı" },
      { key: "ortakSabahNamaziLiseKatilim", label: "SN Liseli" },
      { key: "ortakSabahNamaziUniKatilim", label: "SN Üniversiteli" },
    ],
  },
  {
    baslik: "Ev / Apart / Yurt", renk: "#0891B2", birim: "BARINMA",
    alanlar: [
      { key: "eay_mevcutEv", label: "Mevcut Ev" },
      { key: "eay_mevcutApart", label: "Mevcut Apart" },
      { key: "eay_mevcutYurt", label: "Mevcut Yurt" },
      { key: "eay_acilacakEv", label: "Açılacak Ev" },
      { key: "eay_acilacakApart", label: "Açılacak Apart" },
      { key: "eay_acilacakYurt", label: "Açılacak Yurt" },
      { key: "eay_bursBalan", label: "Burs Bağlanan" },
      { key: "eay_iliskiKesme", label: "İlişik Kesme" },
      { key: "eay_toplamZiyaret", label: "Toplam Ziyaret" },
    ],
  },
];

type Veri = Record<string, string | number | boolean | null> | null;
interface Il {
  id: string;
  ad: string;
  sorumlu: { ad: string; email: string | null; telefon: string | null; sonAktif: string | null } | null;
  veri: Veri;
}

const sayi = (v: string | number | boolean | null | undefined) => (typeof v === "number" ? v : 0);

/** Birim durum rozeti stili (tablo "Birim Durumları" sütunu) */
function birimStil(d: BirimDurum) {
  if (d === "girildi") return { ikon: "✓", bg: "var(--bg-active)", fg: "var(--accent)" };
  if (d === "muaf") return { ikon: "—", bg: "rgba(120,113,108,0.12)", fg: "#57534E" };
  return { ikon: "✗", bg: "rgba(220,38,38,0.08)", fg: "#DC2626" };
}

export function BolgeIllerClient({
  bolgeAd, iller, yil, donem, yillar,
}: {
  bolgeAd: string; iller: Il[]; yil: number; donem: Donem; yillar: number[];
}) {
  const router = useRouter();
  const [secili, setSecili] = useState<Il | null>(null);

  const yilSecenekleri = useMemo(
    () => (yillar.includes(yil) ? yillar : [yil, ...yillar]),
    [yillar, yil]
  );

  function navigate(yeniYil: number, yeniDonem: string) {
    router.push(`/panel/bolge/iller?yil=${yeniYil}&donem=${yeniDonem}`);
  }

  const eksikSayisi = (i: Il) => BIRIMLER.filter(b => birimDurum(i.veri, b) === "girilmedi").length;
  const tamamSayi = iller.filter(i => eksikSayisi(i) === 0).length;

  const columns: DataTableColumn<Il>[] = [
    {
      key: "ad", header: "İl", mobile: true,
      render: i => <span className="font-bold text-heading">{i.ad}</span>,
    },
    {
      key: "sorumlu", header: "İl Eğitimcisi", mobile: true,
      sortValue: i => i.sorumlu?.ad ?? "",
      render: i => i.sorumlu
        ? (
          <div>
            <div className="text-sm text-secondary font-semibold">{i.sorumlu.ad}</div>
            {i.sorumlu.telefon && <div className="text-xs text-muted">{i.sorumlu.telefon}</div>}
          </div>
        )
        : <span className="text-xs text-muted italic">atanmamış</span>,
    },
    {
      key: "birimler", header: "Birim Durumları", sortable: false,
      render: i => (
        <div className="flex flex-wrap gap-1">
          {BIRIMLER.map(b => {
            const d = birimDurum(i.veri, b);
            const s = birimStil(d);
            return (
              <span key={b} title={durumEtiket(d, b)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold"
                style={{ background: s.bg, color: s.fg }}>
                {s.ikon} {BIRIM_KISA[b]}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: "durum", header: "Genel", mobile: true,
      sortValue: i => eksikSayisi(i),
      render: i => {
        const eksik = eksikSayisi(i);
        return eksik === 0
          ? <Badge tone="success">✓ Tamam</Badge>
          : <Badge tone="danger">{eksik} birim eksik</Badge>;
      },
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="sv-page-header" style={{ marginBottom: 0 }}>
          <h1>{bolgeAd} — İl Kontrol</h1>
          <p>İllerinizin il eğitimcileri tarafından girilen faaliyet verilerini görüntüleyin</p>
        </div>
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Yıl</span>
            <select value={yil} onChange={e => navigate(Number(e.target.value), donem)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Dönem</span>
            <select value={donem} onChange={e => navigate(yil, e.target.value)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {(Object.keys(DONEM_LABELS) as Donem[]).map(d => <option key={d} value={d}>{DONEM_LABELS[d]}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam İl", value: iller.length, renk: "var(--text-primary)" },
          { label: `Tamamlandı (${DONEM_LABELS[donem]})`, value: tamamSayi, renk: "var(--accent)" },
          { label: "Eksik Var", value: iller.length - tamamSayi, renk: "#DC2626" },
        ].map(s => (
          <div key={s.label} className="sv-section p-5">
            <p className="text-3xl font-black" style={{ color: s.renk }}>{s.value}</p>
            <p className="text-xs font-semibold mt-0.5 text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable
        id="bolge-iller"
        data={iller}
        columns={columns}
        rowKey={i => i.id}
        searchText={i => `${i.ad} ${i.sorumlu?.ad ?? ""}`}
        searchPlaceholder="İl veya eğitimci ara..."
        emptyText="Bölgenize henüz il atanmamış."
        onRowClick={setSecili}
        rowActions={i => <Button size="sm" variant="secondary" onClick={() => setSecili(i)}>Detay</Button>}
      />

      {/* İl detay — il eğitimcisinin girdiği tüm veriler (salt-okunur) */}
      <Modal
        open={!!secili}
        onClose={() => setSecili(null)}
        title={secili ? `${secili.ad} — ${yil} / ${DONEM_LABELS[donem]}` : ""}
        maxWidth={640}
      >
        {secili && (
          <div className="space-y-5">
            {secili.sorumlu && (
              <div className="rounded-xl border border-border p-3 text-[13px]" style={{ background: "var(--bg-subtle)" }}>
                <span className="font-bold text-heading">İl Eğitimcisi:</span>{" "}
                <span className="text-secondary">{secili.sorumlu.ad}</span>
                {secili.sorumlu.email && <span className="text-muted"> · {secili.sorumlu.email}</span>}
                {secili.sorumlu.telefon && <span className="text-muted"> · {secili.sorumlu.telefon}</span>}
              </div>
            )}

            {!secili.veri ? (
              <div className="rounded-xl border border-border p-8 text-center">
                <p className="text-[14px] font-semibold text-muted">Bu il bu dönemde henüz veri girmemiş.</p>
                <p className="text-[12.5px] text-muted mt-1">İl eğitimcisini takip edip hatırlatma yapabilirsiniz.</p>
              </div>
            ) : (
              BIRIM_GRUPLARI.map(grup => {
                const muaf = grup.birim ? birimDurum(secili.veri, grup.birim) === "muaf" : false;
                const doluAlanlar = grup.alanlar.filter(a => sayi(secili.veri![a.key]) > 0);
                const hepsiSifir = doluAlanlar.length === 0;
                return (
                  <div key={grup.baslik} className="sv-section overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: grup.renk }}>
                      <h3 className="text-white font-bold text-[13.5px]">{grup.baslik}</h3>
                      {muaf
                        ? <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>{durumEtiket("muaf", grup.birim!)}</span>
                        : hepsiSifir && <span className="text-white/70 text-[11px]">veri yok</span>}
                    </div>
                    {muaf ? (
                      <div className="p-4 text-center text-[12.5px] text-muted">
                        İl eğitimcisi bu birimi <strong>muaf</strong> işaretlemiş — bu dönem{" "}
                        {grup.birim === "BARINMA" ? "ilde ev/apart/yurt yok" : "birim çalışması yok"}.
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {grup.alanlar.map(a => {
                          const v = sayi(secili.veri![a.key]);
                          return (
                            <div key={a.key} className="rounded-lg border border-border px-3 py-2" style={{ opacity: v > 0 ? 1 : 0.45 }}>
                              <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted truncate" title={a.label}>{a.label}</p>
                              <p className="text-[18px] font-black mt-0.5" style={{ color: v > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>{v.toLocaleString("tr-TR")}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
