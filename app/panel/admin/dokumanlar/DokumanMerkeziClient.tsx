"use client";

/**
 * Doküman Merkezi — Google Drive benzeri yönetici arayüzü.
 * Klasör hiyerarşisi, dosya yükleme, taşıma, erişim kitlesi ve
 * paylaşım linki yönetimi tek ekranda toplanır.
 */

import { useRef, useState } from "react";
import type { ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Copy,
  CornerLeftUp,
  Download,
  Eye,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Home,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Share2,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDateTR } from "@/lib/format";
import { DosyaOnizleme, onizlenebilirMi } from "@/components/DosyaOnizleme";

/* ──────────────────────────── Tipler ──────────────────────────── */

interface Erisim {
  erisimEgitim: boolean;
  erisimUniversite: boolean;
  erisimLise: boolean;
  erisimGonullu: boolean;
}

interface Klasor extends Erisim {
  id: string;
  ad: string;
  _count: { children: number; dokumanlar: number };
  createdAt: string;
}

interface Dosya extends Erisim {
  id: string;
  ad: string;
  url: string;
  boyut: number;
  mimeTipi: string;
  uzanti: string;
  createdByName: string;
  createdAt: string;
  klasorId: string | null;
}

interface DokumanlarYanit {
  klasorlar: Klasor[];
  dosyalar: Dosya[];
  breadcrumb: { id: string; ad: string }[];
  yonetici: boolean;
}

type Oge = ({ tur: "klasor" } & Klasor) | ({ tur: "dosya" } & Dosya);

type MenuAksiyon = "ad" | "tasi" | "erisim" | "paylas" | "surum" | "sil";

type IkonTipi = ComponentType<{ size?: number | string; className?: string; strokeWidth?: number | string }>;

const ERISIM_ALANLARI = [
  { key: "erisimEgitim", label: "Eğitim Sistemi" },
  { key: "erisimUniversite", label: "Üniversite" },
  { key: "erisimLise", label: "Lise" },
  { key: "erisimGonullu", label: "Gönüllüler" },
] as const;

type ErisimKey = (typeof ERISIM_ALANLARI)[number]["key"];
type ErisimState = Record<ErisimKey, boolean>;

const BOS_ERISIM: ErisimState = {
  erisimEgitim: false,
  erisimUniversite: false,
  erisimLise: false,
  erisimGonullu: false,
};

// Doküman yüklenince/güncellenince tetiklenecek bildirim kanalları
const BILDIRIM_ALANLARI = [
  { key: "bildirimSistem", label: "Sistem Bildirimi" },
  { key: "bildirimPopup", label: "Pop-Up" },
  { key: "bildirimDuyuru", label: "Duyuru Panosu" },
] as const;

type BildirimKey = (typeof BILDIRIM_ALANLARI)[number]["key"];
type BildirimState = Record<BildirimKey, boolean>;

const BOS_BILDIRIM: BildirimState = {
  bildirimSistem: false,
  bildirimPopup: false,
  bildirimDuyuru: false,
};

/* ─────────────────────────── Yardımcılar ─────────────────────────── */

async function dokumanlariGetir(klasorId: string | null): Promise<DokumanlarYanit> {
  const res = await fetch(klasorId ? `/api/dokumanlar?klasorId=${encodeURIComponent(klasorId)}` : "/api/dokumanlar");
  if (!res.ok) throw new Error("Dokümanlar yüklenemedi.");
  return res.json();
}

/** Klasör/dosya için doğru API yolu */
function ogeUrl(oge: Oge): string {
  return oge.tur === "klasor" ? `/api/dokumanlar/klasor/${oge.id}` : `/api/dokumanlar/${oge.id}`;
}

async function jsonIstek<T = unknown>(
  url: string,
  method: string,
  body?: unknown
): Promise<{ ok: boolean; data: T | null; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => null)) as T | null;
    if (!res.ok) {
      const err = (data as { error?: string } | null)?.error;
      return { ok: false, data: null, error: err ?? "İşlem başarısız oldu." };
    }
    return { ok: true, data, error: "" };
  } catch {
    return { ok: false, data: null, error: "Bağlantı hatası." };
  }
}

function formatBoyut(boyut: number): string {
  if (boyut < 1024) return `${boyut} B`;
  if (boyut < 1024 * 1024) return `${(boyut / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(boyut / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function dosyaIkonu(uzanti: string): IkonTipi {
  const u = uzanti.toLowerCase().replace(/^\./, "");
  if (["xls", "xlsx", "csv"].includes(u)) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(u)) return ImageIcon;
  if (["pdf", "doc", "docx", "txt", "ppt", "pptx"].includes(u)) return FileText;
  return FileIcon;
}

/* ─────────────────────── Küçük alt bileşenler ─────────────────────── */

/** Öğenin açık olduğu kitleleri rozetlerle gösterir */
function ErisimRozetleri({ oge }: { oge: Erisim }) {
  const rozetler: React.ReactNode[] = [];
  if (oge.erisimEgitim) rozetler.push(<Badge key="e" tone="brand">Eğitim</Badge>);
  if (oge.erisimUniversite) rozetler.push(<Badge key="u" tone="info">Üni</Badge>);
  if (oge.erisimLise) rozetler.push(<Badge key="l" tone="success">Lise</Badge>);
  if (oge.erisimGonullu) rozetler.push(<Badge key="g" tone="warning">Gönüllü</Badge>);
  return (
    <div className="flex flex-wrap gap-1">
      {rozetler.length > 0 ? rozetler : <Badge tone="neutral">Yalnız Yönetici</Badge>}
    </div>
  );
}

/** 4 kitle için checkbox grubu */
function ErisimSecimi({ deger, onChange }: { deger: ErisimState; onChange: (d: ErisimState) => void }) {
  return (
    <fieldset>
      <legend className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
        Erişebilecek Kitleler
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {ERISIM_ALANLARI.map(a => {
          const aktif = deger[a.key];
          return (
            <label
              key={a.key}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
              style={aktif
                ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <input
                type="checkbox"
                checked={aktif}
                onChange={e => onChange({ ...deger, [a.key]: e.target.checked })}
                className="accent-[var(--accent-solid)]"
              />
              {a.label}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted">Hiçbiri seçilmezse yalnızca yöneticiler görebilir.</p>
    </fieldset>
  );
}

/** Doküman yükleme/güncelleme sırasında bildirim kanalı seçimi (çoklu) */
function BildirimSecimi({ deger, onChange }: { deger: BildirimState; onChange: (d: BildirimState) => void }) {
  return (
    <fieldset>
      <legend className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
        Bildirim Gönder (opsiyonel)
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {BILDIRIM_ALANLARI.map(a => {
          const aktif = deger[a.key];
          return (
            <label
              key={a.key}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-[13px] font-semibold transition"
              style={aktif
                ? { background: "var(--bg-active)", borderColor: "var(--accent)", color: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <input
                type="checkbox"
                checked={aktif}
                onChange={e => onChange({ ...deger, [a.key]: e.target.checked })}
                className="accent-[var(--accent-solid)]"
              />
              {a.label}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted">Erişimi olan kullanıcılara bildirim, pop-up veya üst bant duyurusu gönderilir.</p>
    </fieldset>
  );
}

function MenuSatiri({
  ikon: Ikon, etiket, tehlikeli, onClick,
}: { ikon: IkonTipi; etiket: string; tehlikeli?: boolean; onClick: () => void }) {
  return (
    <button
      role="menuitem"
      onClick={e => { e.stopPropagation(); onClick(); }}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium transition hover:bg-subtle ${tehlikeli ? "text-red-600" : "text-secondary"}`}
    >
      <Ikon size={14} className="shrink-0" />
      {etiket}
    </button>
  );
}

/** Her klasör/dosya satırındaki ⋯ açılır menüsü */
function OgeMenu({
  oge, acik, onToggle, onAksiyon, yonetici,
}: {
  oge: Oge;
  acik: boolean;
  onToggle: () => void;
  onAksiyon: (aksiyon: MenuAksiyon) => void;
  yonetici: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        aria-label={`${oge.ad} işlemleri`}
        aria-haspopup="menu"
        aria-expanded={acik}
        className="p-1.5 rounded-lg text-muted hover:bg-subtle transition"
      >
        <MoreHorizontal size={16} />
      </button>
      {acik && (
        <>
          <div
            className="fixed inset-0 z-30"
            aria-hidden="true"
            onClick={e => { e.stopPropagation(); onToggle(); }}
          />
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 z-40 w-48 rounded-xl border border-border bg-card shadow-xl py-1.5"
            onClick={e => e.stopPropagation()}
          >
            {yonetici && <MenuSatiri ikon={Pencil} etiket="Yeniden Adlandır" onClick={() => onAksiyon("ad")} />}
            {yonetici && <MenuSatiri ikon={FolderInput} etiket="Taşı" onClick={() => onAksiyon("tasi")} />}
            {yonetici && <MenuSatiri ikon={ShieldCheck} etiket="Erişim" onClick={() => onAksiyon("erisim")} />}
            <MenuSatiri ikon={Share2} etiket="Paylaş" onClick={() => onAksiyon("paylas")} />
            {oge.tur === "dosya" && (
              <a
                href={oge.url}
                download={oge.ad}
                role="menuitem"
                onClick={() => onToggle()}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] font-medium text-secondary transition hover:bg-subtle"
              >
                <Download size={14} className="shrink-0" />
                İndir
              </a>
            )}
            {yonetici && oge.tur === "dosya" && (
              <MenuSatiri ikon={Upload} etiket="Yeni Sürüm" onClick={() => onAksiyon("surum")} />
            )}
            {yonetici && <MenuSatiri ikon={Trash2} etiket="Sil" tehlikeli onClick={() => onAksiyon("sil")} />}
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────── Taşı modalı ──────────────────────────── */

/** Kökten gezilebilen mini klasör gezgini ile taşıma */
function TasiModal({ oge, onKapat }: { oge: Oge; onKapat: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [konumId, setKonumId] = useState<string | null>(null);
  const [tasiniyor, setTasiniyor] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dokumanlar", konumId],
    queryFn: () => dokumanlariGetir(konumId),
  });

  // Taşınan klasör listede gösterilmez — kendi içine taşınamaz (sunucu da kontrol eder)
  const klasorler = (data?.klasorlar ?? []).filter(k => !(oge.tur === "klasor" && k.id === oge.id));
  const breadcrumb = data?.breadcrumb ?? [];
  const ustId = breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : null;

  async function tasi(hedefId: string | null) {
    setTasiniyor(true);
    const body = oge.tur === "klasor" ? { parentId: hedefId } : { klasorId: hedefId };
    const r = await jsonIstek(ogeUrl(oge), "PATCH", body);
    setTasiniyor(false);
    if (!r.ok) {
      toast({ type: "error", title: "Taşınamadı", message: r.error });
      return;
    }
    toast({
      type: "success",
      title: "Taşındı",
      message: `${oge.ad} ${hedefId ? "seçilen klasöre" : "kök klasöre"} taşındı.`,
    });
    queryClient.invalidateQueries({ queryKey: ["dokumanlar"] });
    onKapat();
  }

  return (
    <Modal
      open
      onClose={onKapat}
      title={`Taşı: ${oge.ad}`}
      maxWidth={520}
      footer={
        <>
          <Button variant="secondary" onClick={() => tasi(null)} disabled={tasiniyor}>
            Kök klasöre taşı
          </Button>
          <Button onClick={() => tasi(konumId)} loading={tasiniyor} disabled={isLoading || konumId === null}>
            Buraya Taşı
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Gezgin konumu */}
        <nav aria-label="Hedef klasör yolu" className="flex items-center gap-0.5 flex-wrap">
          <button
            onClick={() => setKonumId(null)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12.5px] font-semibold text-secondary hover:bg-subtle transition"
          >
            <Home size={13} />
            Kök
          </button>
          {breadcrumb.map(b => (
            <span key={b.id} className="flex items-center gap-0.5">
              <ChevronRight size={12} className="text-muted shrink-0" />
              <button
                onClick={() => setKonumId(b.id)}
                className="px-2 py-1 rounded-lg text-[12.5px] font-semibold text-secondary hover:bg-subtle transition max-w-36 truncate"
              >
                {b.ad}
              </button>
            </span>
          ))}
        </nav>

        <div className="rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-3 space-y-2" aria-hidden="true">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ) : (
            <>
              {konumId && (
                <button
                  onClick={() => setKonumId(ustId)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-muted hover:bg-subtle transition"
                >
                  <CornerLeftUp size={15} className="shrink-0" />
                  Üst klasöre dön
                </button>
              )}
              {klasorler.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-muted border-t border-border first:border-t-0">
                  Bu konumda alt klasör yok.
                </p>
              ) : (
                klasorler.map(k => (
                  <button
                    key={k.id}
                    onClick={() => setKonumId(k.id)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left border-t border-border first:border-t-0 hover:bg-subtle transition"
                  >
                    <Folder size={16} className="text-[var(--accent)] shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-heading">{k.ad}</span>
                    <ChevronRight size={14} className="text-muted shrink-0" />
                  </button>
                ))
              )}
            </>
          )}
        </div>
        <p className="text-[12px] text-muted">
          Hedef klasörün içine girin ve <strong>Buraya Taşı</strong> düğmesine basın.
        </p>
      </div>
    </Modal>
  );
}

/* ─────────────────────────── Paylaş modalı ─────────────────────────── */

function PaylasModal({ oge, onKapat }: { oge: Oge; onKapat: () => void }) {
  const { toast } = useToast();
  const [gun, setGun] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [olusturuluyor, setOlusturuluyor] = useState(false);

  async function olustur() {
    setOlusturuluyor(true);
    const body: Record<string, unknown> = oge.tur === "klasor" ? { klasorId: oge.id } : { dokumanId: oge.id };
    if (gun) body.gecerlilikGun = Number(gun);
    const r = await jsonIstek<{ url: string; expiresAt: string | null }>("/api/paylasim", "POST", body);
    setOlusturuluyor(false);
    if (!r.ok || !r.data) {
      toast({ type: "error", title: "Link oluşturulamadı", message: r.error });
      return;
    }
    setUrl(r.data.url);
    setExpiresAt(r.data.expiresAt);
  }

  async function kopyala() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({ type: "success", title: "Bağlantı kopyalandı" });
    } catch {
      toast({ type: "error", title: "Kopyalanamadı", message: "Bağlantıyı elle seçip kopyalayabilirsiniz." });
    }
  }

  return (
    <Modal
      open
      onClose={onKapat}
      title={`Paylaş: ${oge.ad}`}
      maxWidth={520}
      footer={
        url ? (
          <Button variant="secondary" onClick={onKapat}>Kapat</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onKapat} disabled={olusturuluyor}>Vazgeç</Button>
            <Button onClick={olustur} loading={olusturuluyor}>Link Oluştur</Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <Select label="Geçerlilik Süresi" value={gun} onChange={e => setGun(e.target.value)} disabled={!!url}>
          <option value="">Süresiz</option>
          <option value="7">7 gün</option>
          <option value="30">30 gün</option>
        </Select>

        {url && (
          <div className="space-y-2">
            <div className="flex items-stretch gap-2">
              <Input
                aria-label="Paylaşım bağlantısı"
                value={url}
                readOnly
                onFocus={e => e.target.select()}
              />
              <Button variant="secondary" onClick={kopyala} className="shrink-0 self-start">
                <Copy size={14} />
                Kopyala
              </Button>
            </div>
            <p className="text-[12px] text-muted">
              {expiresAt
                ? `Bağlantı ${formatDateTR(expiresAt)} tarihine kadar geçerlidir.`
                : "Bağlantı süresiz olarak geçerlidir."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────────── Ana bileşen ─────────────────────────── */

export function DokumanMerkeziClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [klasorId, setKlasorId] = useState<string | null>(null);
  const [menuAcikId, setMenuAcikId] = useState<string | null>(null);
  const [islemde, setIslemde] = useState(false);
  const [onizlenenDosya, setOnizlenenDosya] = useState<Dosya | null>(null);

  // Modal durumları
  const [yeniKlasorAcik, setYeniKlasorAcik] = useState(false);
  const [yeniKlasorAd, setYeniKlasorAd] = useState("");
  const [yeniKlasorErisim, setYeniKlasorErisim] = useState<ErisimState>(BOS_ERISIM);

  const [yuklemeDosyalar, setYuklemeDosyalar] = useState<File[]>([]);
  const [yuklemeErisim, setYuklemeErisim] = useState<ErisimState>(BOS_ERISIM);
  const [yuklemeBildirim, setYuklemeBildirim] = useState<BildirimState>(BOS_BILDIRIM);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Yeni sürüm yükleme
  const [surumOge, setSurumOge] = useState<Oge | null>(null);
  const [surumDosya, setSurumDosya] = useState<File | null>(null);
  const [surumBildirim, setSurumBildirim] = useState<BildirimState>(BOS_BILDIRIM);
  const [surumYukleniyor, setSurumYukleniyor] = useState(false);

  const [adOge, setAdOge] = useState<Oge | null>(null);
  const [yeniAd, setYeniAd] = useState("");
  const [tasiOge, setTasiOge] = useState<Oge | null>(null);
  const [erisimOge, setErisimOge] = useState<Oge | null>(null);
  const [erisimForm, setErisimForm] = useState<ErisimState>(BOS_ERISIM);
  const [paylasOge, setPaylasOge] = useState<Oge | null>(null);
  const [silOge, setSilOge] = useState<Oge | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dokumanlar", klasorId],
    queryFn: () => dokumanlariGetir(klasorId),
  });

  const klasorlar = data?.klasorlar ?? [];
  const dosyalar = data?.dosyalar ?? [];
  const breadcrumb = data?.breadcrumb ?? [];
  const yonetici = data?.yonetici ?? false;
  const bos = !isLoading && !isError && klasorlar.length === 0 && dosyalar.length === 0;

  function yenile() {
    queryClient.invalidateQueries({ queryKey: ["dokumanlar"] });
  }

  function gez(id: string | null) {
    setMenuAcikId(null);
    setKlasorId(id);
  }

  function menuAksiyon(oge: Oge, aksiyon: MenuAksiyon) {
    setMenuAcikId(null);
    switch (aksiyon) {
      case "ad":
        setYeniAd(oge.ad);
        setAdOge(oge);
        break;
      case "tasi":
        setTasiOge(oge);
        break;
      case "erisim":
        setErisimForm({
          erisimEgitim: oge.erisimEgitim,
          erisimUniversite: oge.erisimUniversite,
          erisimLise: oge.erisimLise,
          erisimGonullu: oge.erisimGonullu,
        });
        setErisimOge(oge);
        break;
      case "paylas":
        setPaylasOge(oge);
        break;
      case "surum":
        setSurumDosya(null);
        setSurumBildirim(BOS_BILDIRIM);
        setSurumOge(oge);
        break;
      case "sil":
        setSilOge(oge);
        break;
    }
  }

  /* ── Mutasyonlar ── */

  async function handleYeniKlasor() {
    const ad = yeniKlasorAd.trim();
    if (!ad) return;
    setIslemde(true);
    const r = await jsonIstek("/api/dokumanlar", "POST", { ad, parentId: klasorId, ...yeniKlasorErisim });
    setIslemde(false);
    if (!r.ok) {
      toast({ type: "error", title: "Klasör oluşturulamadı", message: r.error });
      return;
    }
    toast({ type: "success", title: "Klasör oluşturuldu", message: ad });
    setYeniKlasorAcik(false);
    yenile();
  }

  function dosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const secilen = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (secilen.length === 0) return;
    setYuklemeErisim(BOS_ERISIM);
    setYuklemeBildirim(BOS_BILDIRIM);
    setYuklemeDosyalar(secilen);
  }

  async function handleYukle() {
    setYukleniyor(true);
    let basarili = 0;
    const hatalar: string[] = [];
    // Dosyalar sırayla yüklenir
    for (const f of yuklemeDosyalar) {
      const fd = new FormData();
      fd.append("file", f);
      if (klasorId) fd.append("klasorId", klasorId);
      for (const a of ERISIM_ALANLARI) fd.append(a.key, yuklemeErisim[a.key] ? "1" : "0");
      for (const a of BILDIRIM_ALANLARI) fd.append(a.key, yuklemeBildirim[a.key] ? "1" : "0");
      try {
        const res = await fetch("/api/dokumanlar/upload", { method: "POST", body: fd });
        if (res.ok) {
          basarili++;
        } else {
          const d = (await res.json().catch(() => null)) as { error?: string } | null;
          hatalar.push(`${f.name}: ${d?.error ?? "yüklenemedi"}`);
        }
      } catch {
        hatalar.push(`${f.name}: bağlantı hatası`);
      }
    }
    setYukleniyor(false);
    setYuklemeDosyalar([]);
    if (basarili > 0) {
      toast({ type: "success", title: basarili === 1 ? "Dosya yüklendi" : `${basarili} dosya yüklendi` });
    }
    if (hatalar.length > 0) {
      toast({
        type: "error",
        title: hatalar.length === 1 ? "Dosya yüklenemedi" : `${hatalar.length} dosya yüklenemedi`,
        message: hatalar.join(" • "),
        duration: 7000,
      });
    }
    yenile();
  }

  async function handleSurumYukle() {
    if (!surumOge || !surumDosya) return;
    setSurumYukleniyor(true);
    try {
      const fd = new FormData();
      fd.append("file", surumDosya);
      for (const a of BILDIRIM_ALANLARI) fd.append(a.key, surumBildirim[a.key] ? "1" : "0");
      const res = await fetch(`/api/dokumanlar/${surumOge.id}/surum`, { method: "POST", body: fd });
      const d = (await res.json().catch(() => null)) as { error?: string; surum?: number } | null;
      if (!res.ok) {
        toast({ type: "error", title: "Yeni sürüm yüklenemedi", message: d?.error });
        return;
      }
      toast({ type: "success", title: "Yeni sürüm yüklendi", message: d?.surum ? `Sürüm ${d.surum}` : undefined });
      setSurumOge(null);
      setSurumDosya(null);
      yenile();
    } catch {
      toast({ type: "error", title: "Bağlantı hatası" });
    } finally {
      setSurumYukleniyor(false);
    }
  }

  async function handleYenidenAdlandir() {
    if (!adOge) return;
    const ad = yeniAd.trim();
    if (!ad) return;
    setIslemde(true);
    const r = await jsonIstek(ogeUrl(adOge), "PATCH", { ad });
    setIslemde(false);
    if (!r.ok) {
      toast({ type: "error", title: "Yeniden adlandırılamadı", message: r.error });
      return;
    }
    toast({ type: "success", title: "Yeniden adlandırıldı", message: ad });
    setAdOge(null);
    yenile();
  }

  async function handleErisimKaydet() {
    if (!erisimOge) return;
    setIslemde(true);
    const r = await jsonIstek(ogeUrl(erisimOge), "PATCH", { ...erisimForm });
    setIslemde(false);
    if (!r.ok) {
      toast({ type: "error", title: "Erişim güncellenemedi", message: r.error });
      return;
    }
    toast({ type: "success", title: "Erişim güncellendi", message: erisimOge.ad });
    setErisimOge(null);
    yenile();
  }

  async function handleSil() {
    if (!silOge) return;
    setIslemde(true);
    const r = await jsonIstek(ogeUrl(silOge), "DELETE");
    setIslemde(false);
    if (!r.ok) {
      // Boş olmayan klasörlerde API 400 mesajı buraya düşer
      toast({ type: "error", title: "Silinemedi", message: r.error });
      return;
    }
    toast({ type: "success", title: silOge.tur === "klasor" ? "Klasör silindi" : "Dosya silindi", message: silOge.ad });
    setSilOge(null);
    yenile();
  }

  /* ── Görünüm ── */

  return (
    <div className="p-6 lg:p-8 space-y-5">
      <div className="sv-page-header">
        <h1>Doküman Merkezi</h1>
        <p>Klasörleri ve dosyaları yönetin, kitlelere göre erişim ve paylaşım linkleri verin</p>
      </div>

      {/* Breadcrumb + araç çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Klasör yolu" className="flex items-center gap-0.5 flex-wrap min-w-0">
          <button
            onClick={() => gez(null)}
            aria-current={breadcrumb.length === 0 ? "page" : undefined}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition hover:bg-subtle ${breadcrumb.length === 0 ? "text-heading" : "text-secondary"}`}
          >
            <Home size={14} className="shrink-0" />
            Kök
          </button>
          {breadcrumb.map((b, i) => {
            const son = i === breadcrumb.length - 1;
            return (
              <span key={b.id} className="flex items-center gap-0.5 min-w-0">
                <ChevronRight size={13} className="text-muted shrink-0" />
                <button
                  onClick={() => gez(b.id)}
                  aria-current={son ? "page" : undefined}
                  className={`px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition hover:bg-subtle max-w-44 truncate ${son ? "text-heading" : "text-secondary"}`}
                >
                  {b.ad}
                </button>
              </span>
            );
          })}
        </nav>

        {yonetici && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setYeniKlasorAd("");
              setYeniKlasorErisim(BOS_ERISIM);
              setYeniKlasorAcik(true);
            }}
          >
            <FolderPlus size={15} />
            Yeni Klasör
          </Button>
          <Button onClick={() => dosyaInputRef.current?.click()}>
            <Upload size={15} />
            Dosya Yükle
          </Button>
          <input
            ref={dosyaInputRef}
            type="file"
            multiple
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
            onChange={dosyaSec}
          />
        </div>
        )}
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="space-y-5" aria-hidden="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <SkeletonTable rows={4} cols={4} />
        </div>
      ) : isError ? (
        <div className="sv-section px-6 py-12 text-center">
          <p className="text-[14.5px] font-semibold text-heading">Dokümanlar yüklenemedi</p>
          <p className="text-[13px] text-muted mt-1">Bağlantınızı kontrol edip yeniden deneyin.</p>
          <Button variant="secondary" className="mt-4" onClick={() => refetch()}>Tekrar Dene</Button>
        </div>
      ) : bos ? (
        <div className="sv-section flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FolderOpen size={42} strokeWidth={1.5} className="text-muted" />
          <div>
            <p className="text-[14.5px] font-semibold text-heading">Bu klasör boş</p>
            <p className="text-[13px] text-muted mt-1">
              Yukarıdaki düğmelerle dosya yükleyebilir veya yeni bir klasör oluşturabilirsiniz.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Klasör grid'i */}
          {klasorlar.length > 0 && (
            <section aria-label="Klasörler">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted mb-2.5">
                Klasörler ({klasorlar.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {klasorlar.map(k => (
                  <div
                    key={k.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => gez(k.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        gez(k.id);
                      }
                    }}
                    className="relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 cursor-pointer shadow-sm transition hover:border-[var(--accent)] hover:shadow-md"
                  >
                    <div className="shrink-0 p-2.5 rounded-xl" style={{ background: "var(--bg-active)" }}>
                      <Folder size={20} className="text-[var(--accent)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-heading truncate" title={k.ad}>{k.ad}</p>
                      <p className="text-[12px] text-muted mt-0.5">
                        {k._count.children} klasör · {k._count.dokumanlar} dosya
                      </p>
                      <div className="mt-2">
                        <ErisimRozetleri oge={k} />
                      </div>
                    </div>
                    <OgeMenu
                      oge={{ tur: "klasor", ...k }}
                      acik={menuAcikId === k.id}
                      yonetici={yonetici}
                      onToggle={() => setMenuAcikId(menuAcikId === k.id ? null : k.id)}
                      onAksiyon={a => menuAksiyon({ tur: "klasor", ...k }, a)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dosya listesi */}
          {dosyalar.length > 0 && (
            <section aria-label="Dosyalar" className="sv-section" style={{ overflow: "visible" }}>
              <div className="sv-section-header">
                <h2>Dosyalar</h2>
                <span className="text-[12px] text-muted">{dosyalar.length} dosya</span>
              </div>
              <div>
                {dosyalar.map((d, i) => {
                  const Ikon = dosyaIkonu(d.uzanti);
                  return (
                    <div
                      key={d.id}
                      className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <Ikon size={18} className="text-muted shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold text-heading truncate" title={d.ad}>{d.ad}</p>
                        <p className="text-[12px] text-muted mt-0.5">
                          {formatBoyut(d.boyut)} · {d.createdByName} · {formatDateTR(d.createdAt)}
                        </p>
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <ErisimRozetleri oge={d} />
                      </div>
                      {onizlenebilirMi(d.uzanti) && (
                        <button
                          onClick={() => setOnizlenenDosya(d)}
                          title="Önizle"
                          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] rounded-lg font-semibold transition border border-border text-secondary hover:bg-subtle shrink-0"
                        >
                          <Eye size={13} strokeWidth={2.5} />
                          Önizle
                        </button>
                      )}
                      <OgeMenu
                        oge={{ tur: "dosya", ...d }}
                        acik={menuAcikId === d.id}
                        yonetici={yonetici}
                        onToggle={() => setMenuAcikId(menuAcikId === d.id ? null : d.id)}
                        onAksiyon={a => menuAksiyon({ tur: "dosya", ...d }, a)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Önizleme modalı (PDF / görsel) — indirmeden site içinde incele ── */}
      <Modal open={!!onizlenenDosya} onClose={() => setOnizlenenDosya(null)} title={onizlenenDosya?.ad ?? "Önizleme"} maxWidth={900}>
        {onizlenenDosya && <DosyaOnizleme id={onizlenenDosya.id} uzanti={onizlenenDosya.uzanti} ad={onizlenenDosya.ad} />}
      </Modal>

      {/* ── Yeni Klasör modalı ── */}
      <Modal
        open={yeniKlasorAcik}
        onClose={() => setYeniKlasorAcik(false)}
        title="Yeni Klasör"
        footer={
          <>
            <Button variant="secondary" onClick={() => setYeniKlasorAcik(false)} disabled={islemde}>Vazgeç</Button>
            <Button onClick={handleYeniKlasor} loading={islemde} disabled={!yeniKlasorAd.trim()}>Oluştur</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Klasör Adı"
            required
            value={yeniKlasorAd}
            onChange={e => setYeniKlasorAd(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && yeniKlasorAd.trim() && !islemde) handleYeniKlasor();
            }}
            placeholder="Örn. 2026 Faaliyet Şablonları"
            maxLength={120}
          />
          <ErisimSecimi deger={yeniKlasorErisim} onChange={setYeniKlasorErisim} />
        </div>
      </Modal>

      {/* ── Dosya Yükleme modalı ── */}
      <Modal
        open={yuklemeDosyalar.length > 0}
        onClose={() => {
          if (!yukleniyor) setYuklemeDosyalar([]);
        }}
        title={yuklemeDosyalar.length === 1 ? "Dosya Yükle" : `Dosya Yükle (${yuklemeDosyalar.length})`}
        maxWidth={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => setYuklemeDosyalar([])} disabled={yukleniyor}>Vazgeç</Button>
            <Button onClick={handleYukle} loading={yukleniyor}>
              {yuklemeDosyalar.length === 1 ? "Yükle" : `${yuklemeDosyalar.length} Dosyayı Yükle`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border max-h-48 overflow-y-auto">
            {yuklemeDosyalar.map((f, i) => {
              const Ikon = dosyaIkonu(f.name.split(".").pop() ?? "");
              return (
                <div
                  key={`${f.name}-${i}`}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <Ikon size={15} className="text-muted shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-heading" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-[12px] text-muted shrink-0">{formatBoyut(f.size)}</span>
                </div>
              );
            })}
          </div>
          <ErisimSecimi deger={yuklemeErisim} onChange={setYuklemeErisim} />
          <BildirimSecimi deger={yuklemeBildirim} onChange={setYuklemeBildirim} />
          <p className="text-[12px] text-muted">
            En fazla 20 MB; PDF, Office belgeleri ve görseller desteklenir.
          </p>
        </div>
      </Modal>

      {/* ── Yeni Sürüm modalı ── */}
      <Modal
        open={!!surumOge}
        onClose={() => { if (!surumYukleniyor) setSurumOge(null); }}
        title={surumOge ? `Yeni Sürüm: ${surumOge.ad}` : "Yeni Sürüm"}
        maxWidth={520}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSurumOge(null)} disabled={surumYukleniyor}>Vazgeç</Button>
            <Button onClick={handleSurumYukle} loading={surumYukleniyor} disabled={!surumDosya}>Yükle</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-muted">
            Yeni dosya mevcut dokümanın üzerine yazılır ve sürüm numarası artar. Eski sürüm saklanmaz.
          </p>
          <input
            type="file"
            onChange={e => setSurumDosya(e.target.files?.[0] ?? null)}
            className="text-[13px]"
          />
          {surumDosya && (
            <div className="rounded-xl border border-border px-3.5 py-2.5 flex items-center gap-2.5">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-heading">{surumDosya.name}</span>
              <span className="text-[12px] text-muted shrink-0">{formatBoyut(surumDosya.size)}</span>
            </div>
          )}
          <BildirimSecimi deger={surumBildirim} onChange={setSurumBildirim} />
        </div>
      </Modal>

      {/* ── Yeniden Adlandır modalı ── */}
      <Modal
        open={!!adOge}
        onClose={() => setAdOge(null)}
        title="Yeniden Adlandır"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdOge(null)} disabled={islemde}>Vazgeç</Button>
            <Button onClick={handleYenidenAdlandir} loading={islemde} disabled={!yeniAd.trim()}>Kaydet</Button>
          </>
        }
      >
        <Input
          label="Yeni Ad"
          required
          value={yeniAd}
          onChange={e => setYeniAd(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && yeniAd.trim() && !islemde) handleYenidenAdlandir();
          }}
          maxLength={120}
        />
      </Modal>

      {/* ── Erişim modalı ── */}
      <Modal
        open={!!erisimOge}
        onClose={() => setErisimOge(null)}
        title={erisimOge ? `Erişim: ${erisimOge.ad}` : "Erişim"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setErisimOge(null)} disabled={islemde}>Vazgeç</Button>
            <Button onClick={handleErisimKaydet} loading={islemde}>Kaydet</Button>
          </>
        }
      >
        <ErisimSecimi deger={erisimForm} onChange={setErisimForm} />
      </Modal>

      {/* ── Taşı modalı ── */}
      {tasiOge && <TasiModal oge={tasiOge} onKapat={() => setTasiOge(null)} />}

      {/* ── Paylaş modalı ── */}
      {paylasOge && <PaylasModal oge={paylasOge} onKapat={() => setPaylasOge(null)} />}

      {/* ── Sil onayı ── */}
      <ConfirmDialog
        open={!!silOge}
        onClose={() => setSilOge(null)}
        onConfirm={handleSil}
        title={silOge?.tur === "klasor" ? "Klasörü Sil" : "Dosyayı Sil"}
        message={
          silOge?.tur === "klasor"
            ? `${silOge.ad} klasörü silinecek. Klasör boş değilse silme işlemi reddedilir.`
            : `${silOge?.ad ?? ""} dosyası kalıcı olarak silinir ve geri alınamaz.`
        }
        confirmLabel="Sil"
        danger
        loading={islemde}
      />
    </div>
  );
}
