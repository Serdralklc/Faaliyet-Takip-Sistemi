"use client";

/**
 * Kurumsal rapor dışa aktarma — PDF / Excel / Word.
 *
 * Tüm çıktılar ortak şablonu kullanır: logo, marka yeşili başlık bandı,
 * rapor başlığı, tarih ve düzenli tablo. Kütüphaneler (jspdf, exceljs, docx)
 * dynamic import ile yalnızca butona basılınca yüklenir.
 *
 * PDF'te Türkçe karakterler için /fonts/Roboto-Regular.ttf + Bold gömülür
 * (jsPDF'in varsayılan fontları ğışöüç harflerini bozar).
 */

const BRAND_GREEN = "#0B6B3A";
const BRAND_GREEN_RGB: [number, number, number] = [11, 107, 58];

export interface ExportColumn {
  header: string;
  key: string;
  /** Excel sütun genişliği (karakter) — verilmezse içerikten hesaplanır */
  width?: number;
}

export interface ExportSpec {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Record<string, string | number | null | undefined>[];
  /** Uzantısız dosya adı — verilmezse başlıktan üretilir */
  fileName?: string;
}

function bugun(): string {
  return new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function dosyaAdi(spec: ExportSpec): string {
  const base = spec.fileName ?? spec.title;
  const tarih = new Date().toISOString().slice(0, 10);
  return `${base.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-")}-${tarih}`;
}

function hucre(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  return typeof v === "number" ? v.toLocaleString("tr-TR") : String(v);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ── Logo: SVG → PNG (canvas ile rasterize, modül içinde cache'lenir) ── */
let logoPngCache: { dataUrl: string; bytes: Uint8Array } | null = null;

async function logoPng(): Promise<{ dataUrl: string; bytes: Uint8Array } | null> {
  if (logoPngCache) return logoPngCache;
  try {
    const svgText = await fetch("/logo.svg").then(r => r.text());
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Koyu zeminlerde de görünsün diye beyaz yuvarlak zemin
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, size * 0.14, size * 0.14, size * 0.72, size * 0.72);
    URL.revokeObjectURL(url);
    const dataUrl = canvas.toDataURL("image/png");
    const bin = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    logoPngCache = { dataUrl, bytes };
    return logoPngCache;
  } catch {
    return null; // logo yüklenemezse çıktı logosuz devam eder
  }
}

/* ── PDF font: TTF → base64 (modül içinde cache'lenir) ── */
const fontCache: Record<string, string> = {};

async function fontBase64(path: string): Promise<string> {
  if (fontCache[path]) return fontCache[path];
  const buf = await fetch(path).then(r => {
    if (!r.ok) throw new Error(`Font yüklenemedi: ${path}`);
    return r.arrayBuffer();
  });
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  fontCache[path] = btoa(bin);
  return fontCache[path];
}

/* ══════════════════════ PDF ══════════════════════ */
export async function exportPdf(spec: ExportSpec): Promise<void> {
  const [{ jsPDF }, autoTableMod, logo, fontReg, fontBold] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    logoPng(),
    fontBase64("/fonts/Roboto-Regular.ttf"),
    fontBase64("/fonts/Roboto-Bold.ttf"),
  ]);
  const autoTable = autoTableMod.default;

  const landscape = spec.columns.length > 6;
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });

  doc.addFileToVFS("Roboto-Regular.ttf", fontReg);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", fontBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  const pageW = doc.internal.pageSize.getWidth();
  const totalPagesExp = "{total_pages_count_string}";

  // Başlık bandı
  const bandH = 24;
  doc.setFillColor(...BRAND_GREEN_RGB);
  doc.rect(0, 0, pageW, bandH, "F");
  if (logo) doc.addImage(logo.dataUrl, "PNG", 8, 4.5, 15, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.text(spec.title, logo ? 27 : 10, spec.subtitle ? 11 : 14);
  if (spec.subtitle) {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(spec.subtitle, logo ? 27 : 10, 17.5);
  }
  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.text(bugun(), pageW - 8, 11, { align: "right" });
  doc.setFontSize(8);
  doc.text("Serhendi Gençlik — Faaliyet Takip Sistemi", pageW - 8, 16.5, { align: "right" });

  autoTable(doc, {
    startY: bandH + 6,
    head: [spec.columns.map(c => c.header)],
    body: spec.rows.map(r => spec.columns.map(c => hucre(r[c.key]))),
    styles: { font: "Roboto", fontSize: 8.5, cellPadding: 2.2, textColor: [31, 41, 55] },
    headStyles: { font: "Roboto", fontStyle: "bold", fillColor: BRAND_GREEN_RGB, textColor: [255, 255, 255], fontSize: 8.5 },
    alternateRowStyles: { fillColor: [244, 247, 245] },
    margin: { left: 8, right: 8 },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Sayfa ${doc.getCurrentPageInfo().pageNumber} / ${totalPagesExp}`,
        pageW - 8, pageH - 6, { align: "right" }
      );
      doc.text(`${spec.rows.length} kayıt`, 8, pageH - 6);
    },
  });

  doc.putTotalPages(totalPagesExp);
  doc.save(`${dosyaAdi(spec)}.pdf`);
}

/* ══════════════════════ EXCEL ══════════════════════ */
export async function exportExcel(spec: ExportSpec): Promise<void> {
  const [ExcelJS, logo] = await Promise.all([import("exceljs"), logoPng()]);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Serhendi Gençlik — Faaliyet Takip Sistemi";
  const ws = wb.addWorksheet(spec.title.slice(0, 31), { views: [{ state: "frozen", ySplit: 4 }] });

  const colCount = spec.columns.length;
  const lastCol = ws.getColumn(colCount).letter;

  // Satır 1-2: başlık bandı
  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value = `  ${spec.title}`;
  titleCell.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B6B3A" } };
  titleCell.alignment = { vertical: "middle" };
  ws.getRow(1).height = 34;

  ws.mergeCells(`A2:${lastCol}2`);
  const subCell = ws.getCell("A2");
  subCell.value = `  ${spec.subtitle ? spec.subtitle + "  •  " : ""}${bugun()}  •  ${spec.rows.length} kayıt`;
  subCell.font = { size: 10, italic: true, color: { argb: "FF64748B" } };
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 6;

  if (logo) {
    const imgId = wb.addImage({ base64: logo.dataUrl, extension: "png" });
    ws.addImage(imgId, { tl: { col: 0.05, row: 0.08 }, ext: { width: 30, height: 30 } });
  }

  // Satır 4: tablo başlıkları
  const headRow = ws.getRow(4);
  spec.columns.forEach((c, i) => {
    const cell = headRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B6B3A" } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF064E2A" } } };
  });
  headRow.height = 20;

  // Veri satırları
  spec.rows.forEach((r, ri) => {
    const row = ws.getRow(5 + ri);
    spec.columns.forEach((c, ci) => {
      const cell = row.getCell(ci + 1);
      const v = r[c.key];
      cell.value = v === null || v === undefined || v === "" ? "—" : (v as string | number);
      cell.font = { size: 10 };
      if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F7F5" } };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
      if (typeof v === "number") cell.alignment = { horizontal: "right" };
    });
  });

  // Sütun genişlikleri
  spec.columns.forEach((c, i) => {
    if (c.width) {
      ws.getColumn(i + 1).width = c.width;
      return;
    }
    const maxLen = Math.max(c.header.length, ...spec.rows.slice(0, 200).map(r => hucre(r[c.key]).length));
    ws.getColumn(i + 1).width = Math.min(40, Math.max(10, maxLen + 3));
  });

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${dosyaAdi(spec)}.xlsx`
  );
}

/* ══════════════════════ WORD ══════════════════════ */
export async function exportWord(spec: ExportSpec): Promise<void> {
  const [docx, logo] = await Promise.all([import("docx"), logoPng()]);
  const {
    Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, ShadingType,
  } = docx;

  const headerCells = spec.columns.map(c =>
    new TableCell({
      shading: { type: ShadingType.SOLID, fill: "0B6B3A" },
      children: [new Paragraph({ children: [new TextRun({ text: c.header, bold: true, color: "FFFFFF", size: 18 })] })],
    })
  );

  const dataRows = spec.rows.map((r, ri) =>
    new TableRow({
      children: spec.columns.map(c =>
        new TableCell({
          shading: ri % 2 === 1 ? { type: ShadingType.SOLID, fill: "F4F7F5" } : undefined,
          children: [new Paragraph({ children: [new TextRun({ text: hucre(r[c.key]), size: 18 })] })],
        })
      ),
    })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          ...(logo
            ? [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ type: "png", data: logo.bytes, transformation: { width: 52, height: 52 } })],
              })]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({ text: spec.title, bold: true, size: 32, color: "0B6B3A" })],
          }),
          ...(spec.subtitle
            ? [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: spec.subtitle, size: 20, color: "475569" })],
              })]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: `${bugun()}  •  ${spec.rows.length} kayıt  •  Serhendi Gençlik — Faaliyet Takip Sistemi`, size: 16, color: "64748B", italics: true })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
              left: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
              right: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
            },
            rows: [new TableRow({ tableHeader: true, children: headerCells }), ...dataRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${dosyaAdi(spec)}.docx`);
}
