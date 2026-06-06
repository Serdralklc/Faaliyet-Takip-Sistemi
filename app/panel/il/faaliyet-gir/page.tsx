"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

const DONEMLER = [
  { value: "DONEM_1", label: "1. Dönem" },
  { value: "DONEM_2", label: "2. Dönem" },
  { value: "YAZ_DONEMI", label: "Yaz Dönemi" },
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const ILKOGRETIM_FIELDS = [
  { key: "ik_toplamDergah", label: "Toplam Dergah Sayısı" },
  { key: "ik_kursuYapilanDergah", label: "Hafta Sonu Kursu Yapılan Dergah" },
  { key: "ik_egitmenSayisi", label: "Eğitmen Sayısı" },
  { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcı Sayısı" },
  { key: "ik_elifBaOgrenci", label: "Elif Ba ile Başlayan Öğrenci" },
  { key: "ik_kuranOgrenci", label: "Kuran-ı Kerim ile Başlayan Öğrenci" },
  { key: "ik_gecisOgrenci", label: "Elif Ba'dan Kuran'a Geçen Öğrenci" },
];

const LISE_FIELDS = [
  { key: "ls_toplamDergah", label: "Toplam Dergah Sayısı" },
  { key: "ls_ilimDersYeri", label: "İlim Dersleri Yapılan Yer Sayısı" },
  { key: "ls_ilimDersKatilim", label: "İlim Derslerine Katılan Öğrenci" },
  { key: "ls_sabahNamaziSayisi", label: "Sabah Namazı Buluşma Sayısı" },
  { key: "ls_sabahNamaziKatilim", label: "Sabah Namazına Katılan Liseli" },
  { key: "ls_kafileSayisi", label: "Yapılan Kafile Sayısı" },
  { key: "ls_kafileOgrenci", label: "Kafile ile Giden Liseli Öğrenci" },
  { key: "ls_toplamFaaliyet", label: "Toplam Faaliyet Sayısı" },
  { key: "ls_yeniIntisap", label: "Toplam Yeni İntisap Sayısı" },
];

const UNI_FIELDS = [
  { key: "uni_toplamDergah", label: "Toplam Dergah Sayısı" },
  { key: "uni_ilimDersYeri", label: "İlim Dersleri Yapılan Yer" },
  { key: "uni_ilimDersKatilim", label: "İlim Derslerine Katılan Öğrenci" },
  { key: "uni_sabahNamaziSayisi", label: "Sabah Namazı Buluşma Sayısı" },
  { key: "uni_sabahNamaziKatilim", label: "Sabah Namazına Katılan Üniversiteli" },
  { key: "uni_kafileSayisi", label: "Üniversite Kafile Sayısı" },
  { key: "uni_kafileOgrenci", label: "Kafile ile Giden Üniversiteli" },
  { key: "uni_toplamFaaliyet", label: "Toplam Faaliyet Sayısı" },
  { key: "uni_kykBulusmaSayisi", label: "KYK Buluşma Sayısı" },
  { key: "uni_kykKatilim", label: "KYK Buluşmalarına Katılan Öğrenci" },
  { key: "uni_yeniIntisap", label: "Toplam Yeni İntisap Sayısı" },
];

const EAY_FIELDS = [
  { key: "eay_mevcutEv", label: "Mevcut Ev Sayısı" },
  { key: "eay_mevcutApart", label: "Mevcut Apart Sayısı" },
  { key: "eay_mevcutYurt", label: "Mevcut Yurt Sayısı" },
  { key: "eay_acilacakEv", label: "Açılacak Ev" },
  { key: "eay_acilacakApart", label: "Açılacak Apart" },
  { key: "eay_acilacakYurt", label: "Açılacak Yurt" },
  { key: "eay_kapanacakEv", label: "Kapanacak Ev" },
  { key: "eay_kapanacakApart", label: "Kapanacak Apart" },
  { key: "eay_kapanacakYurt", label: "Kapanacak Yurt" },
  { key: "eay_bursBalan", label: "Burs Alan Sayısı" },
  { key: "eay_iliskiKesme", label: "İlişki Kesme Talebi" },
  { key: "eay_toplamZiyaret", label: "Toplam Ziyaret Sayısı" },
];

type FormData = Record<string, number>;

function initForm(): FormData {
  const allFields = [...ILKOGRETIM_FIELDS, ...LISE_FIELDS, ...UNI_FIELDS, ...EAY_FIELDS];
  return Object.fromEntries(allFields.map((f) => [f.key, 0]));
}

function FieldGroup({ title, fields, form, onChange }: {
  title: string;
  fields: { key: string; label: string }[];
  form: FormData;
  onChange: (k: string, v: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="bg-blue-700 px-5 py-3">
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input
              type="number" min={0} value={form[f.key] ?? 0}
              onChange={(e) => onChange(f.key, Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FaaliyetGirPage() {
  const { data: session } = useSession();
  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState("DONEM_1");
  const [form, setForm] = useState<FormData>(initForm());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChange(key: string, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.activeIlId) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/faaliyetler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ilId: session.user.activeIlId, yil, donem, ...form }),
    });

    setLoading(false);
    if (res.ok) setMessage({ type: "success", text: "Faaliyet kaydedildi." });
    else setMessage({ type: "error", text: "Kayıt sırasında hata oluştu." });
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Faaliyet Gir</h1>
        <p className="text-gray-500 mt-1">İlinize ait faaliyet verilerini giriniz</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Yıl</label>
          <select value={yil} onChange={(e) => setYil(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dönem</label>
          <select value={donem} onChange={(e) => setDonem(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {DONEMLER.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup title="İlköğretim Birimi" fields={ILKOGRETIM_FIELDS} form={form} onChange={handleChange} />
        <FieldGroup title="Lise Birimi" fields={LISE_FIELDS} form={form} onChange={handleChange} />
        <FieldGroup title="Üniversite Birimi" fields={UNI_FIELDS} form={form} onChange={handleChange} />
        <FieldGroup title="Ev / Apart / Yurt Takip" fields={EAY_FIELDS} form={form} onChange={handleChange} />

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 font-medium transition disabled:opacity-50">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
