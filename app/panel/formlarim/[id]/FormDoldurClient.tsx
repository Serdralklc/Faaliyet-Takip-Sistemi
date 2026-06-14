"use client";

/**
 * Dinamik form doldurma / yanıt görüntüleme ekranı.
 * Yanıt verilmişse salt-okunur gösterilir; verilmemişse soru tiplerine göre
 * alanlar üretilir, dosyalar anında yüklenir ve tek seferde gönderilir.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDateTR } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Download, Upload, X, AlertTriangle } from "lucide-react";
import { type SoruTip, cevapsizTip, formSoruGorunur } from "@/lib/form-yonetimi";

interface Soru {
  id: string;
  sira: number;
  etiket: string;
  tip: SoruTip;
  zorunlu: boolean;
  secenekler: string[];
  aciklama?: string | null;
  kosulSoruId?: string | null;
  kosulDeger?: string | null;
}

interface DosyaCevap {
  dosyaId: string;
  ad: string;
  url: string;
}

type Cevap = string | number | string[] | DosyaCevap;

interface FormDetay {
  id: string;
  baslik: string;
  aciklama?: string | null;
  sorular: Soru[];
  yanitim: { cevaplar: Record<string, Cevap>; createdAt: string } | null;
}

const DOSYA_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*";

/** Grup alanları (radyo/checkbox/dosya) için ortak etiket + açıklama */
function SoruEtiket({ soru }: { soru: Soru }) {
  return (
    <>
      <p className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">
        {soru.etiket}
        {soru.zorunlu && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
      </p>
      {soru.aciklama && (
        <p className="text-[12.5px] text-muted -mt-1 mb-2 whitespace-pre-wrap">{soru.aciklama}</p>
      )}
    </>
  );
}

/** Bölüm başlığı (cevap toplamaz) — form içinde bölüm ayıracı */
function BolumBasligi({ soru }: { soru: Soru }) {
  return (
    <div className="pt-2 first:pt-0">
      <h3 className="text-[15px] font-extrabold text-heading border-b pb-1.5" style={{ borderColor: "var(--border)" }}>
        {soru.etiket || "Bölüm"}
      </h3>
      {soru.aciklama && <p className="text-[13px] text-muted mt-1.5 whitespace-pre-wrap">{soru.aciklama}</p>}
    </div>
  );
}

function InlineHata({ mesaj }: { mesaj?: string }) {
  if (!mesaj) return null;
  return (
    <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">{mesaj}</p>
  );
}

function dosyaCevapMi(c: Cevap | undefined | null): c is DosyaCevap {
  return typeof c === "object" && c !== null && !Array.isArray(c) && "url" in c;
}

/** Salt-okunur modda tek cevabın gösterimi */
function CevapGoster({ soru, cevap }: { soru: Soru; cevap: Cevap | undefined }) {
  if (cevap === undefined || cevap === null || cevap === "" || (Array.isArray(cevap) && cevap.length === 0)) {
    return <p className="text-[13.5px] text-muted">—</p>;
  }
  if (dosyaCevapMi(cevap)) {
    return (
      <a
        href={cevap.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent)] hover:underline"
      >
        <Download size={13} strokeWidth={2} />
        {cevap.ad}
      </a>
    );
  }
  if (Array.isArray(cevap)) {
    return <p className="text-[13.5px] text-heading">{cevap.join(", ")}</p>;
  }
  if (soru.tip === "TARIH" && typeof cevap === "string") {
    return <p className="text-[13.5px] text-heading">{formatDateTR(cevap)}</p>;
  }
  return <p className="text-[13.5px] text-heading whitespace-pre-wrap">{String(cevap)}</p>;
}

export function FormDoldurClient({ formId }: { formId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [cevaplar, setCevaplar] = useState<Record<string, Cevap>>({});
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [yukleniyor, setYukleniyor] = useState<Record<string, boolean>>({});
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [lokalYanit, setLokalYanit] = useState<{ cevaplar: Record<string, Cevap>; createdAt: string } | null>(null);

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ["formlarim", formId],
    queryFn: async (): Promise<FormDetay> => {
      const res = await fetch(`/api/formlarim/${formId}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Form yüklenemedi.");
      }
      return res.json();
    },
    retry: false,
  });

  function setCevap(soruId: string, deger: Cevap) {
    setCevaplar(c => ({ ...c, [soruId]: deger }));
    setHatalar(h => {
      if (!h[soruId]) return h;
      const n = { ...h };
      delete n[soruId];
      return n;
    });
  }

  function cokluToggle(soruId: string, secenek: string) {
    const mevcut = cevaplar[soruId];
    const dizi = Array.isArray(mevcut) ? mevcut : [];
    setCevap(soruId, dizi.includes(secenek) ? dizi.filter(s => s !== secenek) : [...dizi, secenek]);
  }

  async function handleDosyaSec(soruId: string, file: File | null) {
    if (!file) return;
    setYukleniyor(y => ({ ...y, [soruId]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/formlarim/dosya", { method: "POST", body: fd });
      const d = await res.json().catch(() => null);
      if (res.status === 201 && d?.dosyaId) {
        setCevap(soruId, { dosyaId: d.dosyaId, ad: d.ad, url: d.url });
      } else {
        toast({ type: "error", title: "Dosya yüklenemedi", message: d?.error });
      }
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setYukleniyor(y => ({ ...y, [soruId]: false }));
    }
  }

  function dosyaKaldir(soruId: string) {
    setCevaplar(c => {
      const n = { ...c };
      delete n[soruId];
      return n;
    });
  }

  async function handleGonder() {
    if (!form) return;

    // Zorunlu alan kontrolü — boşlar inline işaretlenir (bölüm + koşulu sağlanmayan sorular atlanır)
    const errs: Record<string, string> = {};
    for (const soru of form.sorular) {
      if (cevapsizTip(soru.tip)) continue;
      if (!formSoruGorunur(soru, form.sorular, cevaplar)) continue;
      if (!soru.zorunlu) continue;
      const c = cevaplar[soru.id];
      const bos =
        c === undefined || c === null || c === "" ||
        (Array.isArray(c) && c.length === 0);
      if (bos) errs[soru.id] = "Bu alan zorunludur.";
    }
    setHatalar(errs);
    if (Object.keys(errs).length > 0) {
      toast({ type: "warning", title: "Eksik alanlar var", message: "Zorunlu soruları doldurun." });
      return;
    }

    // SAYI cevaplarını sayıya çevir; boş, bölüm ve gizli (koşul dışı) soruları gönderme
    const payload: Record<string, Cevap> = {};
    for (const soru of form.sorular) {
      if (cevapsizTip(soru.tip)) continue;
      if (!formSoruGorunur(soru, form.sorular, cevaplar)) continue;
      const c = cevaplar[soru.id];
      if (c === undefined || c === null || c === "" || (Array.isArray(c) && c.length === 0)) continue;
      payload[soru.id] = soru.tip === "SAYI" && typeof c === "string" ? Number(c) : c;
    }

    setGonderiliyor(true);
    try {
      const res = await fetch(`/api/formlarim/${formId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cevaplar: payload }),
      });
      if (res.status === 201) {
        toast({ type: "success", title: "Form gönderildi", message: "Yanıtınız kaydedildi." });
        setLokalYanit({ cevaplar: payload, createdAt: new Date().toISOString() });
        queryClient.invalidateQueries({ queryKey: ["formlarim"] });
      } else {
        const d = await res.json().catch(() => null);
        toast({ type: "error", title: "Gönderilemedi", message: d?.error });
      }
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setGonderiliyor(false);
    }
  }

  // ── Yükleniyor ──
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl">
        <Skeleton className="h-4 w-36 mb-6" />
        <div className="sv-section p-6 space-y-5">
          <Skeleton className="h-5 w-2/3" />
          <SkeletonText lines={2} />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </div>
    );
  }

  // ── 404 / 403 — hata kartı ──
  if (isError || !form) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="sv-section p-10 flex flex-col items-center text-center">
          <AlertTriangle size={36} strokeWidth={1.5} className="text-red-500" />
          <p className="mt-3 text-sm font-semibold text-heading">Form bulunamadı veya size açık değil.</p>
          <Link
            href="/panel/formlarim"
            className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent)] hover:underline"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Formlarıma dön
          </Link>
        </div>
      </div>
    );
  }

  const yanit = form.yanitim ?? lokalYanit;

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-5">
      <Link
        href="/panel/formlarim"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-[var(--accent)] transition"
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Formlarıma dön
      </Link>

      <div className="sv-page-header" style={{ marginBottom: 0 }}>
        <h1>{form.baslik}</h1>
        {form.aciklama && <p>{form.aciklama}</p>}
      </div>

      {/* ── Salt-okunur mod ── */}
      {yanit ? (
        <>
          <div
            className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-4 py-3 flex items-center gap-2.5"
            role="status"
          >
            <CheckCircle2 size={17} strokeWidth={2} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-[13.5px] font-semibold text-green-800 dark:text-green-300">
              Bu formu {formatDateTR(yanit.createdAt)} tarihinde yanıtladınız
            </p>
          </div>

          <div className="sv-section p-6 space-y-5">
            {form.sorular.map(soru => {
              if (cevapsizTip(soru.tip)) return <BolumBasligi key={soru.id} soru={soru} />;
              if (!formSoruGorunur(soru, form.sorular, yanit.cevaplar)) return null;
              return (
                <div key={soru.id}>
                  <SoruEtiket soru={soru} />
                  <CevapGoster soru={soru} cevap={yanit.cevaplar[soru.id]} />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Doldurma modu ── */
        <div className="sv-section p-6 space-y-6">
          {form.sorular.map(soru => {
            const cevap = cevaplar[soru.id];
            const hata = hatalar[soru.id];

            // Bölüm başlığı — cevap toplamaz
            if (cevapsizTip(soru.tip)) return <BolumBasligi key={soru.id} soru={soru} />;
            // Koşullu görünürlük — koşulu sağlanmayan soru gösterilmez
            if (!formSoruGorunur(soru, form.sorular, cevaplar)) return null;

            const ipucu = soru.aciklama || undefined;

            switch (soru.tip) {
              case "KISA_METIN":
                return (
                  <Input
                    key={soru.id}
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                    maxLength={5000}
                  />
                );

              case "UZUN_METIN":
                return (
                  <Textarea
                    key={soru.id}
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                    maxLength={5000}
                  />
                );

              case "SAYI":
                return (
                  <Input
                    key={soru.id}
                    type="number"
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" || typeof cevap === "number" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                  />
                );

              case "TARIH":
                return (
                  <Input
                    key={soru.id}
                    type="date"
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                  />
                );

              case "SAAT":
                return (
                  <Input
                    key={soru.id}
                    type="time"
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                  />
                );

              case "TELEFON":
                return (
                  <Input
                    key={soru.id}
                    type="tel"
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    placeholder="05XX XXX XX XX"
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                    maxLength={20}
                  />
                );

              case "EPOSTA":
                return (
                  <Input
                    key={soru.id}
                    type="email"
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    placeholder="ornek@eposta.com"
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                    maxLength={200}
                  />
                );

              case "ACILIR_LISTE":
                return (
                  <Select
                    key={soru.id}
                    label={soru.etiket}
                    hint={ipucu}
                    required={soru.zorunlu}
                    error={hata}
                    value={typeof cevap === "string" ? cevap : ""}
                    onChange={e => setCevap(soru.id, e.target.value)}
                  >
                    <option value="">— Seçin —</option>
                    {soru.secenekler.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                );

              case "EVET_HAYIR":
                return (
                  <fieldset key={soru.id}>
                    <legend className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">
                      {soru.etiket}
                      {soru.zorunlu && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
                    </legend>
                    {soru.aciklama && <p className="text-[12.5px] text-muted -mt-1 mb-2 whitespace-pre-wrap">{soru.aciklama}</p>}
                    <div className="flex flex-wrap gap-2" role="radiogroup">
                      {["Evet", "Hayır"].map(secenek => {
                        const aktif = cevap === secenek;
                        return (
                          <label
                            key={secenek}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
                            style={aktif
                              ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                              : { borderColor: "var(--border)", color: "var(--text-muted)" }}
                          >
                            <input
                              type="radio"
                              name={`soru-${soru.id}`}
                              value={secenek}
                              checked={aktif}
                              onChange={() => setCevap(soru.id, secenek)}
                              className="accent-[var(--accent-solid)]"
                            />
                            {secenek}
                          </label>
                        );
                      })}
                    </div>
                    <InlineHata mesaj={hata} />
                  </fieldset>
                );

              case "TEK_SECIM":
                return (
                  <fieldset key={soru.id}>
                    <legend className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">
                      {soru.etiket}
                      {soru.zorunlu && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
                    </legend>
                    <div className="flex flex-wrap gap-2" role="radiogroup">
                      {soru.secenekler.map(secenek => {
                        const aktif = cevap === secenek;
                        return (
                          <label
                            key={secenek}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
                            style={aktif
                              ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                              : { borderColor: "var(--border)", color: "var(--text-muted)" }}
                          >
                            <input
                              type="radio"
                              name={`soru-${soru.id}`}
                              value={secenek}
                              checked={aktif}
                              onChange={() => setCevap(soru.id, secenek)}
                              className="accent-[var(--accent-solid)]"
                            />
                            {secenek}
                          </label>
                        );
                      })}
                    </div>
                    <InlineHata mesaj={hata} />
                  </fieldset>
                );

              case "COKLU_SECIM": {
                const seciliDizi = Array.isArray(cevap) ? cevap : [];
                return (
                  <fieldset key={soru.id}>
                    <legend className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">
                      {soru.etiket}
                      {soru.zorunlu && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {soru.secenekler.map(secenek => {
                        const aktif = seciliDizi.includes(secenek);
                        return (
                          <label
                            key={secenek}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
                            style={aktif
                              ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                              : { borderColor: "var(--border)", color: "var(--text-muted)" }}
                          >
                            <input
                              type="checkbox"
                              value={secenek}
                              checked={aktif}
                              onChange={() => cokluToggle(soru.id, secenek)}
                              className="accent-[var(--accent-solid)]"
                            />
                            {secenek}
                          </label>
                        );
                      })}
                    </div>
                    <InlineHata mesaj={hata} />
                  </fieldset>
                );
              }

              case "DOSYA": {
                const dosya = dosyaCevapMi(cevap) ? cevap : null;
                const yukluyor = !!yukleniyor[soru.id];
                return (
                  <div key={soru.id}>
                    <SoruEtiket soru={soru} />
                    {dosya ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="success">✓ {dosya.ad} yüklendi</Badge>
                        <Button variant="ghost" size="sm" onClick={() => dosyaKaldir(soru.id)}>
                          <X size={13} strokeWidth={2.5} />
                          Kaldır
                        </Button>
                      </div>
                    ) : (
                      <label
                        className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed text-[13px] font-semibold transition ${
                          yukluyor ? "opacity-60 cursor-wait" : "cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        } ${hata ? "border-red-400 text-red-600" : "border-[var(--border-input)] text-muted"}`}
                      >
                        <Upload size={14} strokeWidth={2} />
                        {yukluyor ? "Yükleniyor..." : "Dosya Seç"}
                        <input
                          type="file"
                          className="hidden"
                          accept={DOSYA_ACCEPT}
                          disabled={yukluyor}
                          onChange={e => {
                            handleDosyaSec(soru.id, e.target.files?.[0] ?? null);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                    <InlineHata mesaj={hata} />
                  </div>
                );
              }

              default:
                return null;
            }
          })}

          <div className="pt-2 border-t border-border flex justify-end">
            <Button onClick={handleGonder} loading={gonderiliyor}>
              Gönder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
