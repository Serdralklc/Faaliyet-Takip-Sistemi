// Eğitim Birimi (Activity) giriş alanları kataloğu — alt birim bazında.
// Alan Yönetimi ekranı bunu kullanır; alanKodu = Activity kolon adı (değişmez kimlik).
// NOT: app/panel/il/faaliyet/FaaliyetForm.tsx içindeki FIELDS ile aynı alanKodu'lar
// kullanılır (görsel render orada). Yeni alan eklenirken ikisi de güncellenmeli.

export type FaaliyetAltBirim = "ilkogretim" | "lise" | "universite" | "ortak";

export interface AlanTanim {
  alanKodu: string;
  label: string;
  grup?: string;
}

export const EGITIM_ALT_BIRIM_LABEL: Record<FaaliyetAltBirim, string> = {
  ilkogretim: "İlköğretim",
  lise: "Lise",
  universite: "Üniversite",
  ortak: "Ortak Faaliyetler",
};

export const EGITIM_ALAN_KATALOG: Record<FaaliyetAltBirim, AlanTanim[]> = {
  ilkogretim: [
    { alanKodu: "ik_toplamDergah", label: "Toplam Dergah Sayısı" },
    { alanKodu: "ik_kursuYapilanDergah", label: "Hafta Sonu Kursu Yapılan Dergah" },
    { alanKodu: "ik_egitmenSayisi", label: "Eğitmen Sayısı" },
    { alanKodu: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı Sayısı" },
    { alanKodu: "ik_elifBaOgrenci", label: "Elif Ba'dan Başlayan Öğrenci" },
    { alanKodu: "ik_kuranOgrenci", label: "Kuran-ı Kerim'den Başlayan Öğrenci" },
    { alanKodu: "ik_gecisOgrenci", label: "Elif Ba'dan Kuran'a Geçen Öğrenci" },
  ],
  lise: [
    { alanKodu: "ls_toplamDergah", label: "Toplam Dergâh Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "ls_ilimSohbetDergah", label: "İlim/Sohbet Faaliyeti Yapılan Dergâh", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "ls_liseliOgrenciSayisi", label: "Toplam Liseli Öğrenci Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "ls_mezunOgrenci", label: "Bu Yıl Mezun Olacak Liseli Öğrenci", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "ls_yeniIntisap", label: "Toplam Yeni İntisap Eden Öğrenci", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "ls_ilimSohbetSayisi", label: "Toplam İlim/Sohbet Faaliyeti Sayısı", grup: "İlim / Sohbet Faaliyetleri" },
    { alanKodu: "ls_ilimSohbetKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "İlim / Sohbet Faaliyetleri" },
    { alanKodu: "ls_sosyalSayisi", label: "Toplam Sosyal Faaliyet Sayısı", grup: "Sosyal Faaliyetler" },
    { alanKodu: "ls_sosyalKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Sosyal Faaliyetler" },
    { alanKodu: "ls_sorumlulukSayisi", label: "Toplam Sosyal Sorumluluk Faaliyeti Sayısı", grup: "Sosyal Sorumluluk Faaliyetleri" },
    { alanKodu: "ls_sorumlulukKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Sosyal Sorumluluk Faaliyetleri" },
    { alanKodu: "ls_muhabbetSayisi", label: "Toplam Muhabbet Buluşması Sayısı", grup: "Muhabbet Buluşmaları" },
    { alanKodu: "ls_muhabbetKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Muhabbet Buluşmaları" },
    { alanKodu: "ls_namazSayisi", label: "Toplam Namaz Buluşması Sayısı", grup: "Namaz Buluşmaları" },
    { alanKodu: "ls_namazKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Namaz Buluşmaları" },
    { alanKodu: "ls_kafileSayisi", label: "Toplam Kafile Sayısı", grup: "Kafile Faaliyetleri" },
    { alanKodu: "ls_kafileOgrenci", label: "Kafilelere Katılan Toplam Öğrenci", grup: "Kafile Faaliyetleri" },
  ],
  universite: [
    { alanKodu: "uni_toplamDergah", label: "Toplam Dergâh Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_ilimSohbetDergah", label: "İlim/Sohbet Faaliyeti Yapılan Dergâh", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_universiteliOgrenciSayisi", label: "Toplam Üniversite Öğrenci Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_sonSinifOgrenci", label: "Son Sınıf Üniversite Öğrenci Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_yeniIntisap", label: "Toplam Yeni İntisap Eden Öğrenci", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_aktifKulup", label: "Aktif Kulüp Sayısı", grup: "Öğrenci ve Dergâh Bilgileri" },
    { alanKodu: "uni_ilimSohbetSayisi", label: "Toplam İlim/Sohbet Faaliyeti Sayısı", grup: "İlim / Sohbet Faaliyetleri" },
    { alanKodu: "uni_ilimSohbetKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "İlim / Sohbet Faaliyetleri" },
    { alanKodu: "uni_kulupSayisi", label: "Toplam Kulüp Faaliyeti Sayısı", grup: "Kulüp Faaliyetleri" },
    { alanKodu: "uni_kulupKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Kulüp Faaliyetleri" },
    { alanKodu: "uni_sosyalSayisi", label: "Toplam Sosyal Faaliyet Sayısı", grup: "Sosyal Faaliyetler" },
    { alanKodu: "uni_sosyalKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Sosyal Faaliyetler" },
    { alanKodu: "uni_sorumlulukSayisi", label: "Toplam Sosyal Sorumluluk Faaliyeti Sayısı", grup: "Sosyal Sorumluluk Faaliyetleri" },
    { alanKodu: "uni_sorumlulukKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Sosyal Sorumluluk Faaliyetleri" },
    { alanKodu: "uni_muhabbetSayisi", label: "Toplam Muhabbet Buluşması Sayısı", grup: "Muhabbet Buluşmaları" },
    { alanKodu: "uni_muhabbetKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Muhabbet Buluşmaları" },
    { alanKodu: "uni_namazSayisi", label: "Toplam Namaz Buluşması Sayısı", grup: "Namaz Buluşmaları" },
    { alanKodu: "uni_namazKatilim", label: "Katılan Toplam Öğrenci Sayısı", grup: "Namaz Buluşmaları" },
    { alanKodu: "uni_kafileSayisi", label: "Toplam Kafile Sayısı", grup: "Kafile Faaliyetleri" },
    { alanKodu: "uni_kafileOgrenci", label: "Kafilelere Katılan Toplam Öğrenci", grup: "Kafile Faaliyetleri" },
    { alanKodu: "uni_kykBulusmaSayisi", label: "Toplam KYK Buluşması Sayısı", grup: "KYK Faaliyetleri" },
    { alanKodu: "uni_kykKatilim", label: "KYK Buluşmalarına Katılan Toplam Öğrenci", grup: "KYK Faaliyetleri" },
  ],
  ortak: [
    { alanKodu: "ortakKafileSayisi", label: "Ortak Kafile Sayısı" },
    { alanKodu: "ortakKafileLiseKatilim", label: "Kafileye Katılan Liseli Öğrenci" },
    { alanKodu: "ortakKafileUniKatilim", label: "Kafileye Katılan Üniversiteli Öğrenci" },
    { alanKodu: "ortakSabahNamaziSayisi", label: "Ortak Sabah Namazı Buluşma Sayısı" },
    { alanKodu: "ortakSabahNamaziLiseKatilim", label: "Sabah Namazına Katılan Liseli" },
    { alanKodu: "ortakSabahNamaziUniKatilim", label: "Sabah Namazına Katılan Üniversiteli" },
  ],
};

export const EGITIM_ALT_BIRIMLER: FaaliyetAltBirim[] = ["ilkogretim", "lise", "universite", "ortak"];

/** Eğitim Birimi'nde yönetilebilir tüm geçerli alan kodları. */
export const EGITIM_GECERLI_KODLAR: Set<string> = new Set(
  EGITIM_ALT_BIRIMLER.flatMap(b => EGITIM_ALAN_KATALOG[b].map(a => a.alanKodu)),
);
