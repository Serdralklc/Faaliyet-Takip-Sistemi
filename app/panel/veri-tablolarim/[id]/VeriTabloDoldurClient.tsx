"use client";

/**
 * Veri tablosu doldurma — kullanıcı kendi satırlarını (sınırsız) girer/düzenler.
 * "Satır Ekle" ile yeni satır eklenir; "Kaydet" tüm satırları toplu gönderir.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { RichTextView } from "@/components/ui/RichTextView";
import { ArrowLeft, AlertTriangle, Plus, Trash2, Upload, X, Save } from "lucide-react";

type Hucre = string | number | { dosyaId: string; ad: string; url: string };
type Satir = Record<string, Hucre>;

interface Sutun { id: string; sira: number; baslik: string; tip: string; zorunlu: boolean; secenekler: string[] }
interface TabloDetay {
  id: string; baslik: string; aciklama?: string | null;
  sutunlar: Sutun[];
  benimSatirlarim: { id: string; degerler: Satir }[];
}

const dosyaMi = (c: Hucre | undefined): c is { dosyaId: string; ad: string; url: string } =>
  typeof c === "object" && c !== null && "url" in c;

export function VeriTabloDoldurClient({ tabloId }: { tabloId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [satirlar, setSatirlar] = useState<Satir[] | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState<string | null>(null); // "rowIdx-sutunId"

  const { data: tablo, isLoading, isError } = useQuery({
    queryKey: ["veri-tablom", tabloId],
    queryFn: async (): Promise<TabloDetay> => {
      const res = await fetch(`/api/veri-tablolarim/${tabloId}`);
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error ?? "Yüklenemedi."); }
      const data = await res.json();
      setSatirlar(data.benimSatirlarim.map((k: { degerler: Satir }) => k.degerler));
      return data;
    },
    retry: false,
  });

  const mevcutSatirlar = satirlar ?? [];

  function hucreDegistir(rIdx: number, sutunId: string, deger: Hucre) {
    setSatirlar(prev => {
      const next = [...(prev ?? [])];
      next[rIdx] = { ...next[rIdx], [sutunId]: deger };
      return next;
    });
  }
  function satirEkle() { setSatirlar(prev => [...(prev ?? []), {}]); }
  function satirSil(rIdx: number) { setSatirlar(prev => (prev ?? []).filter((_, i) => i !== rIdx)); }

  async function dosyaYukle(rIdx: number, sutunId: string, file: File | null) {
    if (!file) return;
    const k = `${rIdx}-${sutunId}`;
    setYukleniyor(k);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/formlarim/dosya", { method: "POST", body: fd });
      const d = await res.json().catch(() => null);
      if (res.status === 201 && d?.dosyaId) hucreDegistir(rIdx, sutunId, { dosyaId: d.dosyaId, ad: d.ad, url: d.url });
      else toast({ type: "error", title: "Dosya yüklenemedi", message: d?.error });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setYukleniyor(null); }
  }

  async function handleKaydet() {
    if (!tablo) return;
    // Zorunlu sütun kontrolü (boş satırlar gönderilmez)
    const dolu = (v: Hucre | undefined) => !(v === undefined || v === null || v === "");
    const doluSatirlar = mevcutSatirlar.filter(s => tablo.sutunlar.some(c => dolu(s[c.id])));
    for (const s of doluSatirlar) {
      for (const c of tablo.sutunlar) {
        if (c.zorunlu && !dolu(s[c.id])) {
          toast({ type: "warning", title: "Zorunlu alan boş", message: `"${c.baslik}" her satırda doldurulmalı.` });
          return;
        }
      }
    }
    setKaydediliyor(true);
    try {
      const res = await fetch(`/api/veri-tablolarim/${tabloId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ satirlar: doluSatirlar }),
      });
      const d = await res.json().catch(() => null);
      if (res.status === 201) {
        toast({ type: "success", title: "Kaydedildi", message: `${d?.satirSayisi ?? doluSatirlar.length} satır kaydedildi.` });
        queryClient.invalidateQueries({ queryKey: ["veri-tablolarim"] });
      } else toast({ type: "error", title: "Kaydedilemedi", message: d?.error });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); } finally { setKaydediliyor(false); }
  }

  if (isLoading) return <div className="p-6 lg:p-8 max-w-5xl"><Skeleton className="h-4 w-36 mb-6" /><SkeletonTable rows={4} cols={4} /></div>;
  if (isError || !tablo) return (
    <div className="p-6 lg:p-8 max-w-3xl"><div className="sv-section p-10 flex flex-col items-center text-center">
      <AlertTriangle size={36} strokeWidth={1.5} className="text-red-500" />
      <p className="mt-3 text-sm font-semibold text-heading">Tablo bulunamadı veya size açık değil.</p>
      <Link href="/panel/formlarim" className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--accent)] hover:underline"><ArrowLeft size={14} />Formlarıma dön</Link>
    </div></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-5">
      <Link href="/panel/formlarim" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-[var(--accent)] transition"><ArrowLeft size={14} />Formlarıma dön</Link>
      <div className="sv-page-header" style={{ marginBottom: 0 }}><h1>{tablo.baslik}</h1></div>
      {tablo.aciklama && <div className="sv-section p-5"><RichTextView html={tablo.aciklama} className="text-[13.5px] text-secondary" /></div>}

      <div className="sv-section p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: "var(--bg-th)" }}>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted w-10">#</th>
                {tablo.sutunlar.map(c => (
                  <th key={c.id} className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {c.baslik}{c.zorunlu && <span className="text-red-600 ml-0.5">*</span>}
                  </th>
                ))}
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {mevcutSatirlar.map((satir, rIdx) => (
                <tr key={rIdx} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 text-xs text-muted font-semibold">{rIdx + 1}</td>
                  {tablo.sutunlar.map(c => {
                    const v = satir[c.id];
                    const yuk = yukleniyor === `${rIdx}-${c.id}`;
                    return (
                      <td key={c.id} className="px-2 py-1.5">
                        {c.tip === "SECIM" ? (
                          <select value={typeof v === "string" ? v : ""} onChange={e => hucreDegistir(rIdx, c.id, e.target.value)}
                            className="w-full rounded-lg border px-2 py-1.5 text-[13px]" style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }}>
                            <option value="">—</option>
                            {c.secenekler.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : c.tip === "DOSYA" ? (
                          dosyaMi(v) ? (
                            <span className="inline-flex items-center gap-1.5 text-[12.5px]">
                              <a href={v.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] hover:underline truncate max-w-[140px]">{v.ad}</a>
                              <button onClick={() => hucreDegistir(rIdx, c.id, "")} aria-label="Kaldır"><X size={13} className="text-red-600" /></button>
                            </span>
                          ) : (
                            <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed text-[12.5px] font-semibold ${yuk ? "opacity-60" : "cursor-pointer hover:border-[var(--accent)]"}`} style={{ borderColor: "var(--border-input)", color: "var(--text-muted)" }}>
                              <Upload size={13} />{yuk ? "..." : "Seç"}
                              <input type="file" className="hidden" disabled={yuk} onChange={e => { dosyaYukle(rIdx, c.id, e.target.files?.[0] ?? null); e.target.value = ""; }} />
                            </label>
                          )
                        ) : (
                          <input type={c.tip === "SAYI" ? "number" : c.tip === "TARIH" ? "date" : "text"}
                            value={typeof v === "string" || typeof v === "number" ? v : ""}
                            onChange={e => hucreDegistir(rIdx, c.id, e.target.value)}
                            className="w-full min-w-[120px] rounded-lg border px-2 py-1.5 text-[13px]" style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-primary)" }} />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5">
                    <button onClick={() => satirSil(rIdx)} aria-label="Satırı sil" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {mevcutSatirlar.length === 0 && (
                <tr><td colSpan={tablo.sutunlar.length + 2} className="px-3 py-8 text-center text-[13px] text-muted">Henüz satır yok. “Satır Ekle” ile başlayın.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2.5 border-t" style={{ borderColor: "var(--border)" }}>
          <Button variant="outline" size="sm" onClick={satirEkle}><Plus size={14} />Satır Ekle</Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleKaydet} loading={kaydediliyor}><Save size={15} />Kaydet</Button>
      </div>
    </div>
  );
}
