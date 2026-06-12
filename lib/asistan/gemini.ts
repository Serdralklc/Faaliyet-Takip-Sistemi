import "server-only";

/**
 * Gemini istemcisi — Google Generative Language REST API'sine fetch ile bağlanır.
 * Ekstra SDK paketi yok; bağımlılık ve sürüm sorunlarını azaltır.
 *
 * Ortam değişkenleri (.env):
 *   GEMINI_API_KEY   — zorunlu (https://aistudio.google.com/apikey)
 *   GEMINI_MODEL     — opsiyonel, varsayılan "gemini-2.5-flash"
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
// gemini-2.5-flash: bu anahtarın projesinde ücretsiz katman aktif (gemini-2.0-flash'ta kota 0).
const DEFAULT_MODEL = "gemini-2.5-flash";

export type GeminiRol = "user" | "model";
export interface GeminiMesaj {
  rol: GeminiRol;
  metin: string;
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

/** API anahtarı tanımlı mı? (route, kullanıcıya net hata dönmek için kontrol eder) */
export function geminiYapilandirildiMi(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Gemini'ye bir sohbet turu gönderir, modelin metin cevabını döner.
 * @param system  Sistem talimatı (asistanın kimliği/kuralları)
 * @param mesajlar Sohbet geçmişi (en sonuncusu kullanıcının yeni sorusu)
 */
export async function geminiSohbet(
  system: string,
  mesajlar: GeminiMesaj[],
): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiError("GEMINI_API_KEY tanımlı değil.", 500);
  }
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: mesajlar.map((m) => ({
      role: m.rol,
      parts: [{ text: m.metin }],
    })),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
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
      throw new GeminiError(
        `Gemini kimlik doğrulama/istek hatası: ${detay || res.statusText}`,
        res.status,
      );
    }
    if (res.status === 429) {
      throw new GeminiError("Gemini kota sınırı aşıldı. Biraz sonra tekrar deneyin.", 429);
    }
    throw new GeminiError(`Gemini hatası (${res.status}): ${detay || res.statusText}`, 502);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("") ?? undefined;

  if (!text) {
    // Güvenlik filtresi veya boş cevap
    const sebep = data?.candidates?.[0]?.finishReason;
    if (sebep === "SAFETY") {
      throw new GeminiError("Cevap güvenlik filtresine takıldı.", 422);
    }
    throw new GeminiError("Gemini'den boş cevap geldi.", 502);
  }

  return text.trim();
}
