import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { geminiSohbet, geminiYapilandirildiMi, GeminiError } from "@/lib/asistan/gemini";
import type { GeminiMesaj, GeminiRol } from "@/lib/asistan/gemini";

export const dynamic = "force-dynamic";

const MAKS_MESAJ = 30; // sohbet geçmişi üst sınırı
const MAKS_UZUNLUK = 4000; // tek mesaj karakter sınırı

const SISTEM_TALIMATI = `Sen "Serhendi Vakfı Faaliyet Takip Sistemi"nin yapay zekâ asistanısın.
Adın "Faaliyet Asistanı". Türkçe, kısa, net ve nazik konuşursun.

Görevin: Vakfın eğitim faaliyetleri, bölge/il raporları, barınma (ev/apart/yurt) ve
hedefler hakkında yöneticilere yardımcı olmak.

ÖNEMLİ — şu an (Faz 1) henüz veritabanına bağlı DEĞİLSİN. Yani canlı sayı, isim listesi,
bölge kıyaslaması gibi GERÇEK VERİ getiremezsin. Kullanıcı böyle bir şey isterse:
- Uydurma veri ASLA verme.
- Nazikçe "Bu özellik çok yakında eklenecek (veri bağlantısı bir sonraki aşamada
  devreye girecek). Şimdilik genel sorularını yanıtlayabilirim." de.
Sistemin nasıl kullanılacağı, kavramlar ve genel sorular konusunda serbestçe yardım et.`;

export async function POST(req: Request) {
  // ── Yetki: yalnızca yöneticiler ──
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Bu özelliğe erişim yetkiniz yok." }, { status: 403 });
  }

  if (!geminiYapilandirildiMi()) {
    return NextResponse.json(
      { error: "Asistan henüz yapılandırılmamış (GEMINI_API_KEY eksik)." },
      { status: 503 },
    );
  }

  // ── İstek gövdesi ──
  let body: { mesajlar?: { rol?: string; metin?: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const ham = Array.isArray(body.mesajlar) ? body.mesajlar : [];
  if (ham.length === 0) {
    return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  }
  if (ham.length > MAKS_MESAJ) {
    return NextResponse.json({ error: "Sohbet çok uzun, lütfen yeni bir sohbet başlatın." }, { status: 400 });
  }

  const mesajlar: GeminiMesaj[] = [];
  for (const m of ham) {
    const metin = (m.metin ?? "").toString().trim();
    const rol: GeminiRol = m.rol === "model" ? "model" : "user";
    if (!metin) continue;
    if (metin.length > MAKS_UZUNLUK) {
      return NextResponse.json({ error: "Mesaj çok uzun." }, { status: 400 });
    }
    mesajlar.push({ rol, metin });
  }
  if (mesajlar.length === 0 || mesajlar[mesajlar.length - 1].rol !== "user") {
    return NextResponse.json({ error: "Son mesaj kullanıcıya ait olmalı." }, { status: 400 });
  }

  // ── Gemini ──
  try {
    const cevap = await geminiSohbet(SISTEM_TALIMATI, mesajlar);
    return NextResponse.json({ cevap });
  } catch (e) {
    if (e instanceof GeminiError) {
      console.error("Asistan hatası:", e.status, e.message);
      // Kullanıcıya teknik detayı sızdırma; genel mesaj dön.
      const msg =
        e.status === 429
          ? "Asistan şu an yoğun (kota sınırı). Lütfen biraz sonra tekrar deneyin."
          : "Asistan şu an cevap veremiyor. Lütfen daha sonra tekrar deneyin.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    console.error("Asistan beklenmeyen hata:", e);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
