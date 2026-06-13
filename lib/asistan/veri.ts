import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Asistan veri katmanı — Gemini'nin çağırdığı güvenli sorgu fonksiyonları.
 * Tüm sayılar uygulamanın mevcut raporlarıyla BİREBİR aynı formülle hesaplanır
 * (kaynak: app/panel/bolge/raporlar + app/panel/bolge/performans).
 *
 * Bu fonksiyonlar yalnızca OKUMA yapar; hiçbir veri değiştirmez.
 */

export const DONEM_LABEL: Record<string, string> = {
  DONEM_1: "1. Dönem",
  DONEM_2: "2. Dönem",
  YAZ_DONEMI: "Yaz Dönemi",
};

const GECERLI_DONEMLER = ["DONEM_1", "DONEM_2", "YAZ_DONEMI"] as const;
export type DonemTip = (typeof GECERLI_DONEMLER)[number];

export function donemNormalize(d?: string | null): DonemTip | null {
  if (!d) return null;
  const t = d.toString().trim().toUpperCase().replace(/\s|\./g, "");
  if (t === "1" || t === "DONEM1" || t === "1DONEM" || t === "DONEM_1") return "DONEM_1";
  if (t === "2" || t === "DONEM2" || t === "2DONEM" || t === "DONEM_2") return "DONEM_2";
  if (t.includes("YAZ")) return "YAZ_DONEMI";
  if ((GECERLI_DONEMLER as readonly string[]).includes(d)) return d as DonemTip;
  return null;
}

/** Veri bulunan en güncel yıl; yoksa takvim yılı. */
export async function varsayilanYil(): Promise<number> {
  const son = await prisma.activity.findFirst({
    orderBy: { yil: "desc" },
    select: { yil: true },
  });
  return son?.yil ?? new Date().getFullYear();
}

// ── Alan → Türkçe etiket eşlemeleri (UI ile birebir) ───────────────
const IK_ALANLAR: [string, string][] = [
  ["ik_toplamDergah", "Toplam Dergah Sayısı"],
  ["ik_kursuYapilanDergah", "Hafta Sonu Kursu Yapılan Dergah"],
  ["ik_egitmenSayisi", "Eğitmen Sayısı"],
  ["ik_egitmenYardimciSayisi", "Eğitmen Yardımcısı Sayısı"],
  ["ik_elifBaOgrenci", "Elif-Ba'dan Başlayan Öğrenci"],
  ["ik_kuranOgrenci", "Kuran-ı Kerim'den Başlayan Öğrenci"],
  ["ik_gecisOgrenci", "Elif-Ba'dan Kuran'a Geçen Öğrenci"],
];

const LS_ALANLAR: [string, string][] = [
  ["ls_toplamDergah", "Toplam Dergâh Sayısı"],
  ["ls_ilimSohbetDergah", "İlim/Sohbet Yapılan Dergâh"],
  ["ls_liseliOgrenciSayisi", "Toplam Liseli Öğrenci"],
  ["ls_mezunOgrenci", "Bu Yıl Mezun Olacak Öğrenci"],
  ["ls_yeniIntisap", "Yeni İntisap Eden Öğrenci"],
  ["ls_ilimSohbetSayisi", "İlim/Sohbet Faaliyeti Sayısı"],
  ["ls_ilimSohbetKatilim", "İlim/Sohbet Katılımı"],
  ["ls_sosyalSayisi", "Sosyal Faaliyet Sayısı"],
  ["ls_sosyalKatilim", "Sosyal Faaliyet Katılımı"],
  ["ls_sorumlulukSayisi", "Sosyal Sorumluluk Sayısı"],
  ["ls_sorumlulukKatilim", "Sosyal Sorumluluk Katılımı"],
  ["ls_muhabbetSayisi", "Muhabbet Buluşması Sayısı"],
  ["ls_muhabbetKatilim", "Muhabbet Buluşması Katılımı"],
  ["ls_namazSayisi", "Namaz Buluşması Sayısı"],
  ["ls_namazKatilim", "Namaz Buluşması Katılımı"],
  ["ls_kafileSayisi", "Kafile Sayısı"],
  ["ls_kafileOgrenci", "Kafileye Katılan Öğrenci"],
];

const UNI_ALANLAR: [string, string][] = [
  ["uni_toplamDergah", "Toplam Dergâh Sayısı"],
  ["uni_ilimSohbetDergah", "İlim/Sohbet Yapılan Dergâh"],
  ["uni_universiteliOgrenciSayisi", "Toplam Üniversiteli Öğrenci"],
  ["uni_sonSinifOgrenci", "Son Sınıf Öğrenci"],
  ["uni_yeniIntisap", "Yeni İntisap Eden Öğrenci"],
  ["uni_aktifKulup", "Aktif Kulüp Sayısı"],
  ["uni_ilimSohbetSayisi", "İlim/Sohbet Faaliyeti Sayısı"],
  ["uni_ilimSohbetKatilim", "İlim/Sohbet Katılımı"],
  ["uni_kulupSayisi", "Kulüp Faaliyeti Sayısı"],
  ["uni_kulupKatilim", "Kulüp Faaliyeti Katılımı"],
  ["uni_sosyalSayisi", "Sosyal Faaliyet Sayısı"],
  ["uni_sosyalKatilim", "Sosyal Faaliyet Katılımı"],
  ["uni_sorumlulukSayisi", "Sosyal Sorumluluk Sayısı"],
  ["uni_sorumlulukKatilim", "Sosyal Sorumluluk Katılımı"],
  ["uni_muhabbetSayisi", "Muhabbet Buluşması Sayısı"],
  ["uni_muhabbetKatilim", "Muhabbet Buluşması Katılımı"],
  ["uni_namazSayisi", "Namaz Buluşması Sayısı"],
  ["uni_namazKatilim", "Namaz Buluşması Katılımı"],
  ["uni_kafileSayisi", "Kafile Sayısı"],
  ["uni_kafileOgrenci", "Kafileye Katılan Öğrenci"],
  ["uni_kykBulusmaSayisi", "KYK Buluşması Sayısı"],
  ["uni_kykKatilim", "KYK Buluşması Katılımı"],
];

const EAY_ALANLAR: [string, string][] = [
  ["eay_mevcutEv", "Mevcut Ev"],
  ["eay_mevcutApart", "Mevcut Apart"],
  ["eay_mevcutYurt", "Mevcut Yurt"],
  ["eay_acilacakEv", "Açılacak Ev"],
  ["eay_acilacakApart", "Açılacak Apart"],
  ["eay_acilacakYurt", "Açılacak Yurt"],
  ["eay_kapanacakEv", "Kapanacak Ev"],
  ["eay_kapanacakApart", "Kapanacak Apart"],
  ["eay_kapanacakYurt", "Kapanacak Yurt"],
  ["eay_bursBalan", "Burs Bağlanan"], // şemadaki alan adı: eay_bursBalan
  ["eay_iliskiKesme", "İlişki Kesme"],
  ["eay_toplamZiyaret", "Toplam Ziyaret"],
];

type AktiviteSum = Record<string, number>;

function bosSum(): AktiviteSum {
  return {};
}

/** Bir Activity dizisini etiketli toplama indirger. */
function topla(activities: any[], alanlar: [string, string][]): AktiviteSum {
  const out: AktiviteSum = {};
  for (const [key, label] of alanlar) {
    let s = 0;
    for (const a of activities) s += (a?.[key] as number) ?? 0;
    out[label] = s;
  }
  return out;
}

function lsToplamFaaliyet(a: any): number {
  return (a?.ls_ilimSohbetSayisi ?? 0) + (a?.ls_sosyalSayisi ?? 0) + (a?.ls_sorumlulukSayisi ?? 0) +
    (a?.ls_muhabbetSayisi ?? 0) + (a?.ls_namazSayisi ?? 0) + (a?.ls_kafileSayisi ?? 0);
}
function uniToplamFaaliyet(a: any): number {
  return (a?.uni_ilimSohbetSayisi ?? 0) + (a?.uni_kulupSayisi ?? 0) + (a?.uni_sosyalSayisi ?? 0) +
    (a?.uni_sorumlulukSayisi ?? 0) + (a?.uni_muhabbetSayisi ?? 0) + (a?.uni_namazSayisi ?? 0) +
    (a?.uni_kafileSayisi ?? 0) + (a?.uni_kykBulusmaSayisi ?? 0);
}

async function bolgeIllerActivities(bolgeNo: number, yil: number, donem?: DonemTip | null) {
  const bolge = await prisma.bolge.findUnique({
    where: { no: bolgeNo },
    include: {
      iller: {
        include: {
          activities: {
            where: { yil, ...(donem ? { donem } : {}) },
          },
        },
      },
    },
  });
  return bolge;
}

// ── 1) Bölge listesi ───────────────────────────────────────────────
export async function bolgeleriListele() {
  const bolgeler = await prisma.bolge.findMany({
    orderBy: { no: "asc" },
    include: { _count: { select: { iller: true } } },
  });
  return {
    bolgeSayisi: bolgeler.length,
    bolgeler: bolgeler.map((b) => ({ no: b.no, ad: b.ad, ilSayisi: b._count.iller })),
  };
}

// ── 2) Bölge özeti (ilköğretim/lise/üniversite/barınma) ────────────
export async function bolgeOzeti(args: { bolgeNo: number; yil?: number; donem?: string | null }) {
  const yil = args.yil ?? (await varsayilanYil());
  const donem = donemNormalize(args.donem);
  const bolge = await bolgeIllerActivities(args.bolgeNo, yil, donem);
  if (!bolge) return { hata: `${args.bolgeNo}. bölge bulunamadı.` };

  const tumActivities = bolge.iller.flatMap((il) => il.activities);
  const veriGirenIl = bolge.iller.filter((il) => il.activities.length > 0).length;

  const lsTop = tumActivities.reduce((s, a) => s + lsToplamFaaliyet(a), 0);
  const uniTop = tumActivities.reduce((s, a) => s + uniToplamFaaliyet(a), 0);

  return {
    bolge: { no: bolge.no, ad: bolge.ad },
    yil,
    donem: donem ? DONEM_LABEL[donem] : "Tüm dönemler",
    ilSayisi: bolge.iller.length,
    veriGirenIlSayisi: veriGirenIl,
    ilkogretim: topla(tumActivities, IK_ALANLAR),
    lise: { ...topla(tumActivities, LS_ALANLAR), "Toplam Lise Faaliyeti (6 tür)": lsTop },
    universite: { ...topla(tumActivities, UNI_ALANLAR), "Toplam Üniversite Faaliyeti (8 tür)": uniTop },
    barinma: topla(tumActivities, EAY_ALANLAR),
    not: veriGirenIl === 0 ? "Bu dönem için hiçbir ile veri girilmemiş." : undefined,
  };
}

// ── 3) Dönem kıyaslaması (1. vs 2.) ────────────────────────────────
export async function bolgeDonemKiyas(args: { bolgeNo: number; yil?: number }) {
  const yil = args.yil ?? (await varsayilanYil());
  const d1 = await bolgeOzeti({ bolgeNo: args.bolgeNo, yil, donem: "DONEM_1" });
  if ("hata" in d1) return d1;
  const d2 = await bolgeOzeti({ bolgeNo: args.bolgeNo, yil, donem: "DONEM_2" });

  // Manşet metrikler için kısa kıyas (yeni intisap, toplam faaliyet vb.)
  const ozet = (o: any) => ({
    yeniIntisap: (o.lise["Yeni İntisap Eden Öğrenci"] ?? 0) + (o.universite["Yeni İntisap Eden Öğrenci"] ?? 0),
    liseFaaliyet: o.lise["Toplam Lise Faaliyeti (6 tür)"] ?? 0,
    universiteFaaliyet: o.universite["Toplam Üniversite Faaliyeti (8 tür)"] ?? 0,
    toplamZiyaret: o.barinma["Toplam Ziyaret"] ?? 0,
  });
  const m1 = ozet(d1);
  const m2 = "hata" in d2 ? { yeniIntisap: 0, liseFaaliyet: 0, universiteFaaliyet: 0, toplamZiyaret: 0 } : ozet(d2);
  const fark: Record<string, number> = {};
  for (const k of Object.keys(m1) as (keyof typeof m1)[]) fark[k] = (m2[k] ?? 0) - m1[k];

  return {
    bolge: d1.bolge,
    yil,
    donem1: d1,
    donem2: d2,
    mansetKiyas: {
      "1. Dönem": m1,
      "2. Dönem": m2,
      "Fark (2-1)": fark,
    },
  };
}

// ── 4) Hedef vs gerçekleşme ────────────────────────────────────────
const HEDEF_ALANLARI: [string, string][] = [
  ["yeniIntisap", "Yeni İntisap"],
  ["sosyalFaaliyet", "Sosyal Faaliyet"],
  ["kafile", "Kafile"],
  ["sabahNamazi", "Sabah Namazı"],
  ["ilimDersi", "İlim Dersi"],
  ["kykBulusma", "KYK Buluşması"],
  ["ziyaret", "Ziyaret"],
];

function gerceklesen(activities: any[]): Record<string, number> {
  const sum = (fn: (a: any) => number) => activities.reduce((s, a) => s + fn(a), 0);
  return {
    yeniIntisap: sum((f) => (f.ls_yeniIntisap ?? 0) + (f.uni_yeniIntisap ?? 0)),
    sosyalFaaliyet: sum((f) => lsToplamFaaliyet(f) + uniToplamFaaliyet(f)),
    kafile: sum((f) => (f.ls_kafileSayisi ?? 0) + (f.uni_kafileSayisi ?? 0) + (f.ortakKafileSayisi ?? 0)),
    sabahNamazi: sum((f) => (f.ls_namazSayisi ?? 0) + (f.uni_namazSayisi ?? 0) + (f.ortakSabahNamaziSayisi ?? 0)),
    ilimDersi: sum((f) => (f.ls_ilimSohbetKatilim ?? 0) + (f.uni_ilimSohbetKatilim ?? 0)),
    kykBulusma: sum((f) => f.uni_kykBulusmaSayisi ?? 0),
    ziyaret: sum((f) => f.eay_toplamZiyaret ?? 0),
  };
}

export async function hedefGerceklesme(args: { bolgeNo: number; yil?: number; donem?: string | null }) {
  const yil = args.yil ?? (await varsayilanYil());
  const donem = donemNormalize(args.donem) ?? "DONEM_1";
  const bolge = await bolgeIllerActivities(args.bolgeNo, yil, donem);
  if (!bolge) return { hata: `${args.bolgeNo}. bölge bulunamadı.` };

  const hedef = await prisma.bolgeHedef.findUnique({
    where: { bolgeId_yil_donem: { bolgeId: bolge.id, yil, donem } },
  });
  const tumActivities = bolge.iller.flatMap((il) => il.activities);
  const g = gerceklesen(tumActivities);

  const satirlar = HEDEF_ALANLARI.map(([key, label]) => {
    const h = (hedef as any)?.[key] ?? 0;
    const gv = g[key] ?? 0;
    return {
      metrik: label,
      hedef: h,
      gerceklesen: gv,
      yuzde: h ? Math.round((gv / h) * 100) : null,
    };
  });

  return {
    bolge: { no: bolge.no, ad: bolge.ad },
    yil,
    donem: DONEM_LABEL[donem],
    hedefTanimli: Boolean(hedef),
    satirlar,
    not: hedef ? undefined : "Bu bölge/dönem için Genel Merkez henüz hedef tanımlamamış.",
  };
}

// ── 5) Barınma (ev/apart/yurt) öğrenci listesi ─────────────────────
const TIP_LABEL: Record<string, string> = { EV: "Ev", APART: "Apart", YURT: "Yurt" };

export async function barinmaOgrencileri(args: { bolgeNo: number; tip?: string | null }) {
  const bolge = await prisma.bolge.findUnique({ where: { no: args.bolgeNo } });
  if (!bolge) return { hata: `${args.bolgeNo}. bölge bulunamadı.` };

  const tip = args.tip ? args.tip.toString().trim().toUpperCase() : null;
  const tipFiltre = tip && ["EV", "APART", "YURT"].includes(tip) ? tip : null;

  const birimler = await prisma.housingUnit.findMany({
    where: {
      aktif: true,
      ...(tipFiltre ? { tip: tipFiltre } : {}),
      il: { bolgeId: bolge.id },
    },
    include: {
      il: { select: { ad: true } },
      ogrenciler: {
        orderBy: { adSoyad: "asc" },
        select: { adSoyad: true, bolum: true, sinif: true, bursMu: true },
      },
    },
    orderBy: [{ tip: "asc" }, { ad: "asc" }],
  });

  const ogrenciler = birimler.flatMap((b) =>
    b.ogrenciler.map((o) => ({
      adSoyad: o.adSoyad,
      il: b.il.ad,
      birim: `${TIP_LABEL[b.tip] ?? b.tip} — ${b.ad}`,
      tip: TIP_LABEL[b.tip] ?? b.tip,
      bolum: o.bolum || undefined,
      sinif: o.sinif || undefined,
      burslu: o.bursMu,
    })),
  );

  return {
    bolge: { no: bolge.no, ad: bolge.ad },
    tip: tipFiltre ? TIP_LABEL[tipFiltre] : "Tümü (ev+apart+yurt)",
    birimSayisi: birimler.length,
    ogrenciSayisi: ogrenciler.length,
    ogrenciler,
    not: ogrenciler.length === 0 ? "Bu bölgede kayıtlı barınma öğrencisi bulunamadı." : undefined,
  };
}
