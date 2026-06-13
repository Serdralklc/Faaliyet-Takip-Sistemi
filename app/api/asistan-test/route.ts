import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GEÇİCİ TANI UCU — değer SIZDIRMAZ; sadece env değişkeni canlı sunucuda var mı + uzunluğu.
// Sorun çözülünce SİLİNECEK.
export async function GET() {
  const k = process.env.GEMINI_API_KEY;
  const sv = process.env.GEMINI_API_KEY_SV;
  return NextResponse.json({
    GEMINI_API_KEY_var: Boolean(k && k.trim()),
    GEMINI_API_KEY_uzunluk: (k ?? "").length,
    GEMINI_API_KEY_SV_var: Boolean(sv && sv.trim()),
    GEMINI_API_KEY_SV_uzunluk: (sv ?? "").length,
    GEMINI_MODEL: process.env.GEMINI_MODEL ?? "(yok)",
    sonuc_yapilandirildi: Boolean((k?.trim() || sv?.trim() || "")),
  });
}
