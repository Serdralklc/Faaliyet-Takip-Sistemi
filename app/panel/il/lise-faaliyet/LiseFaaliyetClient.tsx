"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, Image as ImageIcon, Paperclip } from "lucide-react";
import { LISE_KATEGORILER, KATEGORI_LABEL, KATEGORI_RENK, type LiseKategoriKey } from "@/lib/lise-faaliyet";

interface Faaliyet {
  id: string; ilId: string; tarih: string; yil: number; donem: string;
  kategori: LiseKategoriKey; faaliyetAdi: string; aciklama: string | null; yer: string | null;
  katilimci: number; ilkKezKatilan: number; yeniIntisap: number;
  fotoKey: string | null; dosyaKey: string | null; dosyaAd: string | null;
  createdByName: string;
}

const THIS_YEAR = new Date().getFullYear();
// Lise Gençlik yalnızca 1. ve 2. dönemden oluşur (yaz dönemi yok)
const DONEMLER: { value: string; label: string }[] = [
  { value: "DONEM_1", label: "1. Dönem" },
  { value: "DONEM_2", label: "2. Dönem" },
];

function bugunStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const trTarih = (iso: string) => new Date(iso).toLocaleDateString("tr-TR");

type FormState = {
  tarih: string; donem: string; kategori: LiseKategoriKey; adSecim: string; manuelAd: string;
  aciklama: string; yer: string; katilimci: string; ilkKezKatilan: string; yeniIntisap: string;
  fotoFile: File | null; dosyaFile: File | null; fotoSil: boolean; dosyaSil: boolean;
};

const bosForm = (donem = "DONEM_1"): FormState => ({
  tarih: bugunStr(), donem, kategori: "ILIM_SOHBET", adSecim: LISE_KATEGORILER[0].adlar[0] ?? "", manuelAd: "",
  aciklama: "", yer: "", katilimci: "", ilkKezKatilan: "", yeniIntisap: "",
  fotoFile: null, dosyaFile: null, fotoSil: false, dosyaSil: false,
});

export function LiseFaaliyetClient({ ilId, ilAd, bolgeAd }: { ilId: string; ilAd: string; bolgeAd: string }) {
  const { toast } = useToast();
  const [list, setList] = useState<Faaliyet[]>([]);
  const [loading, setLoading] = useState(true);
  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState("DONEM_1");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faaliyet | null>(null);
  const [form, setForm] = useState<FormState>(bosForm());
  const [saving, setSaving] = useState(false);
  const [silId, setSilId] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/lise-faaliyetler?ilId=${ilId}&yil=${yil}&donem=${donem}`)
      .then(r => (r.ok ? r.json() : []))
      .then(d => setList(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [yil, donem]);

  const yilSecenekleri = useMemo(() => {
    const set = new Set<number>([THIS_YEAR, THIS_YEAR - 1, ...list.map(f => f.yil), yil]);
    return [...set].sort((a, b) => b - a);
  }, [list, yil]);

  /* Otomatik özet (Faz D'nin temeli) */
  const ozet = useMemo(() => {
    const perKat: Record<string, { sayi: number; katilimci: number }> = {};
    let toplamKatilimci = 0, toplamIlkKez = 0, toplamIntisap = 0;
    for (const f of list) {
      const k = perKat[f.kategori] ?? { sayi: 0, katilimci: 0 };
      k.sayi++; k.katilimci += f.katilimci;
      perKat[f.kategori] = k;
      toplamKatilimci += f.katilimci; toplamIlkKez += f.ilkKezKatilan; toplamIntisap += f.yeniIntisap;
    }
    return { perKat, toplamKatilimci, toplamIlkKez, toplamIntisap, toplam: list.length };
  }, [list]);

  const kategoriDef = LISE_KATEGORILER.find(k => k.key === form.kategori)!;
  const hasAdlar = kategoriDef.adlar.length > 0;
  const manuelGerek = !hasAdlar || form.adSecim === "Diğer";

  function openNew() { setEditing(null); setForm(bosForm(donem)); setModalOpen(true); }
  function openEdit(f: Faaliyet) {
    const def = LISE_KATEGORILER.find(k => k.key === f.kategori)!;
    const adVar = def.adlar.includes(f.faaliyetAdi);
    setEditing(f);
    setForm({
      tarih: f.tarih.slice(0, 10), donem: f.donem, kategori: f.kategori,
      adSecim: def.adlar.length === 0 ? "" : adVar ? f.faaliyetAdi : "Diğer",
      manuelAd: adVar ? "" : f.faaliyetAdi,
      aciklama: f.aciklama ?? "", yer: f.yer ?? "",
      katilimci: String(f.katilimci || ""), ilkKezKatilan: String(f.ilkKezKatilan || ""), yeniIntisap: String(f.yeniIntisap || ""),
      fotoFile: null, dosyaFile: null, fotoSil: false, dosyaSil: false,
    });
    setModalOpen(true);
  }

  function setKategori(k: LiseKategoriKey) {
    const def = LISE_KATEGORILER.find(x => x.key === k)!;
    setForm(f => ({ ...f, kategori: k, adSecim: def.adlar[0] ?? "", manuelAd: "" }));
  }

  async function submit() {
    const faaliyetAdi = (manuelGerek ? form.manuelAd : form.adSecim).trim();
    if (!faaliyetAdi) { toast({ type: "warning", title: "Faaliyet adı gerekli" }); return; }
    if (!form.tarih) { toast({ type: "warning", title: "Tarih gerekli" }); return; }

    setSaving(true);
    const fd = new FormData();
    fd.append("ilId", ilId);
    fd.append("tarih", form.tarih);
    fd.append("donem", form.donem);
    fd.append("kategori", form.kategori);
    fd.append("faaliyetAdi", faaliyetAdi);
    fd.append("aciklama", form.aciklama);
    fd.append("yer", form.yer);
    fd.append("katilimci", form.katilimci || "0");
    fd.append("ilkKezKatilan", form.ilkKezKatilan || "0");
    fd.append("yeniIntisap", form.yeniIntisap || "0");
    if (form.fotoFile) fd.append("foto", form.fotoFile);
    if (form.dosyaFile) fd.append("dosya", form.dosyaFile);
    if (form.fotoSil) fd.append("fotoSil", "1");
    if (form.dosyaSil) fd.append("dosyaSil", "1");

    const res = await fetch(editing ? `/api/lise-faaliyetler/${editing.id}` : "/api/lise-faaliyetler", {
      method: editing ? "PUT" : "POST",
      body: fd,
    });
    setSaving(false);
    if (res.ok) {
      toast({ type: "success", title: editing ? "Faaliyet güncellendi" : "Faaliyet kaydedildi" });
      setModalOpen(false);
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      toast({ type: "error", title: "Kaydedilemedi", message: e?.error ?? "Tekrar deneyin." });
    }
  }

  async function sil() {
    if (!silId) return;
    setSiliniyor(true);
    const res = await fetch(`/api/lise-faaliyetler/${silId}`, { method: "DELETE" });
    setSiliniyor(false);
    setSilId(null);
    if (res.ok) { toast({ type: "success", title: "Faaliyet silindi" }); load(); }
    else toast({ type: "error", title: "Silinemedi" });
  }

  const columns: DataTableColumn<Faaliyet>[] = [
    { key: "tarih", header: "Tarih", mobile: true, sortValue: f => f.tarih, render: f => <span className="font-semibold text-heading whitespace-nowrap">{trTarih(f.tarih)}</span> },
    {
      key: "kategori", header: "Kategori", mobile: true, sortValue: f => f.kategori,
      render: f => <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${KATEGORI_RENK[f.kategori]}1a`, color: KATEGORI_RENK[f.kategori] }}>{KATEGORI_LABEL[f.kategori]}</span>,
    },
    { key: "faaliyetAdi", header: "Faaliyet", mobile: true, render: f => <span className="font-semibold text-secondary">{f.faaliyetAdi}</span> },
    { key: "yer", header: "Yer", render: f => f.yer ? <span className="text-sm text-muted">{f.yer}</span> : <span className="text-muted">—</span> },
    { key: "katilimci", header: "Katılımcı", sortValue: f => f.katilimci, render: f => <span className="font-bold text-heading">{f.katilimci}</span> },
    { key: "ilkKezKatilan", header: "İlk Kez", sortValue: f => f.ilkKezKatilan, render: f => <span className="text-secondary">{f.ilkKezKatilan}</span> },
    { key: "yeniIntisap", header: "Yeni İntisap", sortValue: f => f.yeniIntisap, render: f => <span className="font-bold" style={{ color: "var(--accent)" }}>{f.yeniIntisap}</span> },
    {
      key: "ekler", header: "Ekler", sortable: false,
      render: f => (
        <div className="flex items-center gap-2">
          {f.fotoKey && <a href={`/api/lise-dosya/${f.id}?tip=foto`} target="_blank" rel="noreferrer" title="Foto" onClick={e => e.stopPropagation()}><ImageIcon size={15} className="text-blue-500" /></a>}
          {f.dosyaKey && <a href={`/api/lise-dosya/${f.id}?tip=dosya`} target="_blank" rel="noreferrer" title={f.dosyaAd ?? "Dosya"} onClick={e => e.stopPropagation()}><Paperclip size={15} className="text-amber-600" /></a>}
          {!f.fotoKey && !f.dosyaKey && <span className="text-muted">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="sv-page-header" style={{ marginBottom: 0 }}>
          <h1>Lise Gençlik Faaliyetleri</h1>
          <p>{ilAd} · {bolgeAd} — her faaliyeti tek tek kaydedin; raporlar otomatik oluşur</p>
        </div>
        <div className="flex items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Yıl</span>
            <select value={yil} onChange={e => setYil(Number(e.target.value))}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {yilSecenekleri.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Dönem</span>
            <select value={donem} onChange={e => setDonem(e.target.value)}
              className="rounded-xl border border-[var(--border-input)] bg-input text-heading text-[13px] px-3 py-2 focus:border-[var(--accent)] transition">
              {DONEMLER.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <Button onClick={openNew}><Plus size={16} /> Faaliyet Ekle</Button>
        </div>
      </div>

      {/* Otomatik özet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Toplam Faaliyet", val: ozet.toplam, renk: "var(--text-primary)" },
          { label: "Toplam Katılımcı", val: ozet.toplamKatilimci, renk: "#0369A1" },
          { label: "İlk Kez Katılan", val: ozet.toplamIlkKez, renk: "#B45309" },
          { label: "Yeni İntisap", val: ozet.toplamIntisap, renk: "var(--accent)" },
        ].map(s => (
          <div key={s.label} className="sv-section p-4">
            <p className="text-3xl font-black" style={{ color: s.renk }}>{s.val}</p>
            <p className="text-xs font-semibold mt-0.5 text-muted">{s.label} ({yil} / {DONEMLER.find(d => d.value === donem)?.label})</p>
          </div>
        ))}
      </div>

      {/* Kategori bazlı kırılım */}
      {ozet.toplam > 0 && (
        <div className="flex flex-wrap gap-2">
          {LISE_KATEGORILER.filter(k => ozet.perKat[k.key]?.sayi).map(k => (
            <span key={k.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: `${k.renk}14`, color: k.renk }}>
              {k.label}: <strong>{ozet.perKat[k.key].sayi}</strong> · {ozet.perKat[k.key].katilimci} katılımcı
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="sv-section p-12 text-center text-muted">Yükleniyor…</div>
      ) : (
        <DataTable
          id="lise-faaliyet"
          data={list}
          columns={columns}
          rowKey={f => f.id}
          searchText={f => `${f.faaliyetAdi} ${KATEGORI_LABEL[f.kategori]} ${f.yer ?? ""}`}
          searchPlaceholder="Faaliyet, kategori veya yer ara…"
          emptyText="Bu yıl için henüz faaliyet kaydı yok. “Faaliyet Ekle” ile başlayın."
          onRowClick={openEdit}
          rowActions={f => (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="secondary" onClick={() => openEdit(f)}><Pencil size={13} /></Button>
              <Button size="sm" variant="danger" onClick={() => setSilId(f.id)}><Trash2 size={13} /></Button>
            </div>
          )}
        />
      )}

      {/* Ekle / Düzenle */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={620}
        title={editing ? "Faaliyeti Düzenle" : "Yeni Faaliyet"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>Vazgeç</Button>
            <Button onClick={submit} loading={saving}>{editing ? "Güncelle" : "Kaydet"}</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Tarih" type="date" required value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} />
            <Select label="Dönem" required value={form.donem} onChange={e => setForm(f => ({ ...f, donem: e.target.value }))}>
              {DONEMLER.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
            <Select label="Kategori" required value={form.kategori} onChange={e => setKategori(e.target.value as LiseKategoriKey)}>
              {LISE_KATEGORILER.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
            </Select>
          </div>

          {hasAdlar ? (
            <Select label="Faaliyet Adı" required value={form.adSecim} onChange={e => setForm(f => ({ ...f, adSecim: e.target.value }))}>
              {kategoriDef.adlar.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          ) : null}
          {manuelGerek && (
            <Input label={hasAdlar ? "Faaliyet Adı (Diğer)" : "Faaliyet Adı"} required placeholder="Faaliyet adını yazın"
              value={form.manuelAd} onChange={e => setForm(f => ({ ...f, manuelAd: e.target.value }))} />
          )}

          <Input label="Faaliyetin Yapıldığı Yer" placeholder="örn. Kültür Merkezi" value={form.yer} onChange={e => setForm(f => ({ ...f, yer: e.target.value }))} />
          <Textarea label="Faaliyet Açıklaması" rows={3} placeholder="Kısa açıklama (opsiyonel)" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Katılımcı Sayısı" type="number" min={0} value={form.katilimci} onChange={e => setForm(f => ({ ...f, katilimci: e.target.value }))} />
            <Input label="İlk Kez Katılan" type="number" min={0} value={form.ilkKezKatilan} onChange={e => setForm(f => ({ ...f, ilkKezKatilan: e.target.value }))} />
            <Input label="Yeni İntisap" type="number" min={0} value={form.yeniIntisap} onChange={e => setForm(f => ({ ...f, yeniIntisap: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-muted">Fotoğraf (opsiyonel)</label>
              <input type="file" accept="image/png,image/jpeg,image/webp"
                onChange={e => setForm(f => ({ ...f, fotoFile: e.target.files?.[0] ?? null, fotoSil: false }))}
                className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--bg-active)] file:text-[var(--accent)]" />
              {editing?.fotoKey && !form.fotoFile && !form.fotoSil && (
                <p className="text-[11px] mt-1 text-muted">Mevcut foto var ·
                  <button type="button" className="text-red-500 ml-1" onClick={() => setForm(f => ({ ...f, fotoSil: true }))}>kaldır</button></p>
              )}
              {form.fotoSil && <p className="text-[11px] mt-1 text-red-500">Foto kaldırılacak</p>}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-muted">Dosya Eki (opsiyonel)</label>
              <input type="file"
                onChange={e => setForm(f => ({ ...f, dosyaFile: e.target.files?.[0] ?? null, dosyaSil: false }))}
                className="block w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--bg-active)] file:text-[var(--accent)]" />
              {editing?.dosyaKey && !form.dosyaFile && !form.dosyaSil && (
                <p className="text-[11px] mt-1 text-muted truncate">Mevcut: {editing.dosyaAd} ·
                  <button type="button" className="text-red-500 ml-1" onClick={() => setForm(f => ({ ...f, dosyaSil: true }))}>kaldır</button></p>
              )}
              {form.dosyaSil && <p className="text-[11px] mt-1 text-red-500">Dosya kaldırılacak</p>}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!silId} onClose={() => setSilId(null)} onConfirm={sil}
        title="Faaliyeti sil" message="Bu faaliyet kaydı kalıcı olarak silinecek. Emin misiniz?"
        confirmLabel="Sil" danger loading={siliniyor} />
    </div>
  );
}
