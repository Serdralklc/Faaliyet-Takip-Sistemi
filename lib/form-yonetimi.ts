import { z } from "zod";
import { zKisaMetin } from "./validation";

/** Dinamik form — paylaşılan şema ve görünürlük yardımcıları */

/** Tüm soru tipleri (mevcut 7 + Veri Toplama Merkezi geliştirmesi 6) */
export const TUM_SORU_TIPLERI = [
  "KISA_METIN", "UZUN_METIN", "SAYI", "TARIH", "TEK_SECIM", "COKLU_SECIM", "DOSYA",
  "SAAT", "TELEFON", "EPOSTA", "ACILIR_LISTE", "EVET_HAYIR", "BOLUM",
] as const;
export type SoruTip = (typeof TUM_SORU_TIPLERI)[number];

export const SORU_TIP_LABEL: Record<SoruTip, string> = {
  KISA_METIN: "Kısa Metin",
  UZUN_METIN: "Uzun Metin",
  SAYI: "Sayı",
  TARIH: "Tarih",
  SAAT: "Saat",
  TELEFON: "Telefon",
  EPOSTA: "E-Posta",
  TEK_SECIM: "Tek Seçim",
  COKLU_SECIM: "Çoklu Seçim",
  ACILIR_LISTE: "Açılır Liste",
  EVET_HAYIR: "Evet / Hayır",
  DOSYA: "Dosya Yükleme",
  BOLUM: "Bölüm Başlığı",
};

/** Seçenek listesi gereken tipler (TEK_SECIM / COKLU_SECIM / ACILIR_LISTE) */
export const seceneklimi = (tip: string): boolean =>
  tip === "TEK_SECIM" || tip === "COKLU_SECIM" || tip === "ACILIR_LISTE";

/** Cevap toplamayan, yalnız gruplayan tip (Bölüm başlığı) */
export const cevapsizTip = (tip: string): boolean => tip === "BOLUM";

/** Bir soruya koşul bağlanabilecek (cevabı belirli değerlere eşit olabilen) tipler */
export const kosulKaynagiOlabilir = (tip: string): boolean =>
  tip === "TEK_SECIM" || tip === "ACILIR_LISTE" || tip === "EVET_HAYIR";

/**
 * Koşullu görünürlük — doldurma ekranı VE sunucu doğrulaması ortak kullanır.
 * kosulSoruId = bağlı olunan sorunun SIRA index'i (string); o sorunun cevabı
 * kosulDeger'e eşit (veya çoklu seçimde içeriyorsa) bu soru görünür.
 */
export function formSoruGorunur(
  soru: { kosulSoruId?: string | null; kosulDeger?: string | null },
  sorular: { id: string; sira: number }[],
  cevaplar: Record<string, unknown>,
): boolean {
  if (!soru.kosulSoruId) return true;
  const idx = Number(soru.kosulSoruId);
  if (!Number.isInteger(idx)) return true;
  const kaynak = sorular.find(s => s.sira === idx);
  if (!kaynak) return true; // kaynak yoksa güvenli tarafta: göster
  const c = cevaplar[kaynak.id];
  const hedef = soru.kosulDeger ?? "";
  if (Array.isArray(c)) return (c as unknown[]).map(String).includes(hedef);
  return String(c ?? "") === hedef;
}

export const soruSchema = z.object({
  etiket: zKisaMetin,
  tip: z.enum(TUM_SORU_TIPLERI),
  zorunlu: z.boolean().optional().default(false),
  secenekler: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
  // ── Veri Toplama Merkezi geliştirmesi (hepsi opsiyonel; eski formlar etkilenmez) ──
  /** Soru/bölüm altı açıklama metni */
  aciklama: z.string().trim().max(2000).optional().nullable(),
  /** Koşullu görünürlük: bağlı olunan sorunun SIRA index'i (string) — null = her zaman görünür */
  kosulSoruId: z.string().trim().max(20).optional().nullable(),
  /** Koşul değeri: kosulSoruId'li sorunun cevabı buna eşitse/içeriyorsa görünür */
  kosulDeger: z.string().trim().max(200).optional().nullable(),
});

export const formSchema = z
  .object({
    baslik: zKisaMetin,
    aciklama: z.string().trim().max(20000).optional(), // zengin metin (HTML) taşır
    hedefBolge: z.boolean().optional().default(false),
    hedefIl: z.boolean().optional().default(false),
    sistemEgitim: z.boolean().optional().default(false),
    sistemUniversite: z.boolean().optional().default(false),
    sistemLise: z.boolean().optional().default(false),
    sorular: z.array(soruSchema).min(1, "En az bir soru ekleyin.").max(100),
  })
  .refine(d => d.hedefBolge || d.hedefIl, "En az bir hedef kitle seçin (bölge ve/veya il sorumluları).")
  .refine(d => d.sistemEgitim || d.sistemUniversite || d.sistemLise, "En az bir sistem seçin.")
  .refine(
    d => d.sorular.every(s => !seceneklimi(s.tip) || s.secenekler.length >= 2),
    "Seçim / açılır liste sorularında en az 2 seçenek olmalı."
  );

/** Kullanıcının görünürlük kapsamı — bölge/il sorumluları, sistemine göre */
export function formWhere(user: { role: string; sistem?: string | null }) {
  const rolFiltre =
    user.role === "BOLGE_SORUMLUSU" ? { hedefBolge: true } :
    user.role === "IL_SORUMLUSU" ? { hedefIl: true } : null;
  if (!rolFiltre) return null;

  const sistemFiltre =
    user.sistem === "UNIVERSITE" ? { sistemUniversite: true } :
    user.sistem === "LISE" ? { sistemLise: true } :
    { sistemEgitim: true };

  return { durum: "YAYINDA" as const, ...rolFiltre, ...sistemFiltre };
}
