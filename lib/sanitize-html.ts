/**
 * Hafif HTML temizleyici (whitelist) — zengin metin düzenleyici çıktısı için.
 * Harici bağımlılık yok; DOMParser ile çalışır (yalnız tarayıcı).
 *
 * İçerik yöneticiler (YONETICI) tarafından yazılır, iç kullanıcılar görür; yine de
 * script/event-handler/javascript: enjeksiyonuna karşı katı whitelist uygulanır.
 */

const IZIN_TAGLAR = new Set([
  "B", "STRONG", "I", "EM", "U", "S", "P", "BR", "DIV", "SPAN",
  "H1", "H2", "H3", "H4", "UL", "OL", "LI", "A", "IMG", "BLOCKQUOTE", "FONT",
  "TABLE", "THEAD", "TBODY", "TR", "TD", "TH",
]);

// Tamamen atılacak (içeriğiyle birlikte) tehlikeli etiketler
const TEHLIKELI = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "FORM", "INPUT", "BUTTON"]);

const IZIN_ATTR: Record<string, string[]> = {
  A: ["href", "target", "rel"],
  IMG: ["src", "alt", "width", "height"],
  FONT: ["color", "size"],
  TD: ["colspan", "rowspan"],
  TH: ["colspan", "rowspan"],
  TABLE: ["border"],
  "*": ["style", "align"],
};

const IZIN_STIL = [
  "color", "background-color", "background", "font-size", "font-weight",
  "font-style", "text-decoration", "text-align", "border", "padding",
];

function stiliTemizle(style: string): string {
  return style
    .split(";")
    .map(p => p.trim())
    .filter(Boolean)
    .filter(p => {
      const ad = p.split(":")[0]?.trim().toLowerCase();
      if (!ad || !IZIN_STIL.includes(ad)) return false;
      // url(...) / expression(...) / javascript: içeren değerleri at
      return !/url\s*\(|expression\s*\(|javascript:/i.test(p);
    })
    .join("; ");
}

function dugumuTemizle(node: Element): void {
  for (const el of Array.from(node.children)) {
    const tag = el.tagName.toUpperCase();

    if (TEHLIKELI.has(tag)) {
      el.remove();
      continue;
    }
    if (!IZIN_TAGLAR.has(tag)) {
      // Bilinmeyen etiket: kendisini kaldır ama içeriğini koru (unwrap)
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }

    const izinli = (IZIN_ATTR[tag] ?? []).concat(IZIN_ATTR["*"]);
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || !izinli.includes(name)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style") {
        const temiz = stiliTemizle(attr.value);
        if (temiz) el.setAttribute("style", temiz);
        else el.removeAttribute("style");
      }
    }

    if (tag === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }

    dugumuTemizle(el); // alt ağacı temizle
  }
}

/** Kirli HTML → güvenli HTML. Sunucuda (window yok) boş döner — RichTextView istemcide çağırır. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof window === "undefined" || typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  dugumuTemizle(doc.body);
  return doc.body.innerHTML;
}

/** HTML etiketlerini söküp düz metin döner (liste önizlemesi / SSR ilk render için güvenli). */
export function stripTags(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
