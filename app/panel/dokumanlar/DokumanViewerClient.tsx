"use client";

/**
 * Salt okunur doküman gezgini — bölge / il sorumluları.
 * Rol bazlı görünürlük API tarafında daraltılır (/api/dokumanlar).
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { formatDateTR } from "@/lib/format";
import {
  Folder, FolderOpen, ChevronRight, Download, Share2, File as FileIcon,
  FileText, FileSpreadsheet, FileImage, FileArchive, FileVideo, FileAudio,
} from "lucide-react";

interface Klasor {
  id: string;
  ad: string;
  _count: { children: number; dokumanlar: number };
}

interface Dosya {
  id: string;
  ad: string;
  url: string;
  boyut: number;
  uzanti: string;
  createdAt: string;
}

interface Yanit {
  klasorlar: Klasor[];
  dosyalar: Dosya[];
  breadcrumb: { id: string; ad: string }[];
  yonetici: boolean;
}

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

export function DokumanViewerClient() {
  const [klasorId, setKlasorId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dokumanlar", klasorId],
    queryFn: async (): Promise<Yanit> => {
      const r = await fetch(`/api/dokumanlar${klasorId ? `?klasorId=${encodeURIComponent(klasorId)}` : ""}`);
      if (!r.ok) throw new Error("Dokümanlar yüklenemedi.");
      return r.json();
    },
  });

  const bos = !isLoading && !isError && data && data.klasorlar.length === 0 && data.dosyalar.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-extrabold text-heading" style={{ letterSpacing: "-0.02em" }}>
          Dokümanlar
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Genel merkez tarafından sizinle paylaşılan dokümanlar — salt okunur.
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center flex-wrap gap-1 text-[13px]" aria-label="Klasör yolu">
        <button
          onClick={() => klasorId && setKlasorId(null)}
          className="font-semibold hover:underline"
          style={{ color: klasorId ? "var(--accent)" : "var(--text-primary)", cursor: klasorId ? "pointer" : "default", background: "none", border: "none", padding: 0 }}
        >
          Dokümanlar
        </button>
        {(data?.breadcrumb ?? []).map((b, i, arr) => {
          const sonuncu = i === arr.length - 1;
          return (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight size={13} strokeWidth={2.5} style={{ color: "var(--text-muted)" }} />
              <button
                onClick={() => !sonuncu && setKlasorId(b.id)}
                className={`font-semibold ${sonuncu ? "" : "hover:underline"}`}
                style={{ color: sonuncu ? "var(--text-primary)" : "var(--accent)", cursor: sonuncu ? "default" : "pointer", background: "none", border: "none", padding: 0 }}
              >
                {b.ad}
              </button>
            </span>
          );
        })}
      </nav>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            <Skeleton className="h-[68px] rounded-2xl" />
            <Skeleton className="h-[68px] rounded-2xl" />
            <Skeleton className="h-[68px] rounded-2xl" style={{ opacity: 0.6 }} />
          </div>
          <div className="sv-section p-5 space-y-3">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" style={{ opacity: 0.7 }} />
            <Skeleton className="h-10 rounded-xl" style={{ opacity: 0.4 }} />
          </div>
        </div>
      ) : isError ? (
        <div className="sv-section p-8 text-center">
          <p className="text-[14px] font-semibold text-heading">Dokümanlar yüklenemedi.</p>
          <p className="text-[12.5px] text-muted mt-1">Lütfen sayfayı yenileyip tekrar deneyin.</p>
        </div>
      ) : bos ? (
        <div className="sv-section p-10 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--bg-subtle)" }}
          >
            <FolderOpen size={24} strokeWidth={1.8} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-[14.5px] font-semibold text-heading">
            {klasorId ? "Bu klasör boş." : "Sizinle paylaşılmış doküman yok."}
          </p>
        </div>
      ) : (
        <>
          {/* Klasör kartları */}
          {data && data.klasorlar.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {data.klasorlar.map(k => (
                <button
                  key={k.id}
                  onClick={() => setKlasorId(k.id)}
                  className="flex items-center gap-3 text-left rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:bg-[color:var(--bg-hover)] cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-active)" }}
                  >
                    <Folder size={18} strokeWidth={2} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-heading truncate">{k.ad}</p>
                    <p className="text-[11.5px] text-muted mt-0.5">
                      {k._count.children} klasör · {k._count.dokumanlar} dosya
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Dosya satırları */}
          {data && data.dosyalar.length > 0 && (
            <div className="sv-section p-0 overflow-hidden">
              {data.dosyalar.map((d, i) => {
                const Icon = uzantiIcon(d.uzanti);
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${i === 0 ? "" : "border-t border-border"}`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--bg-subtle)" }}
                    >
                      <Icon size={16} strokeWidth={2} style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-heading truncate">{d.ad}</p>
                      <p className="text-[11.5px] text-muted mt-0.5">
                        {formatBoyut(d.boyut)} · {formatDateTR(d.createdAt)}
                      </p>
                    </div>
                    <Badge tone="brand" className="hidden sm:inline-flex uppercase">
                      {d.uzanti.replace(/^\./, "")}
                    </Badge>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/paylasim", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ dokumanId: d.id }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok && data.url) {
                            try { await navigator.clipboard.writeText(data.url); } catch { /* */ }
                            alert("Paylaşım bağlantısı kopyalandı:\n" + data.url);
                          } else {
                            alert(data.error || "Paylaşım oluşturulamadı.");
                          }
                        } catch { alert("Paylaşım oluşturulamadı."); }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12.5px] rounded-lg font-semibold transition border border-border text-secondary hover:bg-[var(--bg-active)] flex-shrink-0"
                    >
                      <Share2 size={13} strokeWidth={2.5} />
                      Paylaş
                    </button>
                    <a
                      href={d.url}
                      download
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[12.5px] rounded-lg font-semibold transition border border-[var(--accent-solid)] text-[var(--accent)] hover:bg-[var(--bg-active)] flex-shrink-0"
                    >
                      <Download size={13} strokeWidth={2.5} />
                      İndir
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
