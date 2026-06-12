/**
 * Ortak zod doğrulama primitifleri ve yardımcıları.
 * API route'ları gövde doğrulamasını parseJson() ile yapar:
 *
 *   const r = await parseJson(req, schema);
 *   if ("error" in r) return r.error;
 *   const data = r.data;
 */

import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Telefonu normalize eder: rakam dışı her şeyi atar,
 * +90/90 önekini kaldırır, 5xx ile başlayan 10 haneye 0 ekler.
 * "0555 123 45 67" ve "05551234567" aynı değere iner —
 * Volunteer.telefon unique anahtarının tutarlılığı için kritik.
 */
export function normalizePhone(input: string): string {
  let d = (input ?? "").replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith("5")) d = "0" + d;
  return d;
}

/** Zorunlu cep telefonu — normalize edip 05xxxxxxxxx formatını şart koşar */
export const zTelefon = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine(v => /^05\d{9}$/.test(v), "Geçerli bir cep telefonu girin (05xx xxx xx xx).");

/** Opsiyonel telefon — boş geçilebilir, doluysa normalize edilip doğrulanır */
export const zTelefonOptional = z
  .string()
  .trim()
  .transform(v => (v ? normalizePhone(v) : ""))
  .refine(v => v === "" || /^0\d{10}$/.test(v), "Geçerli bir telefon girin.")
  .optional();

export const zEmail = z.email("Geçerli bir e-posta adresi girin.").trim().toLowerCase();

/** Opsiyonel e-posta — boş string'i undefined'a çevirir */
export const zEmailOptional = z.preprocess(
  v => (typeof v === "string" && v.trim() === "" ? undefined : v),
  zEmail.optional()
);

export const zPassword = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .max(72, "Şifre en fazla 72 karakter olabilir.");

export const zAdSoyad = z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(120);
export const zKisaMetin = z.string().trim().min(1, "Bu alan zorunludur.").max(200);
export const zKisaMetinOptional = z.string().trim().max(200).optional();
export const zUzunMetin = z.string().trim().min(1, "Bu alan zorunludur.").max(5000);
export const zPozitifSayi = z.coerce.number().int("Tam sayı girin.").min(0, "Negatif olamaz.").max(1_000_000);
export const zYil = z.coerce.number().int().min(2020).max(2100);
export const zId = z.string().trim().min(1, "ID gerekli.").max(64);

/**
 * İstek gövdesini şemayla doğrular.
 * Hata durumunda Türkçe mesajlı 400 yanıtı döndürür.
 */
export async function parseJson<S extends z.ZodType>(
  req: Request,
  schema: S
): Promise<{ data: z.output<S> } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first.path.length ? `${first.path.join(".")}: ` : "";
    return {
      error: NextResponse.json({ error: `${field}${first.message}` }, { status: 400 }),
    };
  }
  return { data: result.data };
}

/**
 * Liste endpoint'leri için sayfalama parametrelerini okur.
 * page/limit verilmemişse legacy mod: sayfalama yok ama sert tavan uygulanır.
 */
export function readPagination(searchParams: URLSearchParams, defaults?: { limit?: number; maxLimit?: number }) {
  const maxLimit = defaults?.maxLimit ?? 100;
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  if (rawPage === null && rawLimit === null) {
    return { paged: false as const, take: 500 };
  }
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(rawLimit ?? String(defaults?.limit ?? 25), 10) || 25));
  return { paged: true as const, page, limit, skip: (page - 1) * limit, take: limit };
}
