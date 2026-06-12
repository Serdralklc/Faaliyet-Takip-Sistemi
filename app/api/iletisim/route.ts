import { NextRequest, NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/mail";

export async function POST(req: NextRequest) {
  let body: { adSoyad?: string; eposta?: string; telefon?: string; mesaj?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const adSoyad = body.adSoyad?.trim() ?? "";
  const eposta = body.eposta?.trim() ?? "";
  const telefon = body.telefon?.trim() || undefined;
  const mesaj = body.mesaj?.trim() ?? "";

  if (!adSoyad || !eposta || !mesaj) {
    return NextResponse.json({ error: "Ad soyad, e-posta ve mesaj alanları zorunludur." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }
  if (adSoyad.length > 200 || mesaj.length > 5000 || (telefon?.length ?? 0) > 30) {
    return NextResponse.json({ error: "Alan uzunluğu sınırı aşıldı." }, { status: 400 });
  }

  try {
    await sendContactMessage({ adSoyad, eposta, telefon, mesaj });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("İletişim mesajı gönderilemedi:", e);
    return NextResponse.json(
      { error: "Mesaj şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}
