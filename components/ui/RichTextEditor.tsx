"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, Type,
  List, ListOrdered, Link2, Image as ImageIcon, Table as TableIcon,
  Baseline, PaintBucket, RemoveFormatting,
} from "lucide-react";

/**
 * Bağımlılıksız zengin metin düzenleyici (contentEditable + execCommand).
 * value/onChange HTML stringi taşır. Çıktı görüntülenirken RichTextView ile temizlenir.
 */
export function RichTextEditor({
  value, onChange, placeholder, disabled, minHeight = 140, ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sonHtml = useRef<string>(value);

  // value dışarıdan değişince DOM'a yaz (yazarken imleç sıçramasın diye sadece farklıysa)
  useEffect(() => {
    if (ref.current && value !== sonHtml.current) {
      ref.current.innerHTML = value || "";
      sonHtml.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    const html = ref.current?.innerHTML ?? "";
    sonHtml.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback((cmd: string, arg?: string) => {
    if (disabled) return;
    ref.current?.focus();
    try { document.execCommand(cmd, false, arg); } catch { /* desteklenmeyen komut */ }
    emit();
  }, [disabled, emit]);

  function linkEkle() {
    if (disabled) return;
    const url = window.prompt("Bağlantı adresi (https://...)");
    if (url && /^https?:\/\//i.test(url)) exec("createLink", url);
  }
  function gorselEkle() {
    if (disabled) return;
    const url = window.prompt("Görsel adresi (https://...)");
    if (url && /^https?:\/\//i.test(url)) exec("insertImage", url);
  }
  function tabloEkle() {
    if (disabled) return;
    const sat = Number(window.prompt("Satır sayısı", "2") || 0);
    const sut = Number(window.prompt("Sütun sayısı", "2") || 0);
    if (!sat || !sut || sat > 20 || sut > 10) return;
    let html = '<table style="border-collapse: collapse; width: 100%;" border="1"><tbody>';
    for (let r = 0; r < sat; r++) {
      html += "<tr>";
      for (let c = 0; c < sut; c++) html += '<td style="border: 1px solid #cbd5e1; padding: 6px;">&nbsp;</td>';
      html += "</tr>";
    }
    html += "</tbody></table><p><br/></p>";
    exec("insertHTML", html);
  }

  const Btn = ({ on, title, children }: { on: () => void; title: string; children: ReactNode }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); on(); }}
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg border text-muted hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] disabled:opacity-40 transition"
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-input)", background: "var(--bg-input)" }}>
      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-th)" }}>
        <Btn on={() => exec("bold")} title="Kalın"><Bold size={15} /></Btn>
        <Btn on={() => exec("italic")} title="İtalik"><Italic size={15} /></Btn>
        <Btn on={() => exec("underline")} title="Altı Çizili"><Underline size={15} /></Btn>
        <span className="w-px h-5 mx-0.5" style={{ background: "var(--border)" }} />
        <Btn on={() => exec("formatBlock", "<h2>")} title="Başlık"><Heading2 size={15} /></Btn>
        <Btn on={() => exec("formatBlock", "<h3>")} title="Alt Başlık"><Heading3 size={15} /></Btn>
        <Btn on={() => exec("formatBlock", "<p>")} title="Normal Metin"><Type size={15} /></Btn>
        <select
          aria-label="Yazı Boyutu"
          disabled={disabled}
          defaultValue=""
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { if (e.target.value) { exec("fontSize", e.target.value); e.target.value = ""; } }}
          className="h-8 rounded-lg border px-1.5 text-[12px] font-semibold"
          style={{ borderColor: "var(--border)", background: "var(--bg-input)", color: "var(--text-muted)" }}
        >
          <option value="">Boyut</option>
          <option value="1">Çok Küçük</option>
          <option value="2">Küçük</option>
          <option value="3">Normal</option>
          <option value="5">Büyük</option>
          <option value="6">Çok Büyük</option>
        </select>
        <span className="w-px h-5 mx-0.5" style={{ background: "var(--border)" }} />
        {/* Yazı rengi */}
        <label className="w-8 h-8 inline-flex items-center justify-center rounded-lg border cursor-pointer text-muted hover:text-[var(--accent)] relative" style={{ borderColor: "var(--border)" }} title="Yazı Rengi">
          <Baseline size={15} />
          <input type="color" disabled={disabled} className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={e => exec("foreColor", e.target.value)} aria-label="Yazı Rengi" />
        </label>
        {/* Arka plan rengi */}
        <label className="w-8 h-8 inline-flex items-center justify-center rounded-lg border cursor-pointer text-muted hover:text-[var(--accent)] relative" style={{ borderColor: "var(--border)" }} title="Arka Plan Rengi">
          <PaintBucket size={15} />
          <input type="color" disabled={disabled} className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={e => exec("hiliteColor", e.target.value)} aria-label="Arka Plan Rengi" />
        </label>
        <span className="w-px h-5 mx-0.5" style={{ background: "var(--border)" }} />
        <Btn on={() => exec("insertUnorderedList")} title="Madde İşaretli Liste"><List size={15} /></Btn>
        <Btn on={() => exec("insertOrderedList")} title="Numaralı Liste"><ListOrdered size={15} /></Btn>
        <Btn on={linkEkle} title="Bağlantı Ekle"><Link2 size={15} /></Btn>
        <Btn on={gorselEkle} title="Görsel Ekle"><ImageIcon size={15} /></Btn>
        <Btn on={tabloEkle} title="Tablo Ekle"><TableIcon size={15} /></Btn>
        <span className="w-px h-5 mx-0.5" style={{ background: "var(--border)" }} />
        <Btn on={() => exec("removeFormat")} title="Biçimi Temizle"><RemoveFormatting size={15} /></Btn>
      </div>

      {/* Düzenleme alanı */}
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel ?? "Zengin metin alanı"}
        data-placeholder={placeholder ?? "Metin yazın..."}
        onInput={emit}
        onBlur={emit}
        className="rte-editor rte-content px-3.5 py-3 text-[14px] leading-relaxed focus:outline-none"
        style={{ minHeight, color: "var(--text-primary)" }}
      />
    </div>
  );
}
