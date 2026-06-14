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
import { Plus, ArrowUp, ArrowDown, X, AlertTriangle, GitBranch, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  TUM_SORU_TIPLERI, SORU_TIP_LABEL, seceneklimi, cevapsizTip, kosulKaynagiOlabilir,
  type SoruTip,
} from "@/lib/form-yonetimi";

const SORU_TIPLERI: { value: SoruTip; label: string }[] =
  TUM_SORU_TIPLERI.map(v => ({ value: v, label: SORU_TIP_LABEL[v] }));

interface SoruDraft {
  key: string;
  etiket: string;
  tip: SoruTip;
  zorunlu: boolean;
  /** Satır başına bir seçenek — kaydederken '\n' ile bölünür */
  seceneklerText: string;
  /** Soru/bölüm açıklaması (opsiyonel) */
  aciklama: string;
  /** Koşullu görünürlük: bağlı olunan sorunun client key'i (null = her zaman görünür) */
  kosulKey: string | null;
  /** Koşul değeri */
  kosulDeger: string;
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
  sorular: {
    id: string; sira: number; etiket: string; tip: SoruTip; zorunlu: boolean; secenekler: string[];
    aciklama?: string | null; kosulSoruId?: string | null; kosulDeger?: string | null;
  }[];
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

export function FormBuilder({ formId, sablonId }: { formId?: string; sablonId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const keyCounter = useRef(0);
  const nextKey = () => `soru-${++keyCounter.current}-${Date.now()}`;
  const [sablonKaydediliyor, setSablonKaydediliyor] = useState(false);

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

  // Şablondan başlat (yalnızca yeni form + ?sablon)
  const { data: sablon } = useQuery({
    queryKey: ["form-sablon", sablonId],
    queryFn: async () => {
      const res = await fetch(`/api/sablonlar/${sablonId}`);
      if (!res.ok) throw new Error("Şablon yüklenemedi.");
      return res.json();
    },
    enabled: !!sablonId && !formId,
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
    const drafts: SoruDraft[] = form.sorular.map(s => ({
      key: nextKey(),
      etiket: s.etiket,
      tip: s.tip,
      zorunlu: s.zorunlu,
      seceneklerText: s.secenekler.join("\n"),
      aciklama: s.aciklama ?? "",
      kosulKey: null,
      kosulDeger: s.kosulDeger ?? "",
    }));
    // kosulSoruId (kaydedilen SIRA index'i) → o sıradaki sorunun client key'ine çöz
    form.sorular.forEach((s, i) => {
      if (s.kosulSoruId != null && s.kosulSoruId !== "") {
        const idx = Number(s.kosulSoruId);
        if (Number.isInteger(idx) && idx >= 0 && idx < drafts.length && idx !== i) {
          drafts[i].kosulKey = drafts[idx].key;
        }
      }
    });
    setSorular(drafts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Şablon içeriğini state'e aktar (yeni form)
  useEffect(() => {
    if (!sablon || yuklendiMi.current) return;
    yuklendiMi.current = true;
    const ss: Array<{ etiket?: string; tip: SoruTip; zorunlu?: boolean; secenekler?: string[]; aciklama?: string | null; kosulSoruId?: string | null; kosulDeger?: string | null }> = sablon.icerik?.sorular ?? [];
    const drafts: SoruDraft[] = ss.map(s => ({
      key: nextKey(), etiket: s.etiket ?? "", tip: s.tip, zorunlu: !!s.zorunlu,
      seceneklerText: (s.secenekler ?? []).join("\n"), aciklama: s.aciklama ?? "",
      kosulKey: null, kosulDeger: s.kosulDeger ?? "",
    }));
    ss.forEach((s, i) => {
      if (s.kosulSoruId != null && s.kosulSoruId !== "") {
        const idx = Number(s.kosulSoruId);
        if (Number.isInteger(idx) && idx >= 0 && idx < drafts.length && idx !== i) drafts[i].kosulKey = drafts[idx].key;
      }
    });
    setSorular(drafts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sablon]);

  const yanitSayisi = form?._count?.yanitlar ?? 0;
  const sorularKilitli = !!formId && yanitSayisi > 0;

  function soruGuncelle(key: string, patch: Partial<SoruDraft>) {
    setSorular(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));
  }

  function soruEkle() {
    setSorular(prev => [...prev, { key: nextKey(), etiket: "", tip: "KISA_METIN", zorunlu: false, seceneklerText: "", aciklama: "", kosulKey: null, kosulDeger: "" }]);
  }

  function bolumEkle() {
    setSorular(prev => [...prev, { key: nextKey(), etiket: "", tip: "BOLUM", zorunlu: false, seceneklerText: "", aciklama: "", kosulKey: null, kosulDeger: "" }]);
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

  function soruPayloadOlustur() {
    const keyToIndex = new Map(sorular.map((s, i) => [s.key, i] as const));
    return sorular.map(s => ({
      etiket: s.etiket.trim(),
      tip: s.tip,
      zorunlu: cevapsizTip(s.tip) ? false : s.zorunlu,
      secenekler: seceneklimi(s.tip) ? s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean) : [],
      aciklama: s.aciklama.trim() || null,
      // Koşul: bağlı sorunun client key'i → SIRA index'i (kalıcı, ID değişiminden bağımsız)
      kosulSoruId: s.kosulKey != null && keyToIndex.has(s.kosulKey) ? String(keyToIndex.get(s.kosulKey)) : null,
      kosulDeger: s.kosulKey != null ? (s.kosulDeger.trim() || null) : null,
    }));
  }

  async function handleSablonKaydet() {
    if (sorular.length === 0) { toast({ type: "warning", title: "Önce soru ekleyin" }); return; }
    const ad = window.prompt("Şablon adı:", baslik.trim() || "Yeni Form Şablonu");
    if (!ad || !ad.trim()) return;
    setSablonKaydediliyor(true);
    try {
      const res = await fetch("/api/sablonlar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: ad.trim(), tur: "FORM", icerik: { sorular: soruPayloadOlustur() } }),
      });
      if (!res.ok) { const d = await res.json().catch(() => null); toast({ type: "error", title: "Şablon kaydedilemedi", message: d?.error }); return; }
      queryClient.invalidateQueries({ queryKey: ["sablonlar"] });
      toast({ type: "success", title: "Şablon kaydedildi", message: ad.trim() });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setSablonKaydediliyor(false); }
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
        seceneklimi(s.tip) && s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean).length < 2
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
    const soruPayload = soruPayloadOlustur();

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
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">Açıklama</label>
          <RichTextEditor
            value={aciklama}
            onChange={setAciklama}
            placeholder="Formun amacını açıklayın — kalın, başlık, liste, renk, görsel, tablo, bağlantı ekleyebilirsiniz (isteğe bağlı)"
            ariaLabel="Form açıklaması"
          />
        </div>
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
                  label={s.tip === "BOLUM" ? "Bölüm Başlığı" : "Soru Etiketi"}
                  value={s.etiket}
                  onChange={e => soruGuncelle(s.key, { etiket: e.target.value })}
                  placeholder={s.tip === "BOLUM" ? "Örn: ÖĞRENCİ BİLGİLERİ" : "Soru metni"}
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

            {/* Açıklama (tüm tipler; Bölüm'de bölüm açıklaması) */}
            <div className="pl-10">
              <Textarea
                label={s.tip === "BOLUM" ? "Bölüm Açıklaması" : "Açıklama (opsiyonel)"}
                value={s.aciklama}
                onChange={e => soruGuncelle(s.key, { aciklama: e.target.value })}
                placeholder={s.tip === "BOLUM" ? "Bu bölüm hakkında açıklama" : "Soru altında gösterilecek yardım metni"}
                rows={2}
                maxLength={2000}
                disabled={sorularKilitli}
              />
            </div>

            {seceneklimi(s.tip) && (
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

            {!cevapsizTip(s.tip) && (
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
            )}

            {/* Koşullu görünürlük (Bölüm hariç) */}
            {!cevapsizTip(s.tip) && (() => {
              const onceki = sorular.slice(0, i).filter(q => kosulKaynagiOlabilir(q.tip) && q.etiket.trim());
              const kaynak = sorular.find(q => q.key === s.kosulKey) ?? null;
              const kaynakSecenekler = kaynak
                ? (kaynak.tip === "EVET_HAYIR" ? ["Evet", "Hayır"] : kaynak.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean))
                : [];
              return (
                <div className="ml-10 rounded-lg border border-dashed p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-muted mb-2">
                    <GitBranch size={13} aria-hidden="true" /> Koşullu Görünürlük
                  </div>
                  {onceki.length === 0 ? (
                    <p className="text-[12px] text-muted">
                      Koşul bağlamak için bu sorudan <strong>önce</strong> bir Tek Seçim / Açılır Liste / Evet-Hayır sorusu ekleyin.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        label="Şu soruya bağlı göster"
                        value={s.kosulKey ?? ""}
                        disabled={sorularKilitli}
                        onChange={e => soruGuncelle(s.key, { kosulKey: e.target.value || null, kosulDeger: "" })}
                      >
                        <option value="">— Her zaman görünür —</option>
                        {onceki.map(q => <option key={q.key} value={q.key}>{q.etiket || "(başlıksız)"}</option>)}
                      </Select>
                      {s.kosulKey && (
                        <Select
                          label="Cevabı şuna eşitse"
                          value={s.kosulDeger}
                          disabled={sorularKilitli}
                          onChange={e => soruGuncelle(s.key, { kosulDeger: e.target.value })}
                        >
                          <option value="">— Değer seçin —</option>
                          {kaynakSecenekler.map(o => <option key={o} value={o}>{o}</option>)}
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}

        {!sorularKilitli && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={soruEkle}>
              <Plus size={15} />
              Soru Ekle
            </Button>
            <Button variant="outline" onClick={bolumEkle}>
              <Plus size={15} />
              Bölüm Ekle
            </Button>
          </div>
        )}
      </div>

      {/* ── Kaydet ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!sorularKilitli && sorular.length > 0 ? (
          <Button variant="outline" onClick={handleSablonKaydet} loading={sablonKaydediliyor} disabled={saving}>
            <LayoutTemplate size={15} />
            Şablon Olarak Kaydet
          </Button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <Link href="/panel/admin/form-yonetimi">
            <Button variant="secondary" disabled={saving}>Vazgeç</Button>
          </Link>
          <Button onClick={handleKaydet} loading={saving}>
            {formId ? "Değişiklikleri Kaydet" : "Formu Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  );
}
