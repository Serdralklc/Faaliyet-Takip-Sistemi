"use client";

/**
 * Üyeliksiz doküman paylaşım sayfası — /paylasim/[token]
 * Klasör paylaşımında dosya listesi, tek dosya paylaşımında büyük indirme kartı gösterir.
 * Erişim tasarım gereği üyeliksizdir; yetkilendirme token üzerinden API'de yapılır.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Download, AlertTriangle, File as FileIcon, FileText, FileSpreadsheet,
  FileImage, FileArchive, FileVideo, FileAudio,
} from "lucide-react";

interface PaylasimDosya {
  id: string;
  ad: string;
  boyut: number;
  uzanti: string;
  url: string;
  createdAt: string;
}

type PaylasimVeri =
  | { tip: "dosya"; dosya: PaylasimDosya }
  | { tip: "klasor"; ad: string; dosyalar: PaylasimDosya[] };

function uzantiIcon(uzanti: string): React.ElementType {
  const u = uzanti.toLowerCase().replace(/^\./, "");
  if (["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(u)) return FileText;
  if (["xls", "xlsx", "csv", "ods"].includes(u)) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(u)) return FileImage;
  if (["zip", "rar", "7z", "tar", "gz"].includes(u)) return FileArchive;
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(u)) return FileVideo;
  if (["mp3", "wav", "ogg", "m4a"].includes(u)) return FileAudio;
  return FileIcon;
}

function formatBoyut(boyut: number): string {
  if (boyut >= 1024 * 1024) return `${(boyut / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(boyut / 1024))} KB`;
}

/** Button (primary/md) görünümlü indirme bağlantısı */
function IndirLink({ href, buyuk = false }: { href: string; buyuk?: boolean }) {
  return (
    <a
      href={href}
      download
      className={`inline-flex items-center justify-center font-semibold transition active:scale-[0.98] bg-[var(--accent-solid)] text-white hover:bg-[var(--accent-hover)] shadow-sm ${
        buyuk ? "px-6 py-3 text-[15px] rounded-xl gap-2 w-full" : "px-3 py-1.5 text-[12.5px] rounded-lg gap-1.5"
      }`}
    >
      <Download size={buyuk ? 16 : 14} strokeWidth={2.5} />
      İndir
    </a>
  );
}

function DosyaSatiri({ dosya }: { dosya: PaylasimDosya }) {
  const Icon = uzantiIcon(dosya.uzanti);
  return (
    <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--bg-subtle)" }}
      >
        <Icon size={17} strokeWidth={2} style={{ color: "var(--accent)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-heading truncate">{dosya.ad}</p>
        <p className="text-[12px] text-muted">{formatBoyut(dosya.boyut)}</p>
      </div>
      <IndirLink href={dosya.url} />
    </li>
  );
}

export default function PaylasimPage() {
  const { token } = useParams<{ token: string }>();
  const [veri, setVeri] = useState<PaylasimVeri | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/paylasim/${token}`)
      .then(async r => {
        const j = await r.json().catch(() => null);
        if (!r.ok) {
          const varsayilan =
            r.status === 410
              ? "Bu paylaşım bağlantısının süresi dolmuş."
              : r.status === 404
              ? "Bağlantı bulunamadı veya kaldırılmış."
              : "Paylaşım yüklenirken bir hata oluştu.";
          throw new Error((j as { error?: string } | null)?.error || varsayilan);
        }
        return j as PaylasimVeri;
      })
      .then(setVeri)
      .catch((e: unknown) => setHata(e instanceof Error ? e.message : "Paylaşım yüklenirken bir hata oluştu."))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Yükleniyor ──
  if (loading) {
    return (
      <AuthCard title="Doküman Paylaşımı" subtitle="Paylaşım içeriği yükleniyor...">
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" style={{ opacity: 0.6 }} />
        </div>
      </AuthCard>
    );
  }

  // ── Hata (404 / 410 / diğer) ──
  if (hata || !veri) {
    return (
      <AuthCard title="Bağlantı Açılamadı">
        <div className="flex flex-col items-center text-center py-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--bg-subtle)" }}
          >
            <AlertTriangle size={22} strokeWidth={2} className="text-amber-500" />
          </div>
          <p className="text-[13.5px] text-secondary leading-relaxed">
            {hata ?? "Paylaşım yüklenirken bir hata oluştu."}
          </p>
          <p className="text-[12.5px] text-muted mt-3 leading-relaxed">
            Bağlantıyı sizinle paylaşan kişiden yeni bir bağlantı isteyebilirsiniz.
          </p>
        </div>
      </AuthCard>
    );
  }

  // ── Tek dosya paylaşımı ──
  if (veri.tip === "dosya") {
    const Icon = uzantiIcon(veri.dosya.uzanti);
    return (
      <AuthCard title={veri.dosya.ad} subtitle="Sizinle bir dosya paylaşıldı.">
        <div className="flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--bg-active)", border: "1px solid var(--green-muted)" }}
          >
            <Icon size={28} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-[12.5px] text-muted mb-5">
            {veri.dosya.uzanti.replace(/^\./, "").toUpperCase()} · {formatBoyut(veri.dosya.boyut)}
          </p>
          <IndirLink href={veri.dosya.url} buyuk />
        </div>
      </AuthCard>
    );
  }

  // ── Klasör paylaşımı ──
  return (
    <AuthCard
      title={veri.ad}
      subtitle={
        veri.dosyalar.length > 0
          ? `Sizinle ${veri.dosyalar.length} dosya paylaşıldı.`
          : "Sizinle bir klasör paylaşıldı."
      }
    >
      {veri.dosyalar.length === 0 ? (
        <p className="text-[13.5px] text-muted text-center py-4">Bu klasörde paylaşılan dosya yok.</p>
      ) : (
        <ul className="-my-1">
          {veri.dosyalar.map(d => (
            <DosyaSatiri key={d.id} dosya={d} />
          ))}
        </ul>
      )}
    </AuthCard>
  );
}
