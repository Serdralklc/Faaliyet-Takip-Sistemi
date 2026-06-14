"use client";

/**
 * Dosya önizleme — indirmeden site içinde inceleme.
 * Desteklenen: PDF (iframe), görsel (img), Excel (.xls/.xlsx → SheetJS HTML tablo),
 * Word (.docx → docx-preview). Hiçbir dosya harici servise gönderilmez.
 * PowerPoint, eski .doc ve diğer türler önizlenemez → indirilmeli.
 *
 * Excel/Word içeriği büyük kütüphaneler gerektirdiğinden dinamik import edilir
 * (yalnız ilgili dosya açılınca yüklenir).
 */

import { useEffect, useRef, useState } from "react";

const GORSEL = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
const temiz = (u: string) => u.toLowerCase().replace(/^\./, "");

/** Bu uzantı site içinde önizlenebilir mi? */
export function onizlenebilirMi(uzanti: string): boolean {
  const u = temiz(uzanti);
  return u === "pdf" || GORSEL.includes(u) || u === "xls" || u === "xlsx" || u === "docx";
}

function Durum({ mesaj }: { mesaj: string }) {
  return <p className="text-[13px] text-muted py-8 text-center">{mesaj}</p>;
}

export function DosyaOnizleme({ id, uzanti, ad }: { id: string; uzanti: string; ad: string }) {
  const u = temiz(uzanti);
  const src = `/api/dosya/${id}?onizleme=1`;

  if (GORSEL.includes(u)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={ad} className="max-w-full max-h-[75vh] mx-auto rounded-lg" />;
  }
  if (u === "pdf") {
    return <iframe src={src} title={ad} className="w-full rounded-lg" style={{ height: "75vh", border: "none" }} />;
  }
  if (u === "xls" || u === "xlsx") return <ExcelOnizleme src={src} />;
  if (u === "docx") return <WordOnizleme src={src} />;
  return <Durum mesaj="Bu dosya türü tarayıcıda önizlenemez. Lütfen indirin." />;
}

function ExcelOnizleme({ src }: { src: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [hata, setHata] = useState(false);

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const buf = await (await fetch(src)).arrayBuffer();
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buf, { type: "array" });
        const parcalar = wb.SheetNames.map(ad => {
          const tablo = XLSX.utils.sheet_to_html(wb.Sheets[ad]);
          return `<div class="oz-sheet-ad">${ad}</div>${tablo}`;
        });
        if (!iptal) setHtml(parcalar.join(""));
      } catch {
        if (!iptal) setHata(true);
      }
    })();
    return () => { iptal = true; };
  }, [src]);

  if (hata) return <Durum mesaj="Excel önizlenemedi. Lütfen indirin." />;
  if (html === null) return <Durum mesaj="Yükleniyor…" />;
  return (
    <div className="oz-excel overflow-auto max-h-[75vh]">
      <style>{`
        .oz-excel table { border-collapse: collapse; font-size: 13px; }
        .oz-excel td, .oz-excel th { border: 1px solid var(--border); padding: 4px 8px; white-space: nowrap; }
        .oz-sheet-ad { font-weight: 700; color: var(--text-heading); margin: 12px 0 6px; }
        .oz-sheet-ad:first-child { margin-top: 0; }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function WordOnizleme({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [durum, setDurum] = useState<"yukleniyor" | "tamam" | "hata">("yukleniyor");

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const buf = await (await fetch(src)).arrayBuffer();
        const { renderAsync } = await import("docx-preview");
        if (iptal || !ref.current) return;
        ref.current.innerHTML = "";
        await renderAsync(buf, ref.current, undefined, {
          className: "oz-docx",
          inWrapper: true,
          ignoreWidth: true,
        });
        if (!iptal) setDurum("tamam");
      } catch {
        if (!iptal) setDurum("hata");
      }
    })();
    return () => { iptal = true; };
  }, [src]);

  return (
    <div className="overflow-auto max-h-[75vh]">
      {durum === "yukleniyor" && <Durum mesaj="Yükleniyor…" />}
      {durum === "hata" && <Durum mesaj="Word önizlenemedi. Lütfen indirin." />}
      <div ref={ref} style={{ display: durum === "tamam" ? "block" : "none" }} />
    </div>
  );
}
