/** İstemci tarafı biçimlendirme yardımcıları */

/**
 * Telefonu yazarken maskeler: "05551234567" → "0555 123 45 67".
 * Yapıştırılan +90'lı değerleri de toparlar.
 */
export function maskPhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("90") && d.length > 10) d = d.slice(2);
  if (d.length > 0 && d[0] !== "0") d = "0" + d;
  d = d.slice(0, 11);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 4));
  if (d.length > 4) parts.push(d.slice(4, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  if (d.length > 9) parts.push(d.slice(9, 11));
  return parts.join(" ");
}

/** Maskeyi söker: "0555 123 45 67" → "05551234567" */
export function unmaskPhone(masked: string): string {
  return masked.replace(/\D/g, "");
}

export function formatDateTR(value: string | Date): string {
  return new Date(value).toLocaleDateString("tr-TR");
}
