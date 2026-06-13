import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import {
  geminiSohbetAraclarla,
  geminiYapilandirildiMi,
  GeminiError,
} from "@/lib/asistan/gemini";
import type { GeminiMesaj, GeminiRol } from "@/lib/asistan/gemini";
import { ARAC_TANIMLARI, aracCalistir } from "@/lib/asistan/araclar";

export const dynamic = "force-dynamic";

const MAKS_MESAJ = 30;
const MAKS_UZUNLUK = 4000;

const SISTEM_TALIMATI = `Sen "Serhendi Vakfı Faaliyet Takip Sistemi"nin yapay zekâ asistanısın.
Adın "Faaliyet Asistanı". Türkçe, kısa, net ve nazik konuşursun. Yöneticilere yardımcı olursun.

VERİYE ERİŞİM — elindeki araçlarla (function calling) sistemin gerçek verisini sorgulayabilirsin:
- bolgeleriListele: tüm bölgeler ve numaraları
- bolgeOzeti: bir bölgenin ilköğretim/lise/üniversite/barınma faaliyet özeti
- bolgeDonemKiyas: bir bölgenin 1. ve 2. dönem karşılaştırması
- hedefGerceklesme: bir bölgenin hedef vs gerçekleşen performansı (yüzde)
- barinmaOgrencileri: bir bölgenin ev/apart/yurtlarında kalan öğrenci isimleri

KURALLAR:
- Veri gerektiren her soruda MUTLAKA uygun aracı çağır. ASLA sayı/isim uydurma.
- Araç "hata" alanı dönerse kullanıcıya nazikçe sebebini söyle (ör. bölge yok, veri girilmemiş).
- Sayıları sade ve okunaklı sun; uygun yerde kısa tablo/madde işareti kullan.
- Kullanıcı yıl belirtmezse araç en güncel yılı kullanır; cevapta hangi yıl/dönem olduğunu belirt.
- Bölge adı verilip numara bilinmiyorsa önce bolgeleriListele ile numarayı bul.
- Veriyle ilgisi olmayan genel sorulara (sistem nasıl kullanılır vb.) normal yanıt ver.`;

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

  try {
    const { metin, aracCagrilari } = await geminiSohbetAraclarla(
      SISTEM_TALIMATI,
      mesajlar,
      ARAC_TANIMLARI,
      aracCalistir,
    );
    // aracCagrilari: PDF/Excel indirme (Faz 3) için sonuçları da döndürüyoruz
    return NextResponse.json({
      cevap: metin,
      veriler: aracCagrilari.map((a) => ({ arac: a.isim, sonuc: a.sonuc })),
    });
  } catch (e) {
    if (e instanceof GeminiError) {
      console.error("Asistan hatası:", e.status, e.message);
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
