/**
 * Türkiye coğrafi il haritası verisi.
 * Path'ler public/turkiye-iller.json içinde (3-harf kod → SVG path, viewBox 0 0 1024 800).
 * Kuruluşun "Il" birimleri (147) il adıyla bu 81 coğrafi ile eşlenir (ilAdindanKod).
 */

export interface IlBilgi { ad: string; plaka: number }

/** 3-harf kod → il adı + plaka (kodlar public/turkiye-iller.json ile birebir) */
export const IL_BILGI: Record<string, IlBilgi> = {
  ADA: { ad: "Adana", plaka: 1 },
  ADI: { ad: "Adıyaman", plaka: 2 },
  AFY: { ad: "Afyonkarahisar", plaka: 3 },
  AGR: { ad: "Ağrı", plaka: 4 },
  AMA: { ad: "Amasya", plaka: 5 },
  ANK: { ad: "Ankara", plaka: 6 },
  ANT: { ad: "Antalya", plaka: 7 },
  ART: { ad: "Artvin", plaka: 8 },
  AYD: { ad: "Aydın", plaka: 9 },
  BAL: { ad: "Balıkesir", plaka: 10 },
  BIL: { ad: "Bilecik", plaka: 11 },
  BIN: { ad: "Bingöl", plaka: 12 },
  BIT: { ad: "Bitlis", plaka: 13 },
  BOL: { ad: "Bolu", plaka: 14 },
  BRD: { ad: "Burdur", plaka: 15 },
  BUR: { ad: "Bursa", plaka: 16 },
  CNK: { ad: "Çanakkale", plaka: 17 },
  CAN: { ad: "Çankırı", plaka: 18 },
  COR: { ad: "Çorum", plaka: 19 },
  DEN: { ad: "Denizli", plaka: 20 },
  DIY: { ad: "Diyarbakır", plaka: 21 },
  EDI: { ad: "Edirne", plaka: 22 },
  ELA: { ad: "Elazığ", plaka: 23 },
  ERC: { ad: "Erzincan", plaka: 24 },
  ERZ: { ad: "Erzurum", plaka: 25 },
  ESK: { ad: "Eskişehir", plaka: 26 },
  GAZ: { ad: "Gaziantep", plaka: 27 },
  GIR: { ad: "Giresun", plaka: 28 },
  GUM: { ad: "Gümüşhane", plaka: 29 },
  HAK: { ad: "Hakkari", plaka: 30 },
  HAT: { ad: "Hatay", plaka: 31 },
  ISP: { ad: "Isparta", plaka: 32 },
  MER: { ad: "Mersin", plaka: 33 },
  IST: { ad: "İstanbul", plaka: 34 },
  IZM: { ad: "İzmir", plaka: 35 },
  KAR: { ad: "Kars", plaka: 36 },
  KAS: { ad: "Kastamonu", plaka: 37 },
  KAY: { ad: "Kayseri", plaka: 38 },
  KIR: { ad: "Kırklareli", plaka: 39 },
  KRS: { ad: "Kırşehir", plaka: 40 },
  KOC: { ad: "Kocaeli", plaka: 41 },
  KON: { ad: "Konya", plaka: 42 },
  KUT: { ad: "Kütahya", plaka: 43 },
  MAL: { ad: "Malatya", plaka: 44 },
  MAN: { ad: "Manisa", plaka: 45 },
  KAH: { ad: "Kahramanmaraş", plaka: 46 },
  MAR: { ad: "Mardin", plaka: 47 },
  MUG: { ad: "Muğla", plaka: 48 },
  MUS: { ad: "Muş", plaka: 49 },
  NEV: { ad: "Nevşehir", plaka: 50 },
  NIG: { ad: "Niğde", plaka: 51 },
  ORD: { ad: "Ordu", plaka: 52 },
  RIZ: { ad: "Rize", plaka: 53 },
  SAK: { ad: "Sakarya", plaka: 54 },
  SAM: { ad: "Samsun", plaka: 55 },
  SII: { ad: "Siirt", plaka: 56 },
  SIN: { ad: "Sinop", plaka: 57 },
  SIV: { ad: "Sivas", plaka: 58 },
  TEK: { ad: "Tekirdağ", plaka: 59 },
  TOK: { ad: "Tokat", plaka: 60 },
  TRA: { ad: "Trabzon", plaka: 61 },
  TUN: { ad: "Tunceli", plaka: 62 },
  SAN: { ad: "Şanlıurfa", plaka: 63 },
  USA: { ad: "Uşak", plaka: 64 },
  VAN: { ad: "Van", plaka: 65 },
  YOZ: { ad: "Yozgat", plaka: 66 },
  ZON: { ad: "Zonguldak", plaka: 67 },
  AKS: { ad: "Aksaray", plaka: 68 },
  BAY: { ad: "Bayburt", plaka: 69 },
  KRM: { ad: "Karaman", plaka: 70 },
  KRK: { ad: "Kırıkkale", plaka: 71 },
  BAT: { ad: "Batman", plaka: 72 },
  SIR: { ad: "Şırnak", plaka: 73 },
  BAR: { ad: "Bartın", plaka: 74 },
  ARD: { ad: "Ardahan", plaka: 75 },
  IGD: { ad: "Iğdır", plaka: 76 },
  YAL: { ad: "Yalova", plaka: 77 },
  KRB: { ad: "Karabük", plaka: 78 },
  KIL: { ad: "Kilis", plaka: 79 },
  OSM: { ad: "Osmaniye", plaka: 80 },
  DUZ: { ad: "Düzce", plaka: 81 },
};

export const IL_KODLARI = Object.keys(IL_BILGI);

/** Türkçe karakterleri sadeleştirip karşılaştırılabilir hale getirir */
export function normalizeAd(s: string): string {
  return (s || "")
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g")
    .replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

// Kısa/halk adı → kod (org birimi farklı yazabilir)
const ALIAS: Record<string, string> = {
  afyon: "AFY", maras: "KAH", kmaras: "KAH", urfa: "SAN", antep: "GAZ", icel: "MER",
};

// normalize edilmiş il adı → kod (uzun adı önce dene: "kahramanmaras" > "maras")
const NORM_ADLAR = Object.entries(IL_BILGI)
  .map(([kod, b]) => ({ norm: normalizeAd(b.ad), kod }))
  .sort((a, b) => b.norm.length - a.norm.length);

/**
 * Kuruluşun "Il" birim adından coğrafi il kodunu bulur.
 * Örn: "Zonguldak Karadeniz Ereğli" → ZON, "Afyon" → AFY, "Bolu" → BOL.
 */
export function ilAdindanKod(ad: string): string | null {
  const n = normalizeAd(ad);
  if (!n) return null;
  if (ALIAS[n]) return ALIAS[n];
  const tam = NORM_ADLAR.find(x => x.norm === n);
  if (tam) return tam.kod;
  // org adı bir il adıyla başlıyor mu (en uzun eşleşme önce)
  const pref = NORM_ADLAR.find(x => n.startsWith(x.norm));
  if (pref) return pref.kod;
  // il adı org adının içinde geçiyor mu
  const ic = NORM_ADLAR.find(x => n.includes(x.norm));
  return ic ? ic.kod : null;
}
