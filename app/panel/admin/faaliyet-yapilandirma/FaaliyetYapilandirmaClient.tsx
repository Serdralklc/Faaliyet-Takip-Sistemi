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

type Tab = "donem" | "alan";

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

function AlanTab() {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
      <h2 className="text-[15px] font-bold text-heading">Alan Yönetimi</h2>
      <p className="text-[13px] text-secondary mt-2 max-w-xl mx-auto leading-relaxed">
        Hangi alanların görünür / zorunlu / aktif olacağı buradan yönetilecek. Bu sekme,
        il giriş formlarına güvenli biçimde bağlanmak üzere bir sonraki adımda (Faz 1b) açılacaktır.
      </p>
      <span className="inline-block mt-3 text-[12px] px-3 py-1 rounded-full"
        style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
        Hazırlanıyor
      </span>
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
      </div>

      {tab === "donem" ? <DonemTab /> : <AlanTab />}
    </div>
  );
}
