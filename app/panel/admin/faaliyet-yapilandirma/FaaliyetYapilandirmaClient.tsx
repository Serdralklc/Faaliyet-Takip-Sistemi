"use client";

/**
 * Faaliyet Yapılandırma Merkezi — yönetici (Admin + İçerik Yöneticisi).
 * Faz 1: Yıl & Dönem aç/kapa kilidi (her sistem için geçerli dönemler).
 * Kapalı dönemde il eğitimcisi veri giremez/değiştiremez (admin/merkez muaf).
 * API: /api/admin/faaliyet-yapilandirma/donem
 */

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface DonemMeta { kod: string; ad: string; not: string | null }
interface SistemMeta { kod: string; ad: string; donemler: DonemMeta[]; yazYok: boolean }
interface AyarDeger {
  veriGirisiAcik: boolean;
  baslangic: string | null;
  bitis: string | null;
  aciklama: string;
  guncelleyenAd: string | null;
  updatedAt: string;
}
interface DonemResponse {
  yil: number;
  yillar: number[];
  sistemler: SistemMeta[];
  ayarlar: Record<string, AyarDeger>;
}
interface RowState {
  veriGirisiAcik: boolean;
  baslangic: string;
  bitis: string;
  aciklama: string;
  saving: boolean;
}

type Tab = "donem" | "alan" | "kategori" | "ozel";

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex shrink-0 transition disabled:opacity-50"
      style={{
        width: 42, height: 23, borderRadius: 999,
        background: on ? "var(--accent-solid)" : "var(--text-muted)",
      }}
    >
      <span
        className="absolute transition-all"
        style={{
          top: 2, left: on ? 21 : 2, width: 19, height: 19,
          borderRadius: "50%", background: "#fff",
        }}
      />
    </button>
  );
}

function DonemTab() {
  const { toast } = useToast();
  const simdiYil = new Date().getFullYear();
  const [yil, setYil] = useState(simdiYil);
  const [data, setData] = useState<DonemResponse | null>(null);
  const [edits, setEdits] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faaliyet-yapilandirma/donem?yil=${y}`);
      if (!res.ok) throw new Error();
      const json: DonemResponse = await res.json();
      setData(json);
      const e: Record<string, RowState> = {};
      for (const s of json.sistemler) {
        for (const d of s.donemler) {
          const key = `${s.kod}__${d.kod}`;
          const a = json.ayarlar[key];
          e[key] = {
            veriGirisiAcik: a ? a.veriGirisiAcik : true,
            baslangic: a?.baslangic ?? "",
            bitis: a?.bitis ?? "",
            aciklama: a?.aciklama ?? "",
            saving: false,
          };
        }
      }
      setEdits(e);
    } catch {
      toast({ type: "error", title: "Veriler yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(yil); }, [yil, load]);

  const setRow = (key: string, patch: Partial<RowState>) =>
    setEdits(p => ({ ...p, [key]: { ...p[key], ...patch } }));

  const kaydet = async (sistemKod: string, sistemAd: string, donemKod: string, donemAd: string) => {
    const key = `${sistemKod}__${donemKod}`;
    const row = edits[key];
    if (!row) return;
    setRow(key, { saving: true });
    try {
      const res = await fetch(`/api/admin/faaliyet-yapilandirma/donem`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sistem: sistemKod,
          yil,
          donem: donemKod,
          veriGirisiAcik: row.veriGirisiAcik,
          baslangic: row.baslangic || null,
          bitis: row.bitis || null,
          aciklama: row.aciklama || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Kaydedilemedi.");
      }
      toast({
        type: "success",
        title: "Kaydedildi",
        message: `${sistemAd} · ${yil} ${donemAd} → ${row.veriGirisiAcik ? "açık" : "kapalı"}`,
      });
    } catch (e) {
      toast({ type: "error", title: "Hata", message: e instanceof Error ? e.message : "Kaydedilemedi." });
    } finally {
      setRow(key, { saving: false });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-heading">Veri girişi kilidi</h2>
          <p className="text-[12.5px] text-secondary mt-0.5 max-w-2xl leading-relaxed">
            Kapalı dönemde o sistemin il sorumlusu veri <b>giremez/değiştiremez</b> (admin ve merkez muaftır).
            Bir satır hiç ayarlanmazsa <b>açık</b> kabul edilir — mevcut davranış korunur.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[13px] font-semibold text-secondary">
          Yıl
          <select
            value={yil}
            onChange={e => setYil(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-[13px] font-semibold"
          >
            {(data?.yillar ?? [simdiYil]).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-secondary text-sm py-8 text-center">Yükleniyor…</p>
      ) : (
        <div className="space-y-4">
          {data?.sistemler.map(s => (
            <div key={s.kod} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2"
                style={{ background: "var(--bg-hover)" }}>
                <span className="text-[14px] font-bold text-heading">{s.ad}</span>
                {s.yazYok && <span className="text-[11px] text-muted">· yaz dönemi yoktur</span>}
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {s.donemler.map(d => {
                  const key = `${s.kod}__${d.kod}`;
                  const row = edits[key];
                  if (!row) return null;
                  return (
                    <div key={d.kod} className="px-4 py-3"
                      style={{ borderTop: "0.5px solid var(--border)" }}>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <Toggle on={row.veriGirisiAcik} onChange={() => setRow(key, { veriGirisiAcik: !row.veriGirisiAcik })} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-semibold text-heading">{d.ad}</span>
                              {d.not && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md"
                                  style={{ background: "var(--bg-active)", color: "var(--accent)" }}>
                                  {d.not}
                                </span>
                              )}
                            </div>
                            <span className="text-[12px] font-semibold"
                              style={{ color: row.veriGirisiAcik ? "var(--accent)" : "#DC2626" }}>
                              {row.veriGirisiAcik ? "Giriş açık" : "Giriş kapalı"}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" loading={row.saving}
                          onClick={() => kaydet(s.kod, s.ad, d.kod, d.ad)}>
                          Kaydet
                        </Button>
                      </div>

                      <div className="flex items-end gap-3 mt-3 flex-wrap pl-[54px]">
                        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
                          Başlangıç (ops.)
                          <input type="date" value={row.baslangic}
                            onChange={e => setRow(key, { baslangic: e.target.value })}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
                        </label>
                        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
                          Bitiş (ops.)
                          <input type="date" value={row.bitis}
                            onChange={e => setRow(key, { bitis: e.target.value })}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
                        </label>
                        <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted flex-1 min-w-[180px]">
                          Açıklama (kapalıyken kullanıcıya gösterilir)
                          <input type="text" value={row.aciklama} maxLength={300}
                            placeholder="ör. Yaz dönemi veri girişi kapalıdır"
                            onChange={e => setRow(key, { aciklama: e.target.value })}
                            className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AlanItem {
  alanKodu: string; label: string; grup: string | null;
  gorunur: boolean; zorunlu: boolean; aktif: boolean;
}
interface AlanGrup { kod: string; ad: string; alanlar: AlanItem[] }
interface AlanResponse { sistem: string; sistemAd: string; gruplar: AlanGrup[] }
type AlanDeger = { gorunur: boolean; zorunlu: boolean; aktif: boolean };

function AlanTab() {
  const { toast } = useToast();
  const [data, setData] = useState<AlanResponse | null>(null);
  const [items, setItems] = useState<Record<string, AlanDeger>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/faaliyet-yapilandirma/alan");
        if (!res.ok) throw new Error();
        const json: AlanResponse = await res.json();
        setData(json);
        const m: Record<string, AlanDeger> = {};
        json.gruplar.forEach(g => g.alanlar.forEach(a => {
          m[a.alanKodu] = { gorunur: a.gorunur, zorunlu: a.zorunlu, aktif: a.aktif };
        }));
        setItems(m);
        setDirty(false);
      } catch {
        toast({ type: "error", title: "Alanlar yüklenemedi." });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const setField = (kod: string, patch: Partial<AlanDeger>) => {
    setItems(p => ({ ...p, [kod]: { ...p[kod], ...patch } }));
    setDirty(true);
  };

  const kaydet = async () => {
    setSaving(true);
    try {
      const alanlar = Object.entries(items).map(([alanKodu, v]) => ({ alanKodu, ...v }));
      const res = await fetch("/api/admin/faaliyet-yapilandirma/alan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sistem: "EGITIMCI", alanlar }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Kaydedilemedi.");
      }
      toast({ type: "success", title: "Alan ayarları kaydedildi" });
      setDirty(false);
    } catch (e) {
      toast({ type: "error", title: "Hata", message: e instanceof Error ? e.message : "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  const COLS = "1fr 64px 64px 56px";

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-heading">Alan Yönetimi — Eğitim Birimi</h2>
          <p className="text-[12.5px] text-secondary mt-0.5 max-w-2xl leading-relaxed">
            İl eğitimcisinin hangi alanları <b>göreceği / zorunlu</b> olacağı buradan yönetilir.
            <b> Gizli</b> veya <b>pasif</b> alanlar giriş formunda görünmez ve gönderilmez — mevcut verisi
            ve raporlar korunur. Ayar yoksa alan görünür + opsiyonel + aktiftir.
          </p>
        </div>
        <Button loading={saving} disabled={!dirty} onClick={kaydet}>Değişiklikleri kaydet</Button>
      </div>

      {loading ? (
        <p className="text-secondary text-sm py-8 text-center">Yükleniyor…</p>
      ) : (
        <div className="space-y-4">
          {data?.gruplar.map(g => (
            <div key={g.kod} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-2"
                style={{ background: "var(--bg-hover)" }}>
                <span className="text-[14px] font-bold text-heading">{g.ad}</span>
                <div className="hidden sm:grid text-[11px] font-semibold text-muted text-center"
                  style={{ gridTemplateColumns: "64px 64px 56px", gap: 0 }}>
                  <span>Görünür</span><span>Zorunlu</span><span>Aktif</span>
                </div>
              </div>
              <div>
                {g.alanlar.map(a => {
                  const v = items[a.alanKodu];
                  if (!v) return null;
                  const pasif = !v.gorunur || !v.aktif;
                  return (
                    <div key={a.alanKodu} className="grid items-center gap-2 px-4 py-2.5"
                      style={{ gridTemplateColumns: COLS, borderTop: "0.5px solid var(--border)", opacity: pasif ? 0.6 : 1 }}>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-heading truncate">{a.label}</div>
                        <code className="text-[11px] text-muted">{a.alanKodu}</code>
                      </div>
                      <div className="flex justify-center"><Toggle on={v.gorunur} onChange={() => setField(a.alanKodu, { gorunur: !v.gorunur })} /></div>
                      <div className="flex justify-center"><Toggle on={v.zorunlu} onChange={() => setField(a.alanKodu, { zorunlu: !v.zorunlu })} /></div>
                      <div className="flex justify-center"><Toggle on={v.aktif} onChange={() => setField(a.alanKodu, { aktif: !v.aktif })} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface KatYonetim { kodu: string; varsayilanAd: string; ad: string; aktif: boolean; renk: string; turler: string[] }
interface KatResponse { sistem: string; sistemAd: string; kategoriler: KatYonetim[] }
type KatEdit = { ad: string; aktif: boolean; turlerText: string };

function KategoriTurTab() {
  const { toast } = useToast();
  const [sistem, setSistem] = useState<"UNIVERSITE" | "LISE">("UNIVERSITE");
  const [data, setData] = useState<KatResponse | null>(null);
  const [edits, setEdits] = useState<Record<string, KatEdit>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faaliyet-yapilandirma/kategori?sistem=${s}`);
      if (!res.ok) throw new Error();
      const json: KatResponse = await res.json();
      setData(json);
      const e: Record<string, KatEdit> = {};
      json.kategoriler.forEach(k => { e[k.kodu] = { ad: k.ad, aktif: k.aktif, turlerText: k.turler.join("\n") }; });
      setEdits(e);
    } catch {
      toast({ type: "error", title: "Kategoriler yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(sistem); }, [sistem, load]);

  const setKat = (kodu: string, patch: Partial<KatEdit>) =>
    setEdits(p => ({ ...p, [kodu]: { ...p[kodu], ...patch } }));

  const kaydet = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const kategoriler = data.kategoriler.map(k => {
        const e = edits[k.kodu];
        return {
          kodu: k.kodu,
          ad: e.ad,
          aktif: e.aktif,
          turler: e.turlerText.split("\n").map(s => s.trim()).filter(Boolean),
        };
      });
      const res = await fetch("/api/admin/faaliyet-yapilandirma/kategori", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sistem, kategoriler }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Kaydedilemedi.");
      }
      toast({ type: "success", title: "Kategori ve türler kaydedildi" });
    } catch (e) {
      toast({ type: "error", title: "Hata", message: e instanceof Error ? e.message : "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-heading">Kategori & Faaliyet Türü</h2>
          <p className="text-[12.5px] text-secondary mt-0.5 max-w-2xl leading-relaxed">
            Gençlik giriş formundaki kategori adlarını, sırasını (aktif/pasif) ve her kategori altındaki
            <b> faaliyet türü</b> önerilerini buradan yönetin. <b>“Diğer”</b> seçeneği her zaman otomatik eklenir
            (manuel giriş için). Ayar yoksa sabit varsayılanlar geçerlidir — raporlar ve mevcut kayıtlar etkilenmez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sistem} onChange={e => setSistem(e.target.value as "UNIVERSITE" | "LISE")}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-[13px] font-semibold">
            <option value="UNIVERSITE">Üniversite Gençlik</option>
            <option value="LISE">Lise Gençlik</option>
          </select>
          <Button loading={saving} onClick={kaydet}>Kaydet</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary text-sm py-8 text-center">Yükleniyor…</p>
      ) : (
        <div className="space-y-3">
          {data?.kategoriler.map(k => {
            const e = edits[k.kodu];
            if (!e) return null;
            return (
              <div key={k.kodu} className="rounded-xl border border-border bg-card overflow-hidden"
                style={{ opacity: e.aktif ? 1 : 0.6 }}>
                <div className="px-4 py-2.5 border-b border-border flex items-center gap-3"
                  style={{ background: "var(--bg-hover)" }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: k.renk }} />
                  <span className="font-bold text-heading flex-1">{e.ad || k.varsayilanAd}</span>
                  <span className="flex items-center gap-2 text-[12px] text-muted">
                    {e.aktif ? "Aktif" : "Pasif"}
                    <Toggle on={e.aktif} onChange={() => setKat(k.kodu, { aktif: !e.aktif })} />
                  </span>
                </div>
                <div className="p-4 grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
                    Görünen ad (boş = varsayılan: {k.varsayilanAd})
                    <input type="text" value={e.ad} maxLength={80} placeholder={k.varsayilanAd}
                      onChange={ev => setKat(k.kodu, { ad: ev.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
                  </label>
                  <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-muted">
                    Faaliyet türleri (her satır bir tür)
                    <textarea value={e.turlerText} rows={5}
                      onChange={ev => setKat(k.kodu, { turlerText: ev.target.value })}
                      className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px] font-normal resize-y"
                      placeholder={"İlim Dersi\nSohbet\n…"} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OzelTipOpt { kod: string; ad: string; secenekli?: boolean }
interface KatOpt { kodu: string; ad: string }
type OzelRow = { kod?: string; ad: string; tip: string; kategoriKodu: string; zorunlu: boolean; secenekler: string; aktif: boolean };

function OzelAlanTab() {
  const { toast } = useToast();
  const [sistem, setSistem] = useState<"UNIVERSITE" | "LISE">("UNIVERSITE");
  const [tipOpsiyon, setTipOpsiyon] = useState<OzelTipOpt[]>([]);
  const [kategoriOpsiyon, setKategoriOpsiyon] = useState<KatOpt[]>([]);
  const [rows, setRows] = useState<OzelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/faaliyet-yapilandirma/ozel-alan?sistem=${s}`);
      if (!res.ok) throw new Error();
      const j = await res.json();
      setTipOpsiyon(j.tipOpsiyon ?? []);
      setKategoriOpsiyon(j.kategoriOpsiyon ?? []);
      setRows((j.alanlar ?? []).map((a: { kod: string; ad: string; tip: string; kategoriKodu: string; zorunlu: boolean; secenekler: string[]; aktif: boolean }) => ({
        kod: a.kod, ad: a.ad, tip: a.tip, kategoriKodu: a.kategoriKodu, zorunlu: a.zorunlu,
        secenekler: (a.secenekler ?? []).join(", "), aktif: a.aktif,
      })));
    } catch {
      toast({ type: "error", title: "Özel alanlar yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => { load(sistem); }, [sistem, load]);

  const setRow = (i: number, patch: Partial<OzelRow>) => setRows(p => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows(p => [...p, { ad: "", tip: "METIN", kategoriKodu: "", zorunlu: false, secenekler: "", aktif: true }]);
  const delRow = (i: number) => setRows(p => p.filter((_, idx) => idx !== i));

  const kaydet = async () => {
    if (rows.some(r => !r.ad.trim())) { toast({ type: "warning", title: "Her alanın bir adı olmalı" }); return; }
    setSaving(true);
    try {
      const alanlar = rows.map((r, i) => ({
        kod: r.kod, ad: r.ad.trim(), tip: r.tip, kategoriKodu: r.kategoriKodu, zorunlu: r.zorunlu, sira: i,
        secenekler: r.tip === "TEK_SECIM" ? r.secenekler.split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [],
        aktif: r.aktif,
      }));
      const res = await fetch("/api/admin/faaliyet-yapilandirma/ozel-alan", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sistem, alanlar }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Kaydedilemedi."); }
      toast({ type: "success", title: "Özel alanlar kaydedildi" });
      load(sistem);
    } catch (e) {
      toast({ type: "error", title: "Hata", message: e instanceof Error ? e.message : "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-heading">Özel Alanlar</h2>
          <p className="text-[12.5px] text-secondary mt-0.5 max-w-2xl leading-relaxed">
            Gençlik faaliyet formuna <b>kategoriye bağlı</b> ek alanlar ekleyin (ör. Kafile → Gidilen Şehir, Araç Türü).
            Kategori seçilirse alan yalnız o kategoride çıkar; <b>Tüm kategoriler</b> dersen her zaman görünür.
            Mevcut kayıtlar ve raporlar etkilenmez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sistem} onChange={e => setSistem(e.target.value as "UNIVERSITE" | "LISE")}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-[13px] font-semibold">
            <option value="UNIVERSITE">Üniversite Gençlik</option>
            <option value="LISE">Lise Gençlik</option>
          </select>
          <Button loading={saving} onClick={kaydet}>Kaydet</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-secondary text-sm py-8 text-center">Yükleniyor…</p>
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <p className="text-secondary text-sm py-6 text-center rounded-xl border border-dashed border-border">
              Henüz özel alan yok. “Alan ekle” ile başlayın.
            </p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2" style={{ opacity: r.aktif ? 1 : 0.6 }}>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 150px 170px" }}>
                <input type="text" value={r.ad} placeholder="Alan adı (ör. Gidilen Şehir)" maxLength={80}
                  onChange={e => setRow(i, { ad: e.target.value })}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
                <select value={r.tip} onChange={e => setRow(i, { tip: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border border-border bg-card text-[13px]">
                  {tipOpsiyon.map(t => <option key={t.kod} value={t.kod}>{t.ad}</option>)}
                </select>
                <select value={r.kategoriKodu} onChange={e => setRow(i, { kategoriKodu: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border border-border bg-card text-[13px]">
                  <option value="">Tüm kategoriler</option>
                  {kategoriOpsiyon.map(k => <option key={k.kodu} value={k.kodu}>{k.ad}</option>)}
                </select>
              </div>
              {r.tip === "TEK_SECIM" && (
                <input type="text" value={r.secenekler} placeholder="Seçenekler (virgülle): Otobüs, Minibüs, Uçak"
                  onChange={e => setRow(i, { secenekler: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-[13px]" />
              )}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-[12px] text-muted">Zorunlu <Toggle on={r.zorunlu} onChange={() => setRow(i, { zorunlu: !r.zorunlu })} /></span>
                <span className="flex items-center gap-2 text-[12px] text-muted">Aktif <Toggle on={r.aktif} onChange={() => setRow(i, { aktif: !r.aktif })} /></span>
                <button type="button" onClick={() => delRow(i)} className="ml-auto text-[12px] font-semibold text-red-500">Sil</button>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addRow}>+ Alan ekle</Button>
        </div>
      )}
    </div>
  );
}

export function FaaliyetYapilandirmaClient() {
  const [tab, setTab] = useState<Tab>("donem");

  const tabBtn = (key: Tab, label: string) => {
    const on = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        className="px-4 py-2 rounded-lg text-[13.5px] font-semibold transition"
        style={on
          ? { background: "var(--accent-solid)", color: "#fff" }
          : { color: "var(--text-muted)" }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-active)", color: "var(--accent)" }}>
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-[19px] font-bold text-heading leading-tight">Faaliyet Yapılandırma Merkezi</h1>
          <p className="text-[12.5px] text-muted">Dönem ve alan kontrolleri — koddan bağımsız yönetim</p>
        </div>
      </div>

      <div className="flex gap-2 my-4 p-1 rounded-xl w-fit" style={{ background: "var(--bg-hover)" }}>
        {tabBtn("donem", "Yıl & Dönem")}
        {tabBtn("alan", "Alan Yönetimi")}
        {tabBtn("kategori", "Kategori & Tür")}
        {tabBtn("ozel", "Özel Alanlar")}
      </div>

      {tab === "donem" ? <DonemTab /> : tab === "alan" ? <AlanTab /> : tab === "kategori" ? <KategoriTurTab /> : <OzelAlanTab />}
    </div>
  );
}
