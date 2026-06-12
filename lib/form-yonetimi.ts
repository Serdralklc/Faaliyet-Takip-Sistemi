import { z } from "zod";
import { zKisaMetin } from "./validation";

/** Dinamik form — paylaşılan şema ve görünürlük yardımcıları */

export const soruSchema = z.object({
  etiket: zKisaMetin,
  tip: z.enum(["KISA_METIN", "UZUN_METIN", "SAYI", "TARIH", "TEK_SECIM", "COKLU_SECIM", "DOSYA"]),
  zorunlu: z.boolean().optional().default(false),
  secenekler: z.array(z.string().trim().min(1).max(200)).max(50).optional().default([]),
});

export const formSchema = z
  .object({
    baslik: zKisaMetin,
    aciklama: z.string().trim().max(2000).optional(),
    hedefBolge: z.boolean().optional().default(false),
    hedefIl: z.boolean().optional().default(false),
    sistemEgitim: z.boolean().optional().default(false),
    sistemUniversite: z.boolean().optional().default(false),
    sistemLise: z.boolean().optional().default(false),
    sorular: z.array(soruSchema).min(1, "En az bir soru ekleyin.").max(60),
  })
  .refine(d => d.hedefBolge || d.hedefIl, "En az bir hedef kitle seçin (bölge ve/veya il sorumluları).")
  .refine(d => d.sistemEgitim || d.sistemUniversite || d.sistemLise, "En az bir sistem seçin.")
  .refine(
    d => d.sorular.every(s => (s.tip !== "TEK_SECIM" && s.tip !== "COKLU_SECIM") || s.secenekler.length >= 2),
    "Seçim sorularında en az 2 seçenek olmalı."
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
