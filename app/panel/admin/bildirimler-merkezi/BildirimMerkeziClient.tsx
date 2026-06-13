"use client";

/**
 * 🔔 Bildirim Merkezi — yönetici tarafı.
 * Yeni bildirim oluşturma (hedef kitle + kanal seçimi) ve gönderilenlerin
 * alıcı bazında görülme takibi. API: /api/bildirimler (+ /{id}/takip).
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Mail } from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { SkeletonText } from "@/components/ui/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

type Tip = "DUYURU" | "BILGILENDIRME" | "DOSYA" | "FORM";

interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tip: Tip;
  link: string | null;
  kanalEposta: boolean;
  epostaGonderilen: number;
  createdByName: string;
  createdAt: string;
  aliciSayisi: number;
  gorulenSayisi: number;
}

interface TakipAlim {
  id: string;
  aliciAd: string;
  aliciTip: "Görevli" | "Gönüllü";
  goruldu: boolean;
  gorulmeTarihi: string | null;
}

interface TakipData {
  baslik: string;
  mesaj: string;
  tip: Tip;
  kanalEposta: boolean;
  epostaGonderilen: number;
  createdAt: string;
  createdByName: string;
  alimlar: TakipAlim[];
}

const TIPLER: { key: Tip; label: string; tone: "success" | "info" | "warning" | "brand" }[] = [
  { key: "DUYURU",        label: "Duyuru",          tone: "success" },
  { key: "BILGILENDIRME", label: "Bilgilendirme",   tone: "info" },
  { key: "DOSYA",         label: "Dosya Paylaşımı", tone: "warning" },
  { key: "FORM",          label: "Yeni Form",       tone: "brand" },
];

const tipInfo = (t: Tip) => TIPLER.find(x => x.key === t) ?? TIPLER[0];

const BOS_FORM = {
  baslik: "",
  mesaj: "",
  tip: "DUYURU" as Tip,
  link: "",
  hedefBolge: false,
  hedefIl: false,
  hedefGonullu: false,
  sistemEgitim: true,
  sistemUniversite: true,
  sistemLise: true,
  kanalEposta: false,
};

/** Seçilebilir onay kutusu çipi — hedef kitle / kanal seçimleri */
function CheckChip({
  label, checked, onChange, disabled = false, note,
}: {
  label: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <label
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-semibold transition ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"}`}
      style={checked
        ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
        : { borderColor: "var(--border)", color: "var(--text-muted)" }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        className="accent-[var(--accent-solid)]"
      />
      {label}
      {note && <span className="text-[11px] font-normal">({note})</span>}
    </label>
  );
}

const TAKIP_COLUMNS: DataTableColumn<TakipAlim>[] = [
  {
    key: "aliciAd", header: "Alıcı", mobile: true,
    render: a => <span className="text-sm font-semibold text-heading">{a.aliciAd}</span>,
  },
  {
    key: "aliciTip", header: "Tip", mobile: true,
    render: a => <Badge tone={a.aliciTip === "Görevli" ? "info" : "brand"}>{a.aliciTip}</Badge>,
  },
  {
    key: "goruldu", header: "Görüldü", mobile: true,
    sortValue: a => (a.goruldu ? 1 : 0),
    render: a => a.goruldu
      ? <Badge tone="success">✓ Görüldü</Badge>
      : <Badge tone="neutral">✗ Görülmedi</Badge>,
  },
  {
    key: "gorulmeTarihi", header: "Görülme Tarihi", mobile: true,
    sortValue: a => (a.gorulmeTarihi ? new Date(a.gorulmeTarihi).getTime() : 0),
    render: a => (
      <span className="text-xs text-muted">
        {a.gorulmeTarihi ? new Date(a.gorulmeTarihi).toLocaleString("tr-TR") : "—"}
      </span>
    ),
  },
];

function BildirimlerTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(BOS_FORM);
  const [sending, setSending] = useState(false);
  const [secili, setSecili] = useState<Bildirim | null>(null);

  function set<K extends keyof typeof BOS_FORM>(key: K, value: (typeof BOS_FORM)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── Gönderilen bildirimler ──
  const { data: bildirimler = [], isLoading } = useQuery({
    queryKey: ["bildirimler"],
    queryFn: async (): Promise<Bildirim[]> => {
      const res = await fetch("/api/bildirimler");
      if (!res.ok) throw new Error("Bildirimler yüklenemedi.");
      return res.json();
    },
  });

  // ── Seçili bildirimin alıcı takibi ──
  const { data: takip, isLoading: takipLoading } = useQuery({
    queryKey: ["bildirim-takip", secili?.id],
    queryFn: async (): Promise<TakipData> => {
      const res = await fetch(`/api/bildirimler/${secili!.id}/takip`);
      if (!res.ok) throw new Error("Takip bilgisi yüklenemedi.");
      return res.json();
    },
    enabled: !!secili,
  });

  async function handleGonder() {
    if (!form.baslik.trim() || !form.mesaj.trim()) {
      toast({ type: "error", title: "Eksik bilgi", message: "Başlık ve mesaj alanları zorunludur." });
      return;
    }
    if (!form.hedefBolge && !form.hedefIl && !form.hedefGonullu) {
      toast({ type: "error", title: "Hedef kitle seçin", message: "En az bir hedef kitle işaretlemelisiniz." });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/bildirimler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baslik: form.baslik.trim(),
          mesaj: form.mesaj.trim(),
          tip: form.tip,
          link: form.link.trim() || undefined,
          hedefBolge: form.hedefBolge,
          hedefIl: form.hedefIl,
          hedefGonullu: form.hedefGonullu,
          sistemEgitim: form.sistemEgitim,
          sistemUniversite: form.sistemUniversite,
          sistemLise: form.sistemLise,
          kanalEposta: form.kanalEposta,
        }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ type: "error", title: "Gönderilemedi", message: d?.error });
        return;
      }
      toast({
        type: "success",
        title: "Bildirim gönderildi",
        message: `${d?.aliciSayisi ?? 0} alıcıya gönderildi${form.kanalEposta ? ` (${d?.epostaGonderilen ?? 0} e-posta)` : ""}`,
      });
      setForm(BOS_FORM);
      queryClient.invalidateQueries({ queryKey: ["bildirimler"] });
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Yeni Bildirim ── */}
      <section className="sv-section">
        <div className="sv-section-header">
          <h2>Yeni Bildirim</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
            <Input
              label="Başlık"
              required
              value={form.baslik}
              onChange={e => set("baslik", e.target.value)}
              maxLength={200}
              placeholder="Bildirim başlığı"
            />
            <Select label="Tip" value={form.tip} onChange={e => set("tip", e.target.value as Tip)}>
              {TIPLER.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </div>

          <Textarea
            label="Mesaj"
            required
            rows={4}
            maxLength={5000}
            value={form.mesaj}
            onChange={e => set("mesaj", e.target.value)}
            placeholder="Bildirim metni..."
          />

          <Input
            label="Link"
            value={form.link}
            onChange={e => set("link", e.target.value)}
            maxLength={500}
            placeholder="/panel/formlarim/..."
            hint="Opsiyonel — bildirime tıklanınca yönlendirilecek adres"
          />

          {/* Hedef kitle */}
          <fieldset>
            <legend className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-2">
              Hedef Kitle
            </legend>
            <div className="flex flex-wrap gap-2">
              <CheckChip label="Bölge Sorumluları" checked={form.hedefBolge} onChange={v => set("hedefBolge", v)} />
              <CheckChip label="İl Sorumluları" checked={form.hedefIl} onChange={v => set("hedefIl", v)} />
              <CheckChip label="Gönüllüler" checked={form.hedefGonullu} onChange={v => set("hedefGonullu", v)} />
            </div>
            {(form.hedefBolge || form.hedefIl) && (
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[12px] font-semibold text-muted">Sistem:</span>
                <CheckChip label="Eğitim" checked={form.sistemEgitim} onChange={v => set("sistemEgitim", v)} />
                <CheckChip label="Üniversite" checked={form.sistemUniversite} onChange={v => set("sistemUniversite", v)} />
                <CheckChip label="Lise" checked={form.sistemLise} onChange={v => set("sistemLise", v)} />
              </div>
            )}
          </fieldset>

          {/* Kanallar */}
          <fieldset>
            <legend className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-2">
              Kanallar
            </legend>
            <div className="flex flex-wrap gap-2">
              <CheckChip label="Sistem Bildirimi" checked disabled />
              <CheckChip label="E-Posta" checked={form.kanalEposta} onChange={v => set("kanalEposta", v)} />
              <CheckChip label="SMS" checked={false} disabled note="sağlayıcı bağlı değil" />
              <CheckChip label="WhatsApp" checked={false} disabled note="sağlayıcı bağlı değil" />
            </div>
          </fieldset>

          <div className="flex justify-end pt-1">
            <Button onClick={handleGonder} loading={sending}>
              <Send size={15} />
              Gönder
            </Button>
          </div>
        </div>
      </section>

      {/* ── Gönderilenler ── */}
      <section className="sv-section">
        <div className="sv-section-header">
          <h2>Gönderilenler</h2>
          <span className="text-[12px] font-semibold text-muted">{bildirimler.length} bildirim</span>
        </div>

        {isLoading ? (
          <div className="p-5"><SkeletonText lines={4} /></div>
        ) : bildirimler.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13.5px] text-muted">Henüz bildirim gönderilmedi.</p>
        ) : (
          <div className="divide-y divide-border">
            {bildirimler.map(b => {
              const oran = b.aliciSayisi > 0 ? Math.round((b.gorulenSayisi / b.aliciSayisi) * 100) : 0;
              return (
                <button
                  key={b.id}
                  onClick={() => setSecili(b)}
                  className="w-full text-left px-5 py-4 transition hover:bg-[var(--bg-hover)]"
                  aria-label={`${b.baslik} — bildirim takibini aç`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-heading">{b.baslik}</span>
                    <Badge tone={tipInfo(b.tip).tone}>{tipInfo(b.tip).label}</Badge>
                    {b.kanalEposta && (
                      <Badge tone="neutral"><Mail size={11} /> {b.epostaGonderilen}</Badge>
                    )}
                    <span className="ml-auto text-[12px] text-muted">
                      {new Date(b.createdAt).toLocaleDateString("tr-TR")} · {b.createdByName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className="h-1.5 rounded-full overflow-hidden flex-1 max-w-[220px]"
                      style={{ background: "var(--bg-hover)" }}
                      role="progressbar"
                      aria-valuenow={oran}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="h-full rounded-full" style={{ width: `${oran}%`, background: "var(--accent-solid)" }} />
                    </div>
                    <span className="text-[12px] font-semibold text-secondary">
                      {b.gorulenSayisi}/{b.aliciSayisi} görüldü (%{oran})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Bildirim Takibi modalı ── */}
      <Modal
        open={!!secili}
        onClose={() => setSecili(null)}
        title="📬 Bildirim Takibi"
        maxWidth={640}
      >
        {takipLoading || !takip ? (
          <SkeletonText lines={5} />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={tipInfo(takip.tip).tone}>{tipInfo(takip.tip).label}</Badge>
              {takip.kanalEposta && (
                <Badge tone="neutral"><Mail size={11} /> {takip.epostaGonderilen} e-posta</Badge>
              )}
              <span className="ml-auto text-[12px] text-muted">
                {new Date(takip.createdAt).toLocaleString("tr-TR")} · {takip.createdByName}
              </span>
            </div>
            <div>
              <p className="text-[14.5px] font-bold text-heading">{takip.baslik}</p>
              <p className="text-[13px] text-secondary mt-1 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                {takip.mesaj}
              </p>
            </div>
            <DataTable
              id="bildirim-takip"
              data={takip.alimlar}
              columns={TAKIP_COLUMNS}
              rowKey={a => a.id}
              pageSize={10}
              searchText={a => `${a.aliciAd} ${a.aliciTip}`}
              searchPlaceholder="Alıcı ara..."
              emptyText="Alıcı bulunamadı."
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   DUYURU PANOSU sekmesi (CRUD)
══════════════════════════════════════ */
interface Duyuru {
  id: string;
  metin: string;
  link: string | null;
  baslangic: string;
  bitis: string;
  aktif: boolean;
  createdByName: string;
  createdAt: string;
}

const BOS_DUYURU = { metin: "", link: "", baslangic: "", bitis: "", aktif: true };

/** ISO → datetime-local input değeri (yerel saat) */
function toLocalInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function duyuruDurum(d: Duyuru): { label: string; tone: "success" | "neutral" | "warning" | "info" } {
  if (!d.aktif) return { label: "Pasif", tone: "neutral" };
  const now = Date.now();
  if (new Date(d.bitis).getTime() < now) return { label: "Süresi Doldu", tone: "warning" };
  if (new Date(d.baslangic).getTime() > now) return { label: "Beklemede", tone: "info" };
  return { label: "Aktif", tone: "success" };
}

/** Aktif/Pasif/Süresi-dolan arşiv filtresi — Duyuru ve Pop-up listelerinde ortak */
const DURUM_FILTRE_OPTS: { key: string; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "Aktif", label: "Aktif" },
  { key: "Beklemede", label: "Beklemede" },
  { key: "Süresi Doldu", label: "Süresi Doldu" },
  { key: "Pasif", label: "Pasif" },
];

function DurumFiltreChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DURUM_FILTRE_OPTS.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className="px-2.5 py-1 rounded-lg text-[12px] font-bold border transition"
          style={value === o.key
            ? { background: "var(--accent-solid)", color: "#fff", borderColor: "var(--accent-solid)" }
            : { color: "var(--text-muted)", borderColor: "var(--border)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DuyuruTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [durumFiltre, setDurumFiltre] = useState("all");
  const [form, setForm] = useState(BOS_DUYURU);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof BOS_DUYURU>(key: K, value: (typeof BOS_DUYURU)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  function reset() { setForm(BOS_DUYURU); setEditId(null); }

  const { data: duyurular = [], isLoading } = useQuery({
    queryKey: ["duyurular"],
    queryFn: async (): Promise<Duyuru[]> => {
      const res = await fetch("/api/duyurular");
      if (!res.ok) throw new Error("Duyurular yüklenemedi.");
      return res.json();
    },
  });
  const gosterilenDuyurular = duyurular.filter(d => durumFiltre === "all" || duyuruDurum(d).label === durumFiltre);

  function duzenle(d: Duyuru) {
    setEditId(d.id);
    setForm({ metin: d.metin, link: d.link ?? "", baslangic: toLocalInput(d.baslangic), bitis: toLocalInput(d.bitis), aktif: d.aktif });
  }

  async function kaydet() {
    if (!form.metin.trim()) { toast({ type: "error", title: "Eksik bilgi", message: "Duyuru metni zorunludur." }); return; }
    if (!form.baslangic || !form.bitis) { toast({ type: "error", title: "Eksik bilgi", message: "Başlangıç ve bitiş tarihi zorunludur." }); return; }
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/duyurular/${editId}` : "/api/duyurular", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metin: form.metin.trim(), link: form.link.trim() || null, baslangic: form.baslangic, bitis: form.bitis, aktif: form.aktif }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) { toast({ type: "error", title: "Kaydedilemedi", message: d?.error }); return; }
      toast({ type: "success", title: editId ? "Duyuru güncellendi" : "Duyuru oluşturuldu" });
      reset();
      queryClient.invalidateQueries({ queryKey: ["duyurular"] });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); }
    finally { setSaving(false); }
  }

  async function aktiflikDegistir(d: Duyuru) {
    await fetch(`/api/duyurular/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktif: !d.aktif }) });
    queryClient.invalidateQueries({ queryKey: ["duyurular"] });
  }

  async function sil(d: Duyuru) {
    if (!confirm("Bu duyuru silinsin mi?")) return;
    await fetch(`/api/duyurular/${d.id}`, { method: "DELETE" });
    if (editId === d.id) reset();
    queryClient.invalidateQueries({ queryKey: ["duyurular"] });
  }

  return (
    <div className="space-y-5">
      <section className="sv-section">
        <div className="sv-section-header"><h2>{editId ? "Duyuru Düzenle" : "Yeni Duyuru"}</h2></div>
        <div className="p-5 space-y-4">
          <Textarea
            label="Duyuru Metni" required rows={2} maxLength={5000}
            value={form.metin} onChange={e => set("metin", e.target.value)}
            placeholder="Örn. Yaz Kursları veri giriş dönemi başlamıştır. Son tarih: 30 Temmuz."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Başlangıç" required type="datetime-local" value={form.baslangic} onChange={e => set("baslangic", e.target.value)} />
            <Input label="Bitiş" required type="datetime-local" value={form.bitis} onChange={e => set("bitis", e.target.value)} />
            <Input label="Link" value={form.link} onChange={e => set("link", e.target.value)} maxLength={500} placeholder="/panel/..." hint="Opsiyonel — tıklanınca gidilecek sayfa" />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CheckChip label="Aktif" checked={form.aktif} onChange={v => set("aktif", v)} />
            <div className="flex gap-2">
              {editId && <Button variant="ghost" onClick={reset}>İptal</Button>}
              <Button onClick={kaydet} loading={saving}>{editId ? "Güncelle" : "Oluştur"}</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="sv-section">
        <div className="sv-section-header flex-wrap gap-2">
          <h2>Duyurular</h2>
          <DurumFiltreChips value={durumFiltre} onChange={setDurumFiltre} />
        </div>
        {isLoading ? (
          <div className="p-5"><SkeletonText lines={3} /></div>
        ) : gosterilenDuyurular.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13.5px] text-muted">
            {durumFiltre === "all" ? "Henüz duyuru oluşturulmadı." : "Bu filtreyle duyuru yok."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {gosterilenDuyurular.map(d => {
              const durum = duyuruDurum(d);
              return (
                <div key={d.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={durum.tone}>{durum.label}</Badge>
                    <span className="text-[14px] font-semibold text-heading">{d.metin}</span>
                    <span className="ml-auto text-[12px] text-muted">
                      {new Date(d.baslangic).toLocaleDateString("tr-TR")} – {new Date(d.bitis).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => duzenle(d)}>Düzenle</Button>
                    <Button size="sm" variant="ghost" onClick={() => aktiflikDegistir(d)}>{d.aktif ? "Pasife Al" : "Aktifleştir"}</Button>
                    <Button size="sm" variant="danger" onClick={() => sil(d)}>Sil</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   POP-UP YÖNETİMİ sekmesi (CRUD + görsel)
══════════════════════════════════════ */
const GOSTERIM_OPTS: { key: string; label: string }[] = [
  { key: "HER_GIRIS", label: "Her girişte göster" },
  { key: "TEK_SEFER", label: "Sadece 1 kez göster" },
  { key: "SUREKLI", label: "Sürekli göster" },
  { key: "TARIH_ARALIGI", label: "Tarih aralığında göster" },
];
const gosterimLabel = (k: string) => GOSTERIM_OPTS.find(o => o.key === k)?.label ?? k;

interface Popup {
  id: string;
  baslik: string;
  aciklama: string;
  gorselUrl: string | null;
  link: string | null;
  gosterim: string;
  baslangic: string;
  bitis: string;
  aktif: boolean;
  gorulenSayisi: number;
  createdByName: string;
  createdAt: string;
}

const BOS_POPUP = { baslik: "", aciklama: "", link: "", gosterim: "HER_GIRIS", baslangic: "", bitis: "", aktif: true };

function popupDurum(p: Popup): { label: string; tone: "success" | "neutral" | "warning" | "info" } {
  if (!p.aktif) return { label: "Pasif", tone: "neutral" };
  const now = Date.now();
  if (new Date(p.bitis).getTime() < now) return { label: "Süresi Doldu", tone: "warning" };
  if (new Date(p.baslangic).getTime() > now) return { label: "Beklemede", tone: "info" };
  return { label: "Aktif", tone: "success" };
}

function PopupTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [durumFiltre, setDurumFiltre] = useState("all");
  const [form, setForm] = useState(BOS_POPUP);
  const [editId, setEditId] = useState<string | null>(null);
  const [gorselFile, setGorselFile] = useState<File | null>(null);
  const [gorselSil, setGorselSil] = useState(false);
  const [mevcutGorsel, setMevcutGorsel] = useState<string | null>(null);
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof BOS_POPUP>(key: K, value: (typeof BOS_POPUP)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  function reset() {
    setForm(BOS_POPUP); setEditId(null); setGorselFile(null); setGorselSil(false); setMevcutGorsel(null); setOnizleme(null);
  }

  // Dosya seçilince önizlemeyi FileReader ile (data URL) kur
  function gorselSec(f: File | null) {
    setGorselFile(f);
    setGorselSil(false);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setOnizleme(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setOnizleme(mevcutGorsel);
    }
  }
  function gorseliKaldir() {
    setGorselFile(null); setGorselSil(true); setOnizleme(null);
  }

  const { data: popuplar = [], isLoading } = useQuery({
    queryKey: ["popuplar"],
    queryFn: async (): Promise<Popup[]> => {
      const res = await fetch("/api/popuplar");
      if (!res.ok) throw new Error("Pop-up'lar yüklenemedi.");
      return res.json();
    },
  });
  const gosterilenPopuplar = popuplar.filter(p => durumFiltre === "all" || popupDurum(p).label === durumFiltre);

  function duzenle(p: Popup) {
    setEditId(p.id);
    setForm({ baslik: p.baslik, aciklama: p.aciklama, link: p.link ?? "", gosterim: p.gosterim, baslangic: toLocalInput(p.baslangic), bitis: toLocalInput(p.bitis), aktif: p.aktif });
    setMevcutGorsel(p.gorselUrl); setGorselFile(null); setGorselSil(false); setOnizleme(p.gorselUrl);
  }

  async function kaydet() {
    if (!form.baslik.trim() || !form.aciklama.trim()) { toast({ type: "error", title: "Eksik bilgi", message: "Başlık ve açıklama zorunludur." }); return; }
    if (!form.baslangic || !form.bitis) { toast({ type: "error", title: "Eksik bilgi", message: "Başlangıç ve bitiş tarihi zorunludur." }); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("baslik", form.baslik.trim());
      fd.set("aciklama", form.aciklama.trim());
      fd.set("link", form.link.trim());
      fd.set("gosterim", form.gosterim);
      fd.set("baslangic", form.baslangic);
      fd.set("bitis", form.bitis);
      fd.set("aktif", form.aktif ? "1" : "0");
      if (gorselFile) fd.set("gorsel", gorselFile);
      if (editId && gorselSil) fd.set("gorselSil", "1");
      const res = await fetch(editId ? `/api/popuplar/${editId}` : "/api/popuplar", { method: editId ? "PATCH" : "POST", body: fd });
      const d = await res.json().catch(() => null);
      if (!res.ok) { toast({ type: "error", title: "Kaydedilemedi", message: d?.error }); return; }
      toast({ type: "success", title: editId ? "Pop-up güncellendi" : "Pop-up oluşturuldu" });
      reset();
      queryClient.invalidateQueries({ queryKey: ["popuplar"] });
    } catch { toast({ type: "error", title: "Bağlantı hatası" }); }
    finally { setSaving(false); }
  }

  async function aktiflikDegistir(p: Popup) {
    await fetch(`/api/popuplar/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aktif: !p.aktif }) });
    queryClient.invalidateQueries({ queryKey: ["popuplar"] });
  }
  async function sil(p: Popup) {
    if (!confirm("Bu pop-up silinsin mi?")) return;
    await fetch(`/api/popuplar/${p.id}`, { method: "DELETE" });
    if (editId === p.id) reset();
    queryClient.invalidateQueries({ queryKey: ["popuplar"] });
  }

  return (
    <div className="space-y-5">
      <section className="sv-section">
        <div className="sv-section-header"><h2>{editId ? "Pop-up Düzenle" : "Yeni Pop-up"}</h2></div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
            <Input label="Başlık" required value={form.baslik} onChange={e => set("baslik", e.target.value)} maxLength={200} placeholder="Pop-up başlığı" />
            <Select label="Gösterim" value={form.gosterim} onChange={e => set("gosterim", e.target.value)}>
              {GOSTERIM_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </Select>
          </div>
          <Textarea label="Açıklama" required rows={3} maxLength={5000} value={form.aciklama} onChange={e => set("aciklama", e.target.value)} placeholder="Pop-up metni..." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Başlangıç" required type="datetime-local" value={form.baslangic} onChange={e => set("baslangic", e.target.value)} />
            <Input label="Bitiş" required type="datetime-local" value={form.bitis} onChange={e => set("bitis", e.target.value)} />
            <Input label="Yönlendirme Linki" value={form.link} onChange={e => set("link", e.target.value)} maxLength={500} placeholder="/panel/..." hint="'Detay Gör' bu adrese gider" />
          </div>

          {/* Görsel */}
          <div>
            <span className="block text-[12px] font-bold uppercase tracking-wider text-muted mb-1.5">Görsel (opsiyonel)</span>
            <div className="flex items-center gap-4 flex-wrap">
              {onizleme && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={onizleme} alt="" className="h-20 w-32 object-cover rounded-lg border" style={{ borderColor: "var(--border)" }} />
              )}
              <input
                type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={e => gorselSec(e.target.files?.[0] ?? null)}
                className="text-[13px]"
              />
              {onizleme && (
                <Button size="sm" variant="ghost" onClick={gorseliKaldir}>Görseli Kaldır</Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CheckChip label="Aktif" checked={form.aktif} onChange={v => set("aktif", v)} />
            <div className="flex gap-2">
              {editId && <Button variant="ghost" onClick={reset}>İptal</Button>}
              <Button onClick={kaydet} loading={saving}>{editId ? "Güncelle" : "Oluştur"}</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="sv-section">
        <div className="sv-section-header flex-wrap gap-2">
          <h2>{"Pop-up'lar"}</h2>
          <DurumFiltreChips value={durumFiltre} onChange={setDurumFiltre} />
        </div>
        {isLoading ? (
          <div className="p-5"><SkeletonText lines={3} /></div>
        ) : gosterilenPopuplar.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13.5px] text-muted">
            {durumFiltre === "all" ? "Henüz pop-up oluşturulmadı." : "Bu filtreyle pop-up yok."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {gosterilenPopuplar.map(p => {
              const durum = popupDurum(p);
              return (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={durum.tone}>{durum.label}</Badge>
                    <span className="text-[14px] font-bold text-heading">{p.baslik}</span>
                    <Badge tone="neutral">{gosterimLabel(p.gosterim)}</Badge>
                    {p.gosterim === "TEK_SEFER" && <span className="text-[12px] text-muted">{p.gorulenSayisi} kez görüldü</span>}
                    <span className="ml-auto text-[12px] text-muted">
                      {new Date(p.baslangic).toLocaleDateString("tr-TR")} – {new Date(p.bitis).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => duzenle(p)}>Düzenle</Button>
                    <Button size="sm" variant="ghost" onClick={() => aktiflikDegistir(p)}>{p.aktif ? "Pasife Al" : "Aktifleştir"}</Button>
                    <Button size="sm" variant="danger" onClick={() => sil(p)}>Sil</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   BİLDİRİM MERKEZİ — sekmeli kabuk
   (Bildirimler · Pop-Up Yönetimi · Duyuru Panosu)
══════════════════════════════════════ */
type TabKey = "bildirimler" | "popup" | "duyuru";
const TABS: { key: TabKey; label: string }[] = [
  { key: "bildirimler", label: "Bildirimler" },
  { key: "popup",       label: "Pop-Up Yönetimi" },
  { key: "duyuru",      label: "Duyuru Panosu" },
];

export function BildirimMerkeziClient() {
  const [tab, setTab] = useState<TabKey>("bildirimler");

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header">
        <h1>Bildirim Merkezi</h1>
        <p>Bildirim, pop-up ve duyuru panosu yönetimi</p>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ background: "var(--bg-th)", borderColor: "var(--border)" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={tab === t.key
              ? { background: "var(--accent-solid)", color: "#fff" }
              : { color: "var(--text-muted)" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sekme içeriği */}
      {tab === "bildirimler" && <BildirimlerTab />}
      {tab === "popup" && <PopupTab />}
      {tab === "duyuru" && <DuyuruTab />}
    </div>
  );
}
