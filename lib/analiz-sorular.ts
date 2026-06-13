/**
 * Analiz Merkezi — Eğitimci sistemi birim soruları (Activity alanları) + etiketleri.
 * "Birim seç → soru seç → bölge karşılaştırması" grafiği bunları kullanır.
 */
export type AnalizBirim = "ILKOGRETIM" | "LISE" | "UNIVERSITE";

export interface AnalizSoru { key: string; label: string }

export const ANALIZ_BIRIM_LABEL: Record<AnalizBirim, string> = {
  ILKOGRETIM: "İlköğretim",
  LISE: "Lise",
  UNIVERSITE: "Üniversite",
};

export const ANALIZ_SORULAR: Record<AnalizBirim, AnalizSoru[]> = {
  ILKOGRETIM: [
    { key: "ik_toplamDergah", label: "Toplam Dergâh" },
    { key: "ik_kursuYapilanDergah", label: "Kursu Yapılan Dergâh" },
    { key: "ik_egitmenSayisi", label: "Eğitmen Sayısı" },
    { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı" },
    { key: "ik_elifBaOgrenci", label: "Elif Ba Öğrenci" },
    { key: "ik_kuranOgrenci", label: "Kuran Öğrenci" },
    { key: "ik_gecisOgrenci", label: "Kuran'a Geçen Öğrenci" },
  ],
  LISE: [
    { key: "ls_toplamDergah", label: "Toplam Dergâh" },
    { key: "ls_liseliOgrenciSayisi", label: "Liseli Öğrenci" },
    { key: "ls_yeniIntisap", label: "Yeni İntisap" },
    { key: "ls_ilimSohbetDergah", label: "İlim/Sohbet Yapılan Dergâh" },
    { key: "ls_mezunOgrenci", label: "Mezun Öğrenci" },
    { key: "ls_ilimSohbetSayisi", label: "İlim/Sohbet Sayısı" },
    { key: "ls_ilimSohbetKatilim", label: "İlim/Sohbet Katılım" },
    { key: "ls_sosyalSayisi", label: "Sosyal Faaliyet Sayısı" },
    { key: "ls_sosyalKatilim", label: "Sosyal Faaliyet Katılım" },
    { key: "ls_sorumlulukSayisi", label: "Sosyal Sorumluluk Sayısı" },
    { key: "ls_sorumlulukKatilim", label: "Sosyal Sorumluluk Katılım" },
    { key: "ls_muhabbetSayisi", label: "Muhabbet Sayısı" },
    { key: "ls_muhabbetKatilim", label: "Muhabbet Katılım" },
    { key: "ls_namazSayisi", label: "Sabah Namazı Sayısı" },
    { key: "ls_namazKatilim", label: "Sabah Namazı Katılım" },
    { key: "ls_kafileSayisi", label: "Kafile Sayısı" },
    { key: "ls_kafileOgrenci", label: "Kafile Öğrenci" },
  ],
  UNIVERSITE: [
    { key: "uni_toplamDergah", label: "Toplam Dergâh" },
    { key: "uni_universiteliOgrenciSayisi", label: "Üniversiteli Öğrenci" },
    { key: "uni_yeniIntisap", label: "Yeni İntisap" },
    { key: "uni_ilimSohbetDergah", label: "İlim/Sohbet Yapılan Dergâh" },
    { key: "uni_sonSinifOgrenci", label: "Son Sınıf Öğrenci" },
    { key: "uni_aktifKulup", label: "Aktif Kulüp" },
    { key: "uni_ilimSohbetSayisi", label: "İlim/Sohbet Sayısı" },
    { key: "uni_ilimSohbetKatilim", label: "İlim/Sohbet Katılım" },
    { key: "uni_kulupSayisi", label: "Kulüp Faaliyet Sayısı" },
    { key: "uni_kulupKatilim", label: "Kulüp Faaliyet Katılım" },
    { key: "uni_sosyalSayisi", label: "Sosyal Faaliyet Sayısı" },
    { key: "uni_sosyalKatilim", label: "Sosyal Faaliyet Katılım" },
    { key: "uni_sorumlulukSayisi", label: "Sosyal Sorumluluk Sayısı" },
    { key: "uni_sorumlulukKatilim", label: "Sosyal Sorumluluk Katılım" },
    { key: "uni_muhabbetSayisi", label: "Muhabbet Sayısı" },
    { key: "uni_muhabbetKatilim", label: "Muhabbet Katılım" },
    { key: "uni_namazSayisi", label: "Sabah Namazı Sayısı" },
    { key: "uni_namazKatilim", label: "Sabah Namazı Katılım" },
    { key: "uni_kafileSayisi", label: "Kafile Sayısı" },
    { key: "uni_kafileOgrenci", label: "Kafile Öğrenci" },
    { key: "uni_kykBulusmaSayisi", label: "KYK Buluşma Sayısı" },
    { key: "uni_kykKatilim", label: "KYK Katılım" },
  ],
};

/** Tüm birim alanları (Activity select + bölge toplamı için) */
export const ANALIZ_TUM_ALANLAR: string[] = Object.values(ANALIZ_SORULAR).flatMap(b => b.map(s => s.key));
