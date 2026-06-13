import "server-only";

/**
 * Gemini istemcisi — Google Generative Language REST API'sine fetch ile bağlanır.
 * Ekstra SDK paketi yok; bağımlılık ve sürüm sorunlarını azaltır.
 * Function calling (araç çağırma) destekler.
 *
 * Ortam değişkenleri (.env):
 *   GEMINI_API_KEY   — zorunlu (https://aistudio.google.com/apikey)
 *   GEMINI_MODEL     — opsiyonel, varsayılan "gemini-2.5-flash"
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// gemini-2.5-flash: bu anahtarın projesinde ücretsiz katman aktif (gemini-2.0-flash'ta kota 0).
const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_ARAC_TURU = 5; // sonsuz döngü koruması

export type GeminiRol = "user" | "model";
export interface GeminiMesaj {
  rol: GeminiRol;
  metin: string;
}

// Gemini "contents" parça tipleri
type Part =
  | { text: string }
  | { functionCall: { name: string; args?: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };
interface Content {
  role: "user" | "model";
  parts: Part[];
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

/**
 * API anahtarını döner. İki isim de kabul edilir: GEMINI_API_KEY (öncelikli)
 * veya GEMINI_API_KEY_SV. Böylece Railway'de hangisi tanımlıysa çalışır.
 */
function apiKey(): string {
  return (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY_SV?.trim() || "");
}

export function geminiYapilandirildiMi(): boolean {
  return Boolean(apiKey());
}

/** Düşük seviyeli tek API çağrısı — ilk adayın content'ini döner. */
async function callGemini(body: Record<string, unknown>): Promise<Content> {
  const key = apiKey();
  if (!key) throw new GeminiError("GEMINI_API_KEY tanımlı değil.", 500);
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiError("Gemini sunucusuna ulaşılamadı (ağ hatası).", 502);
  }

  if (!res.ok) {
    let detay = "";
    try {
      const j = await res.json();
      detay = j?.error?.message ?? "";
    } catch {
      /* gövde okunamadı */
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new GeminiError(`Gemini istek hatası: ${detay || res.statusText}`, res.status);
    }
    if (res.status === 429) {
      throw new GeminiError("Gemini kota sınırı aşıldı. Biraz sonra tekrar deneyin.", 429);
    }
    throw new GeminiError(`Gemini hatası (${res.status}): ${detay || res.statusText}`, 502);
  }

  const data = await res.json();
  const cand = data?.candidates?.[0];
  if (!cand) {
    throw new GeminiError("Gemini'den boş cevap geldi.", 502);
  }
  if (cand.finishReason === "SAFETY") {
    throw new GeminiError("Cevap güvenlik filtresine takıldı.", 422);
  }
  return cand.content as Content;
}

function partlardanMetin(parts: Part[] | undefined): string {
  if (!parts) return "";
  return parts
    .map((p) => ("text" in p ? p.text : ""))
    .join("")
    .trim();
}

/**
 * Basit (araçsız) sohbet — genel soru-cevap.
 */
export async function geminiSohbet(system: string, mesajlar: GeminiMesaj[]): Promise<string> {
  const content = await callGemini({
    system_instruction: { parts: [{ text: system }] },
    contents: mesajlar.map((m) => ({ role: m.rol, parts: [{ text: m.metin }] })),
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });
  const text = partlardanMetin(content?.parts);
  if (!text) throw new GeminiError("Gemini'den boş cevap geldi.", 502);
  return text;
}

/**
 * Araçlı (function calling) sohbet. Gemini bir araç çağırırsa dispatch ile çalıştırır,
 * sonucu modele geri verir; model nihai metni üretene kadar (en çok MAX_ARAC_TURU) döner.
 * @returns nihai metin + çağrılan araçların kaydı (PDF/Excel ve UI için kullanılabilir)
 */
export async function geminiSohbetAraclarla(
  system: string,
  mesajlar: GeminiMesaj[],
  tools: unknown,
  dispatch: (isim: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>,
): Promise<{ metin: string; aracCagrilari: { isim: string; args: Record<string, unknown>; sonuc: Record<string, unknown> }[] }> {
  const contents: Content[] = mesajlar.map((m) => ({ role: m.rol, parts: [{ text: m.metin }] }));
  const aracCagrilari: { isim: string; args: Record<string, unknown>; sonuc: Record<string, unknown> }[] = [];

  for (let tur = 0; tur < MAX_ARAC_TURU; tur++) {
    const content = await callGemini({
      system_instruction: { parts: [{ text: system }] },
      contents,
      tools,
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });

    const parts = content?.parts ?? [];
    const fnCalls = parts.filter((p): p is { functionCall: { name: string; args?: Record<string, unknown> } } => "functionCall" in p);

    if (fnCalls.length === 0) {
      const text = partlardanMetin(parts);
      if (!text) throw new GeminiError("Gemini'den boş cevap geldi.", 502);
      return { metin: text, aracCagrilari };
    }

    // Modelin araç çağrısı turunu ekle
    contents.push({ role: "model", parts });

    // Araçları çalıştır, yanıtları tek bir turda topla
    const respParts: Part[] = [];
    for (const fc of fnCalls) {
      const isim = fc.functionCall.name;
      const args = fc.functionCall.args ?? {};
      const sonuc = await dispatch(isim, args);
      aracCagrilari.push({ isim, args, sonuc });
      respParts.push({ functionResponse: { name: isim, response: sonuc } });
    }
    contents.push({ role: "user", parts: respParts });
  }

  throw new GeminiError("Asistan çok fazla adım denedi; soruyu sadeleştirip tekrar deneyin.", 502);
}
