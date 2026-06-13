import "server-only";
import {
  bolgeleriListele,
  bolgeOzeti,
  ilOzeti,
  bolgeDonemKiyas,
  hedefGerceklesme,
  barinmaOgrencileri,
  liseGenclikOzeti,
  universiteGenclikOzeti,
} from "./veri";
import type { AsistanSistem } from "./kapsam";

/**
 * Gemini "function calling" araç tanımları + dağıtıcı.
 * Araçlar sisteme göre etiketlidir; route, kullanıcının kapsamına (asistanSistemleri)
 * göre yalnızca izinli araçları Gemini'ye sunar. Tüm araçlar SALT-OKUMA.
 */

// Her aracın hangi sisteme ait olduğu ("ORTAK" = her kapsamda görünür)
const ARAC_SISTEM: Record<string, "ORTAK" | AsistanSistem> = {
  bolgeleriListele: "ORTAK",
  bolgeOzeti: "EGITIMCI",
  ilOzeti: "EGITIMCI",
  bolgeDonemKiyas: "EGITIMCI",
  hedefGerceklesme: "EGITIMCI",
  barinmaOgrencileri: "EGITIMCI",
  universiteGenclikOzeti: "UNIVERSITE",
  liseGenclikOzeti: "LISE",
};

const BOLGE_IL_PARAMS = {
  bolgeNo: { type: "integer", description: "Bölge numarası (ör. 5). Belirtilmezse Türkiye geneli." },
  ilAdi: { type: "string", description: "İl/şehir adı (ör. Samsun). bolgeNo yerine kullanılabilir." },
  yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
  donem: {
    type: "string",
    enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"],
    description: "Dönem. Belirtilmezse tüm dönemler toplanır.",
  },
};

// Tüm araç şemaları (düz liste; aracTanimlari kapsama göre filtreler)
const TUM_DECLARATIONS = [
  {
    name: "bolgeleriListele",
    description: "Tüm bölgelerin numarasını, adını ve il sayısını döner. Bölge adı verilip numarası bilinmiyorsa veya 'hangi bölgeler var' sorulduğunda kullan.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "bolgeOzeti",
    description: "EĞİTİMCİ KADROSU sistemi: bir bölgenin ilköğretim/lise/üniversite/barınma BİRİM faaliyet özeti. 'X. bölge hakkında bilgi', 'X. bölge ilköğretim verileri' gibi sorularda kullan.",
    parameters: {
      type: "object",
      properties: {
        bolgeNo: { type: "integer", description: "Bölge numarası, örn. 5" },
        yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
        donem: { type: "string", enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"], description: "Dönem. Belirtilmezse tüm dönemler." },
      },
      required: ["bolgeNo"],
    },
  },
  {
    name: "ilOzeti",
    description: "EĞİTİMCİ KADROSU sistemi: bir İLİN/ŞEHRİN (ör. Samsun) ilköğretim/lise/üniversite/barınma BİRİM özeti — dergah sayıları dahil. Kullanıcı bir il/şehir adı verdiğinde kullan.",
    parameters: {
      type: "object",
      properties: {
        ilAdi: { type: "string", description: "İl/şehir adı, örn. Samsun" },
        yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
        donem: { type: "string", enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"], description: "Dönem. Belirtilmezse tüm dönemler." },
      },
      required: ["ilAdi"],
    },
  },
  {
    name: "bolgeDonemKiyas",
    description: "EĞİTİMCİ KADROSU sistemi: bir bölgenin 1. ve 2. dönemini karşılaştırır. 'X. bölgenin dönem kıyası' sorularında kullan.",
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
    description: "EĞİTİMCİ KADROSU sistemi: bir bölgenin hedef vs gerçekleşen performansını yüzde olarak verir. 'hedeflerine ulaştı mı', 'performans' sorularında kullan.",
    parameters: {
      type: "object",
      properties: {
        bolgeNo: { type: "integer", description: "Bölge numarası" },
        yil: { type: "integer", description: "Yıl. Belirtilmezse en güncel yıl." },
        donem: { type: "string", enum: ["DONEM_1", "DONEM_2", "YAZ_DONEMI"], description: "Dönem. Belirtilmezse 1. dönem." },
      },
      required: ["bolgeNo"],
    },
  },
  {
    name: "barinmaOgrencileri",
    description: "EĞİTİMCİ KADROSU sistemi: bir bölgenin ev/apart/yurtlarında kalan öğrencilerin isim listesi. 'öğrenci evinde kalanlar' sorularında kullan.",
    parameters: {
      type: "object",
      properties: {
        bolgeNo: { type: "integer", description: "Bölge numarası" },
        tip: { type: "string", enum: ["EV", "APART", "YURT"], description: "Barınma tipi. Belirtilmezse hepsi." },
      },
      required: ["bolgeNo"],
    },
  },
  {
    name: "universiteGenclikOzeti",
    description: "ÜNİVERSİTE GENÇLİK sistemi (ayrı, faaliyet-bazlı): bir bölgenin/ilin üniversite gençlik faaliyetlerinin kategori bazlı özeti (ilim/sohbet, kulüp, KYK, sosyal, kafile, namaz...). Bölge/il belirtilmezse Türkiye geneli.",
    parameters: { type: "object", properties: BOLGE_IL_PARAMS },
  },
  {
    name: "liseGenclikOzeti",
    description: "LİSE GENÇLİK sistemi (ayrı, faaliyet-bazlı): bir bölgenin/ilin lise gençlik faaliyetlerinin kategori bazlı özeti (ilim/sohbet, sosyal, muhabbet, namaz, kafile...). Bölge/il belirtilmezse Türkiye geneli.",
    parameters: { type: "object", properties: BOLGE_IL_PARAMS },
  },
];

/** Kullanıcının kapsamına göre Gemini'ye sunulacak araç tanımları. */
export function aracTanimlari(sistemler: AsistanSistem[]) {
  const izinli = (isim: string) => {
    const s = ARAC_SISTEM[isim];
    return s === "ORTAK" || sistemler.includes(s);
  };
  return [{ functionDeclarations: TUM_DECLARATIONS.filter((d) => izinli(d.name)) }];
}

type AracArgs = Record<string, unknown>;

/** Gemini'nin istediği aracı kapsam kontrolüyle çalıştırır. */
export async function aracCalistir(
  isim: string,
  args: AracArgs,
  sistemler: AsistanSistem[],
): Promise<Record<string, unknown>> {
  const s = ARAC_SISTEM[isim];
  if (s !== "ORTAK" && (!s || !sistemler.includes(s))) {
    return { hata: "Bu sisteme erişim yetkiniz yok." };
  }
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
      case "universiteGenclikOzeti":
        return await universiteGenclikOzeti(args as any);
      case "liseGenclikOzeti":
        return await liseGenclikOzeti(args as any);
      default:
        return { hata: `Bilinmeyen araç: ${isim}` };
    }
  } catch (e) {
    console.error(`Asistan araç hatası (${isim}):`, e);
    return { hata: "Veri sorgulanırken bir hata oluştu." };
  }
}
