/**
 * Üniversite Gençlik faaliyet kategorileri ve kategoriye bağlı faaliyet adları.
 * Hem giriş formu hem API doğrulaması hem otomatik raporlama burayı kullanır.
 */

export type UniKategoriKey =
  | "ILIM_SOHBET" | "KULUP" | "SOSYAL" | "SOSYAL_SORUMLULUK"
  | "MUHABBET" | "NAMAZ" | "KAFILE" | "KYK" | "DIGER";

export interface UniKategoriDef {
  key: UniKategoriKey;
  label: string;
  /** Hazır faaliyet adları (son eleman "Diğer" → manuel giriş açılır) */
  adlar: string[];
  renk: string;
}

export const UNI_KATEGORILER: UniKategoriDef[] = [
  {
    key: "ILIM_SOHBET", label: "İlim / Sohbet Faaliyeti", renk: "#7C3AED",
    adlar: ["İlim Dersi", "Sohbet", "Genel Ders", "Risale Dersi", "Kitap Müzakeresi", "Soru-Cevap Programı", "Diğer"],
  },
  {
    key: "SOSYAL", label: "Sosyal Faaliyet", renk: "#059669",
    adlar: ["Gezi", "Spor Faaliyeti", "Kamp", "Piknik", "Kahvaltı Programı", "Çay Sohbeti", "Kültürel Etkinlik", "Kitap Okuma Programı", "Sinema Programı", "Turnuva", "Diğer"],
  },
  {
    key: "SOSYAL_SORUMLULUK", label: "Sosyal Sorumluluk Faaliyeti", renk: "#B45309",
    adlar: ["Yardım Organizasyonu", "Çevre Faaliyeti", "Gönüllülük Çalışması", "Ziyaret Programı", "Kermes Çalışması", "Diğer"],
  },
  {
    key: "MUHABBET", label: "Muhabbet Buluşması", renk: "#DB2777",
    adlar: ["Ev Muhabbeti", "Dergâh Muhabbeti", "Çay Muhabbeti", "Tanışma Programı", "İstişare Toplantısı", "Diğer"],
  },
  {
    key: "NAMAZ", label: "Namaz Buluşması", renk: "#0891B2",
    adlar: ["Sabah Namazı", "Öğle Namazı", "İkindi Namazı", "Akşam Namazı", "Yatsı Namazı", "Cuma Namazı", "Teravih Programı", "Diğer"],
  },
  {
    key: "KAFILE", label: "Kafile", renk: "#DC2626",
    adlar: ["Menzil", "Tepeören", "Şehir İçi Kafile", "Şehir Dışı Kafile", "Diğer"],
  },
  {
    key: "KYK", label: "KYK Faaliyeti", renk: "#CA8A04",
    adlar: ["KYK Sohbeti", "KYK Oda Ziyareti", "KYK Tanışma Programı", "KYK Çay Programı", "KYK Etkinliği", "KYK İlim Dersi", "Diğer"],
  },
  {
    key: "KULUP", label: "Kulüp Faaliyeti", renk: "#1D4ED8",
    adlar: ["Kulüp Toplantısı", "Kulüp Tanıtım Standı", "Akademik Etkinlik", "Seminer", "Konferans", "Panel", "Atölye Çalışması", "Kariyer Programı", "Teknik Gezi", "Sosyal Etkinlik", "Diğer"],
  },
  {
    key: "DIGER", label: "Diğer", renk: "#57534E",
    adlar: [],
  },
];

export const UNI_KATEGORILER_KEYS: UniKategoriKey[] = UNI_KATEGORILER.map((k) => k.key);

export const UNI_KATEGORI_LABEL: Record<string, string> = Object.fromEntries(
  UNI_KATEGORILER.map((k) => [k.key, k.label])
);

export const UNI_KATEGORI_RENK: Record<string, string> = Object.fromEntries(
  UNI_KATEGORILER.map((k) => [k.key, k.renk])
);

export function gecerliUniKategori(v: unknown): v is UniKategoriKey {
  return typeof v === "string" && (UNI_KATEGORILER_KEYS as string[]).includes(v);
}

/* ── Otomatik raporlama ── */

export interface UniKatOzet { sayi: number; katilimci: number; ilkKez: number; yeniIntisap: number }
export interface UniOzet {
  perKat: Record<string, UniKatOzet>;
  toplam: number;
  toplamKatilimci: number;
  toplamIlkKez: number;
  toplamIntisap: number;
}

type OzetGirdi = { kategori: string; katilimci: number; ilkKezKatilan: number; yeniIntisap: number };
const bosKat = (): UniKatOzet => ({ sayi: 0, katilimci: 0, ilkKez: 0, yeniIntisap: 0 });

export function uniOzet(list: OzetGirdi[]): UniOzet {
  const perKat: Record<string, UniKatOzet> = {};
  for (const k of UNI_KATEGORILER_KEYS) perKat[k] = bosKat();
  let toplamKatilimci = 0, toplamIlkKez = 0, toplamIntisap = 0;
  for (const f of list) {
    const p = perKat[f.kategori] ?? (perKat[f.kategori] = bosKat());
    p.sayi += 1; p.katilimci += f.katilimci; p.ilkKez += f.ilkKezKatilan; p.yeniIntisap += f.yeniIntisap;
    toplamKatilimci += f.katilimci; toplamIlkKez += f.ilkKezKatilan; toplamIntisap += f.yeniIntisap;
  }
  return { perKat, toplam: list.length, toplamKatilimci, toplamIlkKez, toplamIntisap };
}
