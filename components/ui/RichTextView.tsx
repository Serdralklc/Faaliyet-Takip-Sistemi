"use client";

import { useEffect, useMemo, useState } from "react";
import { sanitizeHtml, stripTags } from "@/lib/sanitize-html";

/**
 * Zengin metin görüntüleyici. SSR + ilk render'da düz metin (hidrasyon uyumu),
 * mount sonrası temizlenmiş HTML'e geçer. İçerik daima sanitizeHtml'den geçer.
 */
export function RichTextView({ html, className }: { html?: string | null; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const icerik = html ?? "";
  const temiz = useMemo(() => (mounted ? sanitizeHtml(icerik) : ""), [mounted, icerik]);

  if (!icerik) return null;

  // Sunucu + ilk istemci render: etiketsiz düz metin (hidrasyon eşleşir)
  if (!mounted) {
    return <div className={`rte-content whitespace-pre-wrap ${className ?? ""}`}>{stripTags(icerik)}</div>;
  }
  return <div className={`rte-content ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: temiz }} />;
}
