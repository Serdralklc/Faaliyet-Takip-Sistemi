"use client";

/**
 * Dinamik form oluşturma/düzenleme ekranı (yönetici).
 * formId verilirse mevcut formu yükler ve PATCH ile günceller;
 * verilmezse boş başlar ve POST ile oluşturur.
 * Yanıt almış formlarda soru seti kilitlenir — yalnızca meta düzenlenebilir.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUp, ArrowDown, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type SoruTip = "KISA_METIN" | "UZUN_METIN" | "SAYI" | "TARIH" | "TEK_SECIM" | "COKLU_SECIM" | "DOSYA";

const SORU_TIPLERI: { value: SoruTip; label: string }[] = [
  { value: "KISA_METIN",  label: "Kısa Metin" },
  { value: "UZUN_METIN",  label: "Uzun Metin" },
  { value: "SAYI",        label: "Sayı" },
  { value: "TARIH",       label: "Tarih" },
  { value: "TEK_SECIM",   label: "Tek Seçim" },
  { value: "COKLU_SECIM", label: "Çoklu Seçim" },
  { value: "DOSYA",       label: "Dosya Yükleme" },
];

const secimliMi = (tip: SoruTip) => tip === "TEK_SECIM" || tip === "COKLU_SECIM";

interface SoruDraft {
  key: string;
  etiket: string;
  tip: SoruTip;
  zorunlu: boolean;
  /** Satır başına bir seçenek — kaydederken '\n' ile bölünür */
  seceneklerText: string;
}

interface FormDetay {
  id: string;
  baslik: string;
  aciklama?: string | null;
  durum: "TASLAK" | "YAYINDA" | "KAPALI";
  hedefBolge: boolean;
  hedefIl: boolean;
  sistemEgitim: boolean;
  sistemUniversite: boolean;
  sistemLise: boolean;
  sorular: { id: string; sira: number; etiket: string; tip: SoruTip; zorunlu: boolean; secenekler: string[] }[];
  _count?: { yanitlar: number };
}

function CheckRow({
  checked, onChange, label, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13.5px] font-semibold transition ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      style={checked
        ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
        : { borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="accent-[var(--accent-solid)]"
      />
      {label}
    </label>
  );
}

export function FormBuilder({ formId }: { formId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const keyCounter = useRef(0);
  const nextKey = () => `soru-${++keyCounter.current}-${Date.now()}`;

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [hedefBolge, setHedefBolge] = useState(false);
  const [hedefIl, setHedefIl] = useState(false);
  const [sistemEgitim, setSistemEgitim] = useState(false);
  const [sistemUniversite, setSistemUniversite] = useState(false);
  const [sistemLise, setSistemLise] = useState(false);
  const [sorular, setSorular] = useState<SoruDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["form", formId],
    queryFn: async (): Promise<FormDetay> => {
      const res = await fetch(`/api/formlar/${formId}`);
      if (!res.ok) throw new Error("Form yüklenemedi.");
      return res.json();
    },
    enabled: !!formId,
  });

  // Mevcut form verisini state'e aktar — yalnızca ilk yüklemede
  // (arka plan yenilemesi kullanıcının düzenlemesini ezmesin)
  const yuklendiMi = useRef(false);
  useEffect(() => {
    if (!form || yuklendiMi.current) return;
    yuklendiMi.current = true;
    setBaslik(form.baslik);
    setAciklama(form.aciklama ?? "");
    setHedefBolge(form.hedefBolge);
    setHedefIl(form.hedefIl);
    setSistemEgitim(form.sistemEgitim);
    setSistemUniversite(form.sistemUniversite);
    setSistemLise(form.sistemLise);
    setSorular(form.sorular.map(s => ({
      key: nextKey(),
      etiket: s.etiket,
      tip: s.tip,
      zorunlu: s.zorunlu,
      seceneklerText: s.secenekler.join("\n"),
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const yanitSayisi = form?._count?.yanitlar ?? 0;
  const sorularKilitli = !!formId && yanitSayisi > 0;

  function soruGuncelle(key: string, patch: Partial<SoruDraft>) {
    setSorular(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));
  }

  function soruEkle() {
    setSorular(prev => [...prev, { key: nextKey(), etiket: "", tip: "KISA_METIN", zorunlu: false, seceneklerText: "" }]);
  }

  function soruSil(key: string) {
    setSorular(prev => prev.filter(s => s.key !== key));
  }

  function soruTasi(index: number, yon: -1 | 1) {
    setSorular(prev => {
      const hedef = index + yon;
      if (hedef < 0 || hedef >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[hedef]] = [next[hedef], next[index]];
      return next;
    });
  }

  async function handleKaydet() {
    // İstemci tarafı basit kontroller (sunucu da doğrular)
    if (!baslik.trim()) {
      toast({ type: "warning", title: "Başlık gerekli", message: "Lütfen forma bir başlık yazın." });
      return;
    }
    if (!sorularKilitli) {
      if (sorular.length === 0) {
        toast({ type: "warning", title: "Soru ekleyin", message: "Form en az bir soru içermelidir." });
        return;
      }
      const eksikSecenek = sorular.find(s =>
        secimliMi(s.tip) && s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean).length < 2
      );
      if (eksikSecenek) {
        toast({
          type: "warning",
          title: "Seçenekler eksik",
          message: `"${eksikSecenek.etiket || "Seçim sorusu"}" için en az 2 seçenek girin.`,
        });
        return;
      }
    }

    const meta = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      hedefBolge,
      hedefIl,
      sistemEgitim,
      sistemUniversite,
      sistemLise,
    };
    const soruPayload = sorular.map(s => ({
      etiket: s.etiket.trim(),
      tip: s.tip,
      zorunlu: s.zorunlu,
      secenekler: secimliMi(s.tip)
        ? s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean)
        : [],
    }));

    setSaving(true);
    try {
      const res = formId
        ? await fetch(`/api/formlar/${formId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            // Yanıt almış formda sorular gönderilmez — sunucu 400 döndürür
            body: JSON.stringify(sorularKilitli ? meta : { ...meta, sorular: soruPayload }),
          })
        : await fetch("/api/formlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...meta, sorular: soruPayload }),
          });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        toast({ type: "error", title: "Kaydedilemedi", message: d?.error ?? "Lütfen alanları kontrol edin." });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["formlar"] });
      if (formId) {
        queryClient.invalidateQueries({ queryKey: ["form", formId] });
        toast({ type: "success", title: "Form güncellendi", message: meta.baslik });
      } else {
        toast({ type: "success", title: "Form oluşturuldu", message: "Form taslak olarak kaydedildi. Listeden yayınlayabilirsiniz." });
      }
      router.push("/panel/admin/form-yonetimi");
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setSaving(false);
    }
  }

  if (formId && isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-5">
        <Skeleton className="h-4 w-32" />
        <div className="sv-section p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonText lines={3} />
        </div>
        <div className="sv-section p-6">
          <SkeletonText lines={4} />
        </div>
      </div>
    );
  }

  if (formId && isError) {
    return (
      <div className="p-6 lg:p-8">
        <div className="sv-section px-6 py-14 text-center">
          <p className="text-[14.5px] font-semibold text-heading">Form yüklenemedi</p>
          <p className="text-[13px] text-muted mt-1 mb-4">Form silinmiş veya erişim yetkiniz olmayabilir.</p>
          <Link href="/panel/admin/form-yonetimi" className="text-[13px] font-semibold hover:underline" style={{ color: "var(--accent)" }}>
            ← Form Yönetimi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl">
      <Link
        href="/panel/admin/form-yonetimi"
        className="inline-block text-[13px] font-semibold hover:underline"
        style={{ color: "var(--accent)" }}
      >
        ← Form Yönetimi
      </Link>

      <div className="sv-page-header" style={{ marginBottom: 0 }}>
        <h1>{formId ? "Formu Düzenle" : "Yeni Form"}</h1>
        <p>{formId ? "Form bilgilerini ve sorularını güncelleyin" : "Bölge ve il sorumlularına yönelik yeni bir form hazırlayın"}</p>
      </div>

      {sorularKilitli && (
        <div
          className="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-medium"
          style={{ background: "var(--bg-th)", borderColor: "#D97706", color: "#B45309" }}
          role="status"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Bu form {yanitSayisi} yanıt aldı — sorular kilitli. Yalnızca başlık, açıklama ve görünürlük
            ayarlarını değiştirebilirsiniz. Soruları değiştirmek için yeni bir form oluşturun.
          </span>
        </div>
      )}

      {/* ── Form bilgileri ── */}
      <div className="sv-section p-6 space-y-4">
        <Input
          label="Başlık"
          required
          value={baslik}
          onChange={e => setBaslik(e.target.value)}
          placeholder="Örn: 2026 Bahar Dönemi Faaliyet Anketi"
          maxLength={200}
        />
        <Textarea
          label="Açıklama"
          value={aciklama}
          onChange={e => setAciklama(e.target.value)}
          placeholder="Formun amacını kısaca açıklayın (isteğe bağlı)"
          rows={3}
          maxLength={2000}
        />
      </div>

      {/* ── Görünürlük ── */}
      <div className="sv-section p-6">
        <h2 className="text-[14px] font-bold text-heading mb-1">Kimler Görecek</h2>
        <p className="text-[12.5px] text-muted mb-4">
          Formu görecek roller ve sistemler — her iki rol de seçilirse form her ikisine açılır.
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <CheckRow checked={hedefBolge} onChange={setHedefBolge} label="Bölge Sorumluları" />
            <CheckRow checked={hedefIl} onChange={setHedefIl} label="İl Sorumluları" />
          </div>
          <div className="flex flex-wrap gap-2">
            <CheckRow checked={sistemEgitim} onChange={setSistemEgitim} label="Eğitim Sistemi" />
            <CheckRow checked={sistemUniversite} onChange={setSistemUniversite} label="Üniversite Sistemi" />
            <CheckRow checked={sistemLise} onChange={setSistemLise} label="Lise Sistemi" />
          </div>
        </div>
      </div>

      {/* ── Sorular ── */}
      <div className="sv-section p-6 space-y-4">
        <div>
          <h2 className="text-[14px] font-bold text-heading mb-1">Sorular</h2>
          <p className="text-[12.5px] text-muted">
            {sorularKilitli ? "Yanıt alınmış formda sorular değiştirilemez." : "Soruları ekleyin, sıralayın ve gerekirse zorunlu işaretleyin."}
          </p>
        </div>

        {sorular.length === 0 && (
          <p className="text-[13px] text-muted rounded-xl border border-dashed border-border px-4 py-6 text-center">
            Henüz soru eklenmedi.
          </p>
        )}

        {sorular.map((s, i) => (
          <div key={s.key} className="rounded-xl border border-border p-4 space-y-3" style={{ background: "var(--bg-th)" }}>
            <div className="flex items-start gap-3">
              <span
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold mt-7"
                style={{ background: "var(--bg-active)", color: "var(--accent)" }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-[1fr_200px]">
                <Input
                  label="Soru Etiketi"
                  value={s.etiket}
                  onChange={e => soruGuncelle(s.key, { etiket: e.target.value })}
                  placeholder="Soru metni"
                  maxLength={200}
                  disabled={sorularKilitli}
                />
                <Select
                  label="Tip"
                  value={s.tip}
                  onChange={e => soruGuncelle(s.key, { tip: e.target.value as SoruTip })}
                  disabled={sorularKilitli}
                >
                  {SORU_TIPLERI.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="shrink-0 flex flex-col gap-1 mt-6">
                <button
                  onClick={() => soruTasi(i, -1)}
                  disabled={sorularKilitli || i === 0}
                  aria-label="Soruyu yukarı taşı"
                  className="p-1.5 rounded-lg border border-border text-muted hover:bg-[var(--bg-hover)] disabled:opacity-35 transition"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => soruTasi(i, 1)}
                  disabled={sorularKilitli || i === sorular.length - 1}
                  aria-label="Soruyu aşağı taşı"
                  className="p-1.5 rounded-lg border border-border text-muted hover:bg-[var(--bg-hover)] disabled:opacity-35 transition"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  onClick={() => soruSil(s.key)}
                  disabled={sorularKilitli}
                  aria-label="Soruyu sil"
                  className="p-1.5 rounded-lg border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-35 transition"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {secimliMi(s.tip) && (
              <div className="pl-10">
                <Textarea
                  label="Seçenekler (her satıra bir)"
                  value={s.seceneklerText}
                  onChange={e => soruGuncelle(s.key, { seceneklerText: e.target.value })}
                  placeholder={"Seçenek 1\nSeçenek 2"}
                  rows={3}
                  hint="En az 2 seçenek girin."
                  disabled={sorularKilitli}
                />
              </div>
            )}

            <label className={`ml-10 inline-flex items-center gap-2 text-[13px] font-semibold text-secondary ${sorularKilitli ? "opacity-60" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={s.zorunlu}
                disabled={sorularKilitli}
                onChange={e => soruGuncelle(s.key, { zorunlu: e.target.checked })}
                className="accent-[var(--accent-solid)]"
              />
              Zorunlu
            </label>
          </div>
        ))}

        {!sorularKilitli && (
          <Button variant="outline" onClick={soruEkle}>
            <Plus size={15} />
            Soru Ekle
          </Button>
        )}
      </div>

      {/* ── Kaydet ── */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/panel/admin/form-yonetimi">
          <Button variant="secondary" disabled={saving}>Vazgeç</Button>
        </Link>
        <Button onClick={handleKaydet} loading={saving}>
          {formId ? "Değişiklikleri Kaydet" : "Formu Oluştur"}
        </Button>
      </div>
    </div>
  );
}
