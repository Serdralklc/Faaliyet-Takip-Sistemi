import "server-only";

/**
 * Bellek-içi (best-effort) IP rate limit — sabit pencere.
 *
 * ⚠️ Vercel serverless'ta fonksiyon örnekleri arası PAYLAŞILMAZ ve soğuk başlangıçta
 * sıfırlanır; yalnızca aynı sıcak örneğe düşen ardışık istekleri kısar. Casual abuse'a
 * (tek tarayıcıdan form bombardımanı) karşı koruma sağlar, kararlı saldırıyı durdurmaz.
 * Düzgün/dağıtık koruma için Upstash veya Vercel KV gerekir.
 */

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

/** İstemci IP'sini çıkarır (proxy arkasında x-forwarded-for ilk değer). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * key için pencere başına en fazla `limit` isteğe izin verir.
 * ok=false ise istek reddedilmeli (429); retryAfterSec saniye sonra tekrar denenebilir.
 */
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();

  // Sızıntıyı önlemek için ara sıra süresi dolmuş kovaları temizle.
  if (store.size > 5000) {
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
  }

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

/** 429 yanıtı için ortak yardımcı (route'larda kullanılır). */
export function tooManyRequests(retryAfterSec: number) {
  return Response.json(
    { error: "Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
