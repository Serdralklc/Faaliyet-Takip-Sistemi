import { z } from "zod";
import { zKisaMetin } from "./validation";
import { soruSchema } from "./form-yonetimi";
import { sutunSchema } from "./veri-tablosu";

/** Şablonlar — hazır form / veri tablosu iskeletleri */

export const SABLON_TURLERI = ["FORM", "VERI_TABLOSU"] as const;
export type SablonTur = (typeof SABLON_TURLERI)[number];

export const SABLON_TUR_LABEL: Record<SablonTur, string> = {
  FORM: "Form",
  VERI_TABLOSU: "Veri Tablosu",
};

export const sablonSchema = z.object({
  ad: zKisaMetin,
  aciklama: z.string().trim().max(500).optional(),
  tur: z.enum(SABLON_TURLERI),
  icerik: z.union([
    z.object({ sorular: z.array(soruSchema).min(1).max(100) }),
    z.object({ sutunlar: z.array(sutunSchema).min(1).max(40) }),
  ]),
});
