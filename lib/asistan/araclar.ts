import "server-only";
import {
  bolgeleriListele,
  bolgeOzeti,
  ilOzeti,
  bolgeDonemKiyas,
  hedefGerceklesme,
  barinmaOgrencileri,
} from "./veri";

/**
 * Gemini "function calling" araç tanımları + dağıtıcı.
 * Gemini bir araç çağırmak istediğinde aracCalistir() ile güvenli sorgu çalışır.
 * Tüm araçlar SALT-OKUMA. Yetki kontrolü route katmanında yapılır (sadece yöneticiler).
 */

// Gemini'ye gönderilen şema (OpenAPI alt kümesi)
export const ARAC_TANIMLARI = [
  {
    functionDeclarations: [
      {
        name: "bolgeleriListele",
        description:
          "Tüm bölgelerin numarasını, adını ve il sayısını döner. Kullanıcı bölge adını söyleyip numarasını bilmiyorsa veya 'hangi bölgeler var' diye sorduğunda kullan.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "bolgeOzeti",
        description:
          "Bir bölgenin belirli yıl/dönemdeki TÜM faaliyet özetini döner: ilköğretim, lise, üniversite ve barınma (ev/apart/yurt) sayıları. 'X. bölge hakkında bilgi', 'X. bölge ilköğretim/lise/üniversite verileri' gibi sorularda kullan.",
        parameters: {
          type: "object",
          properties: {
            bolgeNo: { type: "integer", description: "Bölge numarası, örn. 5" },
            yil: { type: "integer", description: "Yıl, örn. 2025. Belirtilmezse en güncel yıl kullanılır." },
            donem: {
              type: "string",
              enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
              description: "Dönem. Belirtilmezse tüm dönemler toplanır.",
            },
          },
          required: ["bolgeNo"],
        },
      },
      {
        name: "ilOzeti",
        description:
          "Bir İLİN/ŞEHRİN (örn. Samsun, Ankara, İstanbul) faaliyet özetini döner: ilköğretim/lise/üniversite/barınma sayıları — DERGAH SAYILARI dahil. Kullanıcı bölge numarası yerine bir il/şehir adı verdiğinde (ör. 'Samsun'daki toplam dergah', 'Ankara'da yeni intisap') bunu kullan.",
        parameters: {
          type: "object",
          properties: {
            ilAdi: { type: "string", description: "İl/şehir adı, örn. Samsun" },
            yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
            donem: {
              type: "string",
              enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
              description: "Dönem. Belirtilmezse tüm dönemler toplanır.",
            },
          },
          required: ["ilAdi"],
        },
      },
      {
        name: "bolgeDonemKiyas",
        description:
          "Bir bölgenin 1. dönem ile 2. dönemini KARŞILAŞTIRIR (her iki dönemin özeti + fark). 'X. bölgenin 1. ve 2. dönem kıyası/karşılaştırması' sorularında kullan.",
        parameters: {
          type: "object",
          properties: {
            bolgeNo: { type: "integer", description: "Bölge numarası, örn. 5" },
            yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
          },
          required: ["bolgeNo"],
        },
      },
      {
        name: "hedefGerceklesme",
        description:
          "Bir bölgenin Genel Merkez hedefleri ile gerçekleşen değerlerini yüzde olarak karşılaştırır (yeni intisap, sosyal faaliyet, kafile, sabah namazı, ilim dersi, KYK, ziyaret). 'X. bölge hedeflerine ulaştı mı', 'performans', 'hedef gerçekleşme' sorularında kullan.",
        parameters: {
          type: "object",
          properties: {
            bolgeNo: { type: "integer", description: "Bölge numarası" },
            yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
            donem: {
              type: "string",
              enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
              description: "Dönem. Belirtilmezse 1. dönem.",
            },
          },
          required: ["bolgeNo"],
        },
      },
      {
        name: "barinmaOgrencileri",
        description:
          "Bir bölgenin öğrenci evi/apart/yurtlarında kalan öğrencilerin İSİM listesini ve birim/il/bölüm bilgisini döner. 'X. bölgenin öğrenci evinde kalanlar', 'yurtta kalan öğrenciler' gibi sorularda kullan.",
        parameters: {
          type: "object",
          properties: {
            bolgeNo: { type: "integer", description: "Bölge numarası" },
            tip: {
              type: "string",
              enum: ["EV", "APART", "YURT"],
              description: "Barınma tipi. 'öğrenci evi'=EV, 'apart'=APART, 'yurt'=YURT. Belirtilmezse hepsi.",
            },
          },
          required: ["bolgeNo"],
        },
      },
    ],
  },
];

type AracArgs = Record<string, unknown>;

/** Gemini'nin istediği aracı çalıştırır; sonucu düz nesne olarak döner. */
export async function aracCalistir(isim: string, args: AracArgs): Promise<Record<string, unknown>> {
  try {
    switch (isim) {
      case "bolgeleriListele":
        return await bolgeleriListele();
      case "bolgeOzeti":
        return await bolgeOzeti(args as any);
      case "ilOzeti":
        return await ilOzeti(args as any);
      case "bolgeDonemKiyas":
        return await bolgeDonemKiyas(args as any);
      case "hedefGerceklesme":
        return await hedefGerceklesme(args as any);
      case "barinmaOgrencileri":
        return await barinmaOgrencileri(args as any);
      default:
        return { hata: `Bilinmeyen araç: ${isim}` };
    }
  } catch (e) {
    console.error(`Asistan araç hatası (${isim}):`, e);
    return { hata: "Veri sorgulanırken bir hata oluştu." };
  }
}
