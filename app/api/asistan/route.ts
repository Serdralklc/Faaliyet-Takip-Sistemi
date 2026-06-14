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
import { aracTanimlari, aracCalistir } from "@/lib/asistan/araclar";
import { asistanSistemleri, SISTEM_ETIKET } from "@/lib/asistan/kapsam";
import type { AsistanSistem } from "@/lib/asistan/kapsam";

export const dynamic = "force-dynamic";

const MAKS_MESAJ = 30;
const MAKS_UZUNLUK = 4000;

/** Kullanıcının erişebildiği sistemlere göre sistem talimatı üretir. */
function sistemTalimati(sistemler: AsistanSistem[]): string {
  const erisim = sistemler.map((s) => `- ${SISTEM_ETIKET[s]}`).join("\n");
  return `Sen "Serhendi Vakfı Faaliyet Takip Sistemi"nin yapay zekâ asistanısın.
Adın "Faaliyet Asistanı". Türkçe, kısa, net ve nazik konuşursun. Yöneticilere yardımcı olursun.

ERİŞİM YETKİN — yalnızca şu sistem(ler)in verisini sorgulayabilirsin:
${erisim}

Bu kapsam dışında bir sistemin verisi sorulursa (örn. yalnız Lise Gençlik yetkin varken üniversite verisi),
kibarca "Bu sisteme erişim yetkim yok" de. Elindeki araçlar zaten yalnızca yetkili olduğun sistemlere aittir.

YAKLAŞIM — kullanıcı NASIL sorarsa sorsun, elindeki verilerden cevap vermeye çalış:
- Önce hangi aracın/araçların sorulana en yakın olduğunu düşün; gerekirse BİRDEN ÇOK araç çağır
  (ör. önce bölge/il listesini al, sonra özetini sorgula). Tek bir kalıba bağlı kalma.
- "Hangi iller faaliyet/veri girmiş", "hangi iller eksik/girmemiş", "kaç il girdi", "en çok faaliyet
  giren il" → faaliyetGirenIller aracını kullan (giren + girmeyen illeri birlikte döner).
- "Hangi iller/şehirler var", "kaç il var" → illeriListele.
- Verdiğin bir il/şehir adından emin değilsen ya da araç "bulunamadı" derse, illeriListele ile gerçekten
  var mı diye BAK; yoksa "Bu ad sistemde bir il olarak kayıtlı değil" de ve en yakın/benzer kayıtlı illeri
  ya da o bölgenin illerini öner. Sadece reddetme — yardımcı ol.

KURALLAR:
- Veri gerektiren her soruda MUTLAKA uygun aracı çağır. ASLA sayı/isim uydurma; veriyi araçtan al.
- Araç "hata" alanı dönerse kullanıcıya nazikçe sebebini söyle ve mümkünse alternatif sun.
- Sayıları sade ve okunaklı sun; uygun yerde kısa tablo/madde işareti kullan.
- Kullanıcı yıl/dönem belirtmezse araç en güncel yılı/tüm dönemleri kullanır; cevapta hangi yıl/dönem olduğunu belirt.
- Bölge adı verilip numara bilinmiyorsa önce bolgeleriListele ile numarayı bul.
- Eğitimci Kadrosu sistemi (ilköğretim/lise/üniversite alt birimleri + barınma) ile Lise/Üniversite
  Gençlik sistemleri (ayrı, faaliyet-bazlı) FARKLIDIR; sorunun bağlamına göre doğru sistemi/aracı seç.
- Veriyle ilgisi olmayan genel sorulara (sistem nasıl kullanılır vb.) normal yanıt ver.`;
}

export async function POST(req: Request) {
  // ── Yetki: yalnızca yöneticiler ──
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Bu özelliğe erişim yetkiniz yok." }, { status: 403 });
  }

  // ── Kapsam: rol + içerik yöneticisi → erişilebilir sistemler ──
  const sistemler = asistanSistemleri(session.user.role, session.user.icerikYoneticisi);
  if (sistemler.length === 0) {
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
      sistemTalimati(sistemler),
      mesajlar,
      aracTanimlari(sistemler),
      (isim, args) => aracCalistir(isim, args, sistemler),
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
