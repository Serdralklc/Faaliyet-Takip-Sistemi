import { z } from "zod";
import { zKisaMetin } from "./validation";

/** Veri Tabloları — paylaşılan şema ve görünürlük yardımcıları (form sistemine paralel) */

export const SUTUN_TIPLERI = ["METIN", "SAYI", "TARIH", "SECIM", "DOSYA"] as const;
export type SutunTip = (typeof SUTUN_TIPLERI)[number];

export const SUTUN_TIP_LABEL: Record<SutunTip, string> = {
  METIN: "Metin",
  SAYI: "Sayı",
  TARIH: "Tarih",
  SECIM: "Seçim",
  DOSYA: "Dosya",
};

export const sutunSchema = z.object({
  baslik: zKisaMetin,
  tip: z.enum(SUTUN_TIPLERI),
  zorunlu: z.boolean().optional().default(false),
  secenekler: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
});

export const veriTabloSchema = z
  .object({
    baslik: zKisaMetin,
    aciklama: z.string().trim().max(20000).optional(), // zengin metin (HTML)
    hedefBolge: z.boolean().optional().default(false),
    hedefIl: z.boolean().optional().default(false),
    sistemEgitim: z.boolean().optional().default(false),
    sistemUniversite: z.boolean().optional().default(false),
    sistemLise: z.boolean().optional().default(false),
    sutunlar: z.array(sutunSchema).min(1, "En az bir sütun ekleyin.").max(40),
  })
  .refine(d => d.hedefBolge || d.hedefIl, "En az bir hedef kitle seçin (bölge ve/veya il sorumluları).")
  .refine(d => d.sistemEgitim || d.sistemUniversite || d.sistemLise, "En az bir sistem seçin.")
  .refine(
    d => d.sutunlar.every(s => s.tip !== "SECIM" || s.secenekler.length >= 1),
    "Seçim sütunlarında en az 1 seçenek olmalı."
  );

/** Bir satırın hücre değerleri */
export const kayitDegerSchema = z.union([
  z.string().max(5000),
  z.number(),
  z.object({ dosyaId: z.string(), ad: z.string().max(300), url: z.string().max(1000) }),
]);

/** Satır gönderimi — kullanıcı kendi tüm satırlarını toplu kaydeder (değişken sayıda) */
export const kayitlarSchema = z.object({
  satirlar: z.array(z.record(z.string(), kayitDegerSchema)).max(2000),
});

/** Kullanıcının görünürlük kapsamı — bölge/il sorumluları, sistemine göre (formWhere ile aynı) */
export function veriTabloWhere(user: { role: string; sistem?: string | null }) {
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
