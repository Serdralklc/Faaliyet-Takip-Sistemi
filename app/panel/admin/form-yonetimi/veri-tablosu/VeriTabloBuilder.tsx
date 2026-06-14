"use client";

/**
 * Veri Tablosu oluşturma/düzenleme (yönetici). Sütun tasarımı: ekle/sil/sırala/tür/zorunlu.
 * Kayıt girilmiş tabloda sütunlar kilitlenir (yalnız meta düzenlenir). FormBuilder'a paralel.
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
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SUTUN_TIPLERI, SUTUN_TIP_LABEL, type SutunTip } from "@/lib/veri-tablosu";

interface SutunDraft {
  key: string;
  baslik: string;
  tip: SutunTip;
  zorunlu: boolean;
  seceneklerText: string;
}

interface TabloDetay {
  id: string;
  baslik: string;
  aciklama?: string | null;
  hedefBolge: boolean; hedefIl: boolean;
  sistemEgitim: boolean; sistemUniversite: boolean; sistemLise: boolean;
  sutunlar: { id: string; sira: number; baslik: string; tip: SutunTip; zorunlu: boolean; secenekler: string[] }[];
  _count?: { kayitlar: number };
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13.5px] font-semibold transition cursor-pointer"
      style={checked ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--text-muted)" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-[var(--accent-solid)]" />
      {label}
    </label>
  );
}

export function VeriTabloBuilder({ tabloId }: { tabloId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const keyCounter = useRef(0);
  const nextKey = () => `sutun-${++keyCounter.current}-${Date.now()}`;

  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [hedefBolge, setHedefBolge] = useState(false);
  const [hedefIl, setHedefIl] = useState(false);
  const [sistemEgitim, setSistemEgitim] = useState(false);
  const [sistemUniversite, setSistemUniversite] = useState(false);
  const [sistemLise, setSistemLise] = useState(false);
  const [sutunlar, setSutunlar] = useState<SutunDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: tablo, isLoading, isError } = useQuery({
    queryKey: ["veri-tablosu", tabloId],
    queryFn: async (): Promise<TabloDetay> => {
      const res = await fetch(`/api/veri-tablolari/${tabloId}`);
      if (!res.ok) throw new Error("Tablo yüklenemedi.");
      return res.json();
    },
    enabled: !!tabloId,
  });

  const yuklendiMi = useRef(false);
  useEffect(() => {
    if (!tablo || yuklendiMi.current) return;
    yuklendiMi.current = true;
    setBaslik(tablo.baslik);
    setAciklama(tablo.aciklama ?? "");
    setHedefBolge(tablo.hedefBolge); setHedefIl(tablo.hedefIl);
    setSistemEgitim(tablo.sistemEgitim); setSistemUniversite(tablo.sistemUniversite); setSistemLise(tablo.sistemLise);
    setSutunlar(tablo.sutunlar.map(s => ({
      key: nextKey(), baslik: s.baslik, tip: s.tip, zorunlu: s.zorunlu, seceneklerText: s.secenekler.join("\n"),
    })));
  }, [tablo]);

  const kayitSayisi = tablo?._count?.kayitlar ?? 0;
  const sutunlarKilitli = !!tabloId && kayitSayisi > 0;

  const guncelle = (key: string, patch: Partial<SutunDraft>) =>
    setSutunlar(prev => prev.map(s => (s.key === key ? { ...s, ...patch } : s)));
  const ekle = () => setSutunlar(prev => [...prev, { key: nextKey(), baslik: "", tip: "METIN", zorunlu: false, seceneklerText: "" }]);
  const sil = (key: string) => setSutunlar(prev => prev.filter(s => s.key !== key));
  const tasi = (i: number, yon: -1 | 1) => setSutunlar(prev => {
    const h = i + yon; if (h < 0 || h >= prev.length) return prev;
    const n = [...prev]; [n[i], n[h]] = [n[h], n[i]]; return n;
  });

  async function handleKaydet() {
    if (!baslik.trim()) { toast({ type: "warning", title: "Başlık gerekli" }); return; }
    if (!sutunlarKilitli) {
      if (sutunlar.length === 0) { toast({ type: "warning", title: "Sütun ekleyin", message: "En az bir sütun gerekli." }); return; }
      const eksik = sutunlar.find(s => s.tip === "SECIM" && s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean).length < 1);
      if (eksik) { toast({ type: "warning", title: "Seçenek eksik", message: `"${eksik.baslik || "Seçim sütunu"}" için en az 1 seçenek girin.` }); return; }
    }
    const meta = { baslik: baslik.trim(), aciklama: aciklama.trim(), hedefBolge, hedefIl, sistemEgitim, sistemUniversite, sistemLise };
    const sutunPayload = sutunlar.map(s => ({
      baslik: s.baslik.trim(), tip: s.tip, zorunlu: s.zorunlu,
      secenekler: s.tip === "SECIM" ? s.seceneklerText.split("\n").map(x => x.trim()).filter(Boolean) : [],
    }));

    setSaving(true);
    try {
      const res = tabloId
        ? await fetch(`/api/veri-tablolari/${tabloId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sutunlarKilitli ? meta : { ...meta, sutunlar: sutunPayload }) })
        : await fetch("/api/veri-tablolari", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...meta, sutunlar: sutunPayload }) });
      if (!res.ok) { const d = await res.json().catch(() => null); toast({ type: "error", title: "Kaydedilemedi", message: d?.error }); return; }
      queryClient.invalidateQueries({ queryKey: ["veri-tablolari"] });
      if (tabloId) queryClient.invalidateQueries({ queryKey: ["veri-tablosu", tabloId] });
      toast({ type: "success", title: tabloId ? "Tablo güncellendi" : "Tablo oluşturuldu", message: tabloId ? meta.baslik : "Taslak kaydedildi. Listeden yayınlayabilirsiniz." });
      router.push("/panel/admin/form-yonetimi");
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setSaving(false); }
  }

  if (tabloId && isLoading) return <div className="p-6 lg:p-8 space-y-5"><Skeleton className="h-4 w-32" /><div className="sv-section p-6 space-y-4"><Skeleton className="h-10 w-full" /><SkeletonText lines={3} /></div></div>;
  if (tabloId && isError) return (
    <div className="p-6 lg:p-8"><div className="sv-section px-6 py-14 text-center">
      <p className="text-[14.5px] font-semibold text-heading">Tablo yüklenemedi</p>
      <Link href="/panel/admin/form-yonetimi" className="text-[13px] font-semibold hover:underline mt-3 inline-block" style={{ color: "var(--accent)" }}>← Form Yönetimi</Link>
    </div></div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-4xl">
      <Link href="/panel/admin/form-yonetimi" className="inline-block text-[13px] font-semibold hover:underline" style={{ color: "var(--accent)" }}>← Form Yönetimi</Link>
      <div className="sv-page-header" style={{ marginBottom: 0 }}>
        <h1>{tabloId ? "Veri Tablosunu Düzenle" : "Yeni Veri Tablosu"}</h1>
        <p>İl/bölge sorumlularının değişken sayıda kayıt (sınırsız satır) girebileceği bir tablo tasarlayın</p>
      </div>

      {sutunlarKilitli && (
        <div className="flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-medium" style={{ background: "var(--bg-th)", borderColor: "#D97706", color: "#B45309" }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Bu tabloya {kayitSayisi} kayıt girilmiş — sütunlar kilitli. Yalnızca başlık, açıklama ve görünürlüğü değiştirebilirsiniz.</span>
        </div>
      )}

      <div className="sv-section p-6 space-y-4">
        <Input label="Başlık" required value={baslik} onChange={e => setBaslik(e.target.value)} placeholder="Örn: Üniversiteye Yerleşen Mezunlar" maxLength={200} />
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">Açıklama</label>
          <RichTextEditor value={aciklama} onChange={setAciklama} placeholder="Tablonun amacını açıklayın (isteğe bağlı)" ariaLabel="Tablo açıklaması" />
        </div>
      </div>

      <div className="sv-section p-6">
        <h2 className="text-[14px] font-bold text-heading mb-1">Kimler Doldurabilir</h2>
        <p className="text-[12.5px] text-muted mb-4">Tabloyu görüp satır girebilecek roller ve sistemler.</p>
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

      <div className="sv-section p-6 space-y-4">
        <div>
          <h2 className="text-[14px] font-bold text-heading mb-1">Sütunlar</h2>
          <p className="text-[12.5px] text-muted">{sutunlarKilitli ? "Kayıt girilmiş tabloda sütunlar değiştirilemez." : "Tablonun sütunlarını (alanlarını) tanımlayın."}</p>
        </div>

        {sutunlar.length === 0 && <p className="text-[13px] text-muted rounded-xl border border-dashed border-border px-4 py-6 text-center">Henüz sütun eklenmedi.</p>}

        {sutunlar.map((s, i) => (
          <div key={s.key} className="rounded-xl border border-border p-4 space-y-3" style={{ background: "var(--bg-th)" }}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold mt-7" style={{ background: "var(--bg-active)", color: "var(--accent)" }}>{i + 1}</span>
              <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input label="Sütun Başlığı" value={s.baslik} onChange={e => guncelle(s.key, { baslik: e.target.value })} placeholder="Örn: Ad Soyad" maxLength={200} disabled={sutunlarKilitli} />
                <Select label="Tür" value={s.tip} onChange={e => guncelle(s.key, { tip: e.target.value as SutunTip })} disabled={sutunlarKilitli}>
                  {SUTUN_TIPLERI.map(t => <option key={t} value={t}>{SUTUN_TIP_LABEL[t]}</option>)}
                </Select>
              </div>
              <div className="shrink-0 flex flex-col gap-1 mt-6">
                <button onClick={() => tasi(i, -1)} disabled={sutunlarKilitli || i === 0} aria-label="Yukarı" className="p-1.5 rounded-lg border border-border text-muted hover:bg-[var(--bg-hover)] disabled:opacity-35 transition"><ArrowUp size={13} /></button>
                <button onClick={() => tasi(i, 1)} disabled={sutunlarKilitli || i === sutunlar.length - 1} aria-label="Aşağı" className="p-1.5 rounded-lg border border-border text-muted hover:bg-[var(--bg-hover)] disabled:opacity-35 transition"><ArrowDown size={13} /></button>
                <button onClick={() => sil(s.key)} disabled={sutunlarKilitli} aria-label="Sil" className="p-1.5 rounded-lg border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-35 transition"><X size={13} /></button>
              </div>
            </div>
            {s.tip === "SECIM" && (
              <div className="pl-10">
                <Textarea label="Seçenekler (her satıra bir)" value={s.seceneklerText} onChange={e => guncelle(s.key, { seceneklerText: e.target.value })} placeholder={"Seçenek 1\nSeçenek 2"} rows={3} disabled={sutunlarKilitli} />
              </div>
            )}
            <label className={`ml-10 inline-flex items-center gap-2 text-[13px] font-semibold text-secondary ${sutunlarKilitli ? "opacity-60" : "cursor-pointer"}`}>
              <input type="checkbox" checked={s.zorunlu} disabled={sutunlarKilitli} onChange={e => guncelle(s.key, { zorunlu: e.target.checked })} className="accent-[var(--accent-solid)]" />
              Zorunlu
            </label>
          </div>
        ))}

        {!sutunlarKilitli && <Button variant="outline" onClick={ekle}><Plus size={15} />Sütun Ekle</Button>}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link href="/panel/admin/form-yonetimi"><Button variant="secondary" disabled={saving}>Vazgeç</Button></Link>
        <Button onClick={handleKaydet} loading={saving}>{tabloId ? "Değişiklikleri Kaydet" : "Tabloyu Oluştur"}</Button>
      </div>
    </div>
  );
}
