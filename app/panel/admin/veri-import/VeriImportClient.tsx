"use client";

import { useRef, useState } from "react";
import { Button, Select, useToast } from "@/components/ui";
import { FileSpreadsheet, Download, Upload, TriangleAlert, CircleCheck } from "lucide-react";

// ── Alan tanımları (Activity modelindeki 45 sayısal alan) ──────────────
interface FieldDef { key: string; label: string }

const FIELD_GROUPS: { grup: string; alanlar: FieldDef[] }[] = [
  {
    grup: "İlköğretim",
    alanlar: [
      { key: "ik_toplamDergah",          label: "Toplam Dergah Sayısı" },
      { key: "ik_kursuYapilanDergah",    label: "Hafta Sonu Kursu Yapılan Dergah" },
      { key: "ik_egitmenSayisi",         label: "Eğitmen Sayısı" },
      { key: "ik_egitmenYardimciSayisi", label: "Eğitmen Yardımcısı Sayısı" },
      { key: "ik_elifBaOgrenci",         label: "Elif Ba'dan Başlayan Öğrenci" },
      { key: "ik_kuranOgrenci",          label: "Kuran-ı Kerim'den Başlayan Öğrenci" },
      { key: "ik_gecisOgrenci",          label: "Elif Ba'dan Kuran'a Geçen Öğrenci" },
    ],
  },
  {
    grup: "Lise",
    alanlar: [
      { key: "ls_toplamDergah",       label: "Toplam Dergah Sayısı" },
      { key: "ls_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı" },
      { key: "ls_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci" },
      { key: "ls_sabahNamaziSayisi",  label: "Sabah Namazı Buluşma Sayısı" },
      { key: "ls_sabahNamaziKatilim", label: "Sabah Namazına Katılan Öğrenci" },
      { key: "ls_kafileSayisi",       label: "Kafile Sayısı" },
      { key: "ls_kafileOgrenci",      label: "Kafile ile Giden Öğrenci" },
      { key: "ls_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı" },
      { key: "ls_yeniIntisap",        label: "Yeni İntisap Sayısı" },
    ],
  },
  {
    grup: "Üniversite",
    alanlar: [
      { key: "uni_toplamDergah",       label: "Toplam Dergah Sayısı" },
      { key: "uni_ilimDersYeri",       label: "İlim Dersleri Yapılan Yer Sayısı" },
      { key: "uni_ilimDersKatilim",    label: "İlim Derslerine Katılan Öğrenci" },
      { key: "uni_sabahNamaziSayisi",  label: "Sabah Namazı Buluşma Sayısı" },
      { key: "uni_sabahNamaziKatilim", label: "Sabah Namazına Katılan Öğrenci" },
      { key: "uni_kafileSayisi",       label: "Kafile Sayısı" },
      { key: "uni_kafileOgrenci",      label: "Kafile ile Giden Öğrenci" },
      { key: "uni_toplamFaaliyet",     label: "Toplam Faaliyet Sayısı" },
      { key: "uni_kykBulusmaSayisi",   label: "KYK Buluşma Sayısı" },
      { key: "uni_kykKatilim",         label: "KYK Buluşmalarına Katılan Öğrenci" },
      { key: "uni_yeniIntisap",        label: "Yeni İntisap Sayısı" },
    ],
  },
  {
    grup: "Ortak Faaliyet",
    alanlar: [
      { key: "ortakKafileSayisi",           label: "Ortak Kafile Sayısı" },
      { key: "ortakKafileLiseKatilim",      label: "Kafileye Katılan Liseli Öğrenci" },
      { key: "ortakKafileUniKatilim",       label: "Kafileye Katılan Üniversiteli Öğrenci" },
      { key: "ortakSabahNamaziSayisi",      label: "Ortak Sabah Namazı Buluşma Sayısı" },
      { key: "ortakSabahNamaziLiseKatilim", label: "Sabah Namazına Katılan Liseli" },
      { key: "ortakSabahNamaziUniKatilim",  label: "Sabah Namazına Katılan Üniversiteli" },
    ],
  },
  {
    grup: "Ev/Apart/Yurt",
    alanlar: [
      { key: "eay_mevcutEv",       label: "Mevcut Ev Sayısı" },
      { key: "eay_mevcutApart",    label: "Mevcut Apart Sayısı" },
      { key: "eay_mevcutYurt",     label: "Mevcut Yurt Sayısı" },
      { key: "eay_acilacakEv",     label: "Açılacak Ev" },
      { key: "eay_acilacakApart",  label: "Açılacak Apart" },
      { key: "eay_acilacakYurt",   label: "Açılacak Yurt" },
      { key: "eay_kapanacakEv",    label: "Kapanacak Ev" },
      { key: "eay_kapanacakApart", label: "Kapanacak Apart" },
      { key: "eay_kapanacakYurt",  label: "Kapanacak Yurt" },
      { key: "eay_bursBalan",      label: "Burs Alan Sayısı" },
      { key: "eay_iliskiKesme",    label: "İlişki Kesme Talebi" },
      { key: "eay_toplamZiyaret",  label: "Toplam Ziyaret Sayısı" },
    ],
  },
];

const ALL_FIELDS: (FieldDef & { grup: string })[] = FIELD_GROUPS.flatMap((g) =>
  g.alanlar.map((a) => ({ ...a, grup: g.grup }))
);
const FIELD_KEY_SET = new Set(ALL_FIELDS.map((f) => f.key));
const LABEL_BY_KEY = new Map(ALL_FIELDS.map((f) => [f.key, f.label]));

const DONEMLER = [
  { value: "DONEM_1",    label: "1. Dönem" },
  { value: "DONEM_2",    label: "2. Dönem" },
  { value: "YAZ_DONEMI", label: "Yaz Dönemi" },
] as const;

const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR + 1, THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const MARKA_YESILI = "FF0B6B3A";

// ── Tipler ──────────────────────────────────────────────────────────────
interface IlOption { id: string; ad: string; bolgeAd: string }

interface ParsedRow { il: string; veriler: Record<string, number> }

interface ParseResult {
  dosyaAdi: string;
  rows: ParsedRow[];
  taninanKolon: number;
  doluHucre: number;
  eslesenIl: number;
  bilinmeyenIller: string[];
}

interface ImportSonuc { guncellenen: number; hatalar: string[] }

const trLower = (s: string) => s.toLocaleLowerCase("tr-TR");

export default function VeriImportClient({ iller }: { iller: IlOption[] }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [yil, setYil] = useState(THIS_YEAR);
  const [donem, setDonem] = useState<string>("DONEM_1");
  const [sablonLoading, setSablonLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [sonuc, setSonuc] = useState<ImportSonuc | null>(null);

  const donemLabel = DONEMLER.find((d) => d.value === donem)?.label ?? donem;

  // ── 1) Şablon üret ve indir ───────────────────────────────────────────
  async function handleSablonIndir() {
    setSablonLoading(true);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Faaliyet Verileri");

      // Satır 1 — insan-okur başlıklar (marka yeşili dolgu, beyaz bold)
      const headerRow = ws.getRow(1);
      headerRow.getCell(1).value = "il";
      ALL_FIELDS.forEach((f, i) => {
        headerRow.getCell(i + 2).value = `${f.grup} — ${f.label}`;
      });
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MARKA_YESILI } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      });
      headerRow.height = 40;

      // Satır 2 — teknik anahtarlar (import bu satırı okur)
      const keyRow = ws.getRow(2);
      keyRow.getCell(1).value = "(bu satırı silmeyin)";
      ALL_FIELDS.forEach((f, i) => {
        keyRow.getCell(i + 2).value = f.key;
      });
      keyRow.eachCell((cell) => {
        cell.font = { italic: true, size: 9, color: { argb: "FF6B7280" } };
      });

      // Satır 3+ — 81 il adı hazır, metrik hücreleri boş
      iller.forEach((il, idx) => {
        const row = ws.getRow(3 + idx);
        row.getCell(1).value = il.ad;
        row.getCell(1).font = { bold: true, size: 10 };
      });

      // Kolon genişlikleri + ilk kolon ve ilk 2 satır sabit
      ws.getColumn(1).width = 22;
      for (let i = 0; i < ALL_FIELDS.length; i++) ws.getColumn(i + 2).width = 26;
      ws.views = [{ state: "frozen", xSplit: 1, ySplit: 2 }];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faaliyet-sablon-${yil}-${donem}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ type: "success", title: "Şablon indirildi", message: `${yil} / ${donemLabel} için doldurup yükleyin.` });
    } catch {
      toast({ type: "error", title: "Şablon oluşturulamadı" });
    } finally {
      setSablonLoading(false);
    }
  }

  // ── 2) Dosyayı oku ve önizle ──────────────────────────────────────────
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    if (!file) return;

    setParsing(true);
    setSonuc(null);
    try {
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error("Dosyada çalışma sayfası bulunamadı.");

      // Satır 2'deki teknik anahtarlardan kolon haritası çıkar
      const keyByCol = new Map<number, string>();
      ws.getRow(2).eachCell((cell, colNumber) => {
        if (colNumber === 1) return;
        const key = (cell.text || "").trim();
        if (FIELD_KEY_SET.has(key)) keyByCol.set(colNumber, key);
      });
      if (keyByCol.size === 0) {
        throw new Error("2. satırda teknik alan anahtarları bulunamadı. Lütfen 'Şablon İndir' ile alınan dosyayı kullanın.");
      }

      const rows: ParsedRow[] = [];
      let doluHucre = 0;
      ws.eachRow((row, rowNumber) => {
        if (rowNumber < 3) return; // 1: başlık, 2: anahtarlar
        const ilAd = (row.getCell(1).text || "").trim();
        if (!ilAd) return;

        const veriler: Record<string, number> = {};
        keyByCol.forEach((key, col) => {
          const cell = row.getCell(col);
          const raw = cell.value;
          if (raw === null || raw === undefined || raw === "") return;
          const num = typeof raw === "number" ? raw : Number((cell.text || "").trim());
          if (!Number.isFinite(num)) return;
          veriler[key] = Math.max(0, Math.round(num));
          doluHucre++;
        });

        if (Object.keys(veriler).length === 0) return; // tamamen boş satır
        rows.push({ il: ilAd, veriler });
      });

      const bilinenIller = new Set(iller.map((i) => trLower(i.ad)));
      const bilinmeyenIller = [...new Set(
        rows.filter((r) => !bilinenIller.has(trLower(r.il))).map((r) => r.il)
      )];
      const eslesenIl = rows.length - rows.filter((r) => !bilinenIller.has(trLower(r.il))).length;

      setParsed({
        dosyaAdi: file.name,
        rows,
        taninanKolon: keyByCol.size,
        doluHucre,
        eslesenIl,
        bilinmeyenIller,
      });

      if (rows.length === 0) {
        toast({ type: "warning", title: "Dosyada veri bulunamadı", message: "Metrik hücreleri boş görünüyor." });
      }
    } catch (err) {
      setParsed(null);
      toast({
        type: "error",
        title: "Dosya okunamadı",
        message: err instanceof Error ? err.message : "Geçerli bir .xlsx dosyası seçin.",
      });
    } finally {
      setParsing(false);
    }
  }

  // ── 3) İçe aktar ──────────────────────────────────────────────────────
  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    if (parsed.rows.length > 100) {
      toast({ type: "error", title: "Satır limiti aşıldı", message: "Tek seferde en fazla 100 satır aktarılabilir." });
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/faaliyetler/toplu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yil,
          donem,
          rows: parsed.rows.map((r) => ({ il: r.il, ...r.veriler })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "İçe aktarma başarısız oldu.");

      const guncellenen: number = json.guncellenen ?? 0;
      const hatalar: string[] = json.hatalar ?? [];
      setSonuc({ guncellenen, hatalar });

      toast({
        type: hatalar.length > 0 ? "warning" : "success",
        title: `${guncellenen} il güncellendi`,
        message: hatalar.length > 0
          ? `${hatalar.length} hata oluştu — ayrıntılar aşağıda.`
          : `${yil} / ${donemLabel} verileri kaydedildi.`,
      });
    } catch (err) {
      toast({
        type: "error",
        title: "İçe aktarma başarısız",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setImporting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  const ADIMLAR = [
    { no: 1, baslik: "Şablon", aciklama: "Dönemi seçip Excel şablonunu indirin" },
    { no: 2, baslik: "Doldur", aciklama: "İl satırlarındaki metrik hücrelerini doldurun" },
    { no: 3, baslik: "Yükle",  aciklama: "Dosyayı yükleyin, önizleyin ve içe aktarın" },
  ];

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-active)", color: "var(--accent)" }}>
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Excel Veri Aktarımı
          </h1>
          <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            81 ilin faaliyet verilerini tek dosyayla toplu olarak içe aktarın
          </p>
        </div>
      </div>

      {/* Adım rehber şeridi */}
      <div className="sv-section">
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10">
          {ADIMLAR.map((a) => (
            <div key={a.no} className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-bold text-white flex-shrink-0"
                style={{ background: "var(--green-primary)" }}>
                {a.no}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {a.baslik}
                </p>
                <p className="text-[11.5px] leading-tight mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {a.aciklama}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 1 — Dönem seçimi + şablon indirme */}
      <div className="sv-section">
        <div className="sv-section-header">
          <h2>1. Dönem Seçimi ve Şablon</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:w-40">
            <Select label="Yıl" value={yil} onChange={(e) => setYil(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select label="Dönem" value={donem} onChange={(e) => setDonem(e.target.value)}>
              {DONEMLER.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
          </div>
          <Button onClick={handleSablonIndir} loading={sablonLoading} variant="outline">
            {!sablonLoading && <Download size={15} />}
            Şablon İndir
          </Button>
        </div>
        <div className="px-6 pb-5 -mt-2">
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Şablonda 1. satır okunaklı başlıkları, 2. satır teknik alan anahtarlarını içerir
            (2. satırı silmeyin — içe aktarma bu satırı kullanır). İl adları hazır yazılıdır,
            yalnızca sayısal hücreleri doldurun. Boş bırakılan hücreler güncellenmez.
          </p>
        </div>
      </div>

      {/* 2 — Dosya yükleme + önizleme */}
      <div className="sv-section">
        <div className="sv-section-header">
          <h2>2. Dosya Yükleme ve Önizleme</h2>
          {parsed && (
            <span className="text-[12px] font-semibold truncate max-w-[220px]" style={{ color: "var(--text-muted)" }}>
              {parsed.dosyaAdi}
            </span>
          )}
        </div>
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFile}
            />
            <Button onClick={() => fileInputRef.current?.click()} loading={parsing} variant="secondary">
              {!parsing && <Upload size={15} />}
              Excel Dosyası Seç (.xlsx)
            </Button>
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Hedef dönem: <strong style={{ color: "var(--text-primary)" }}>{yil} / {donemLabel}</strong>
            </span>
          </div>

          {parsed && (
            <>
              {/* Özet kutuları */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { deger: parsed.rows.length,        etiket: "Veri içeren satır" },
                  { deger: parsed.eslesenIl,          etiket: "Eşleşen il" },
                  { deger: parsed.bilinmeyenIller.length, etiket: "Bilinmeyen il", uyari: parsed.bilinmeyenIller.length > 0 },
                  { deger: parsed.doluHucre,          etiket: "Dolu hücre" },
                ].map((k) => (
                  <div key={k.etiket} className="rounded-xl border px-4 py-3"
                    style={{ borderColor: "var(--border)", background: "var(--bg-hover)" }}>
                    <p className="text-lg font-bold leading-tight"
                      style={{ color: k.uyari ? "#DC2626" : "var(--text-primary)" }}>
                      {k.deger}
                    </p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>{k.etiket}</p>
                  </div>
                ))}
              </div>

              {/* Bilinmeyen iller uyarısı */}
              {parsed.bilinmeyenIller.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border px-4 py-3"
                  style={{ borderColor: "rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.06)" }}>
                  <TriangleAlert size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#DC2626" }} />
                  <div className="text-[12.5px]" style={{ color: "var(--text-primary)" }}>
                    <p className="font-bold" style={{ color: "#DC2626" }}>
                      Sistemde bulunamayan il adları (bu satırlar atlanır):
                    </p>
                    <p className="mt-1">{parsed.bilinmeyenIller.join(", ")}</p>
                  </div>
                </div>
              )}

              {/* İlk 10 satır önizleme */}
              {parsed.rows.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr style={{ background: "var(--bg-hover)" }}>
                          {["İl", "Dolu Alan", "Örnek Değerler", "Durum"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                              style={{ color: "var(--text-muted)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.rows.slice(0, 10).map((r, i) => {
                          const bilinmiyor = parsed.bilinmeyenIller.includes(r.il);
                          const ornekler = Object.entries(r.veriler).slice(0, 3)
                            .map(([k, v]) => `${LABEL_BY_KEY.get(k) ?? k}: ${v}`)
                            .join(" · ");
                          return (
                            <tr key={`${r.il}-${i}`} className="border-t" style={{ borderColor: "var(--border)" }}>
                              <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                                {r.il}
                              </td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-primary)" }}>
                                {Object.keys(r.veriler).length}
                              </td>
                              <td className="px-4 py-2.5 max-w-[380px] truncate" style={{ color: "var(--text-muted)" }}>
                                {ornekler}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                {bilinmiyor ? (
                                  <span className="inline-flex items-center gap-1 text-[11.5px] font-bold" style={{ color: "#DC2626" }}>
                                    <TriangleAlert size={13} /> Bilinmeyen il
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11.5px] font-bold" style={{ color: "var(--accent)" }}>
                                    <CircleCheck size={13} /> Eşleşti
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {parsed.rows.length > 10 && (
                    <p className="px-4 py-2 text-[11.5px] border-t"
                      style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      … ve {parsed.rows.length - 10} satır daha
                    </p>
                  )}
                </div>
              )}

              {/* İçe aktar */}
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={handleImport} loading={importing} disabled={parsed.rows.length === 0}>
                  {!importing && <FileSpreadsheet size={15} />}
                  İçe Aktar ({parsed.eslesenIl} il — {yil} / {donemLabel})
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3 — Sonuç */}
      {sonuc && (
        <div className="sv-section">
          <div className="sv-section-header">
            <h2>3. Aktarım Sonucu</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <CircleCheck size={18} style={{ color: "var(--green-primary)" }} />
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {sonuc.guncellenen} il güncellendi
                {sonuc.hatalar.length > 0 && (
                  <span style={{ color: "#DC2626" }}> · {sonuc.hatalar.length} hata</span>
                )}
              </p>
            </div>
            {sonuc.hatalar.length > 0 && (
              <ul className="space-y-1.5 rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.06)" }}>
                {sonuc.hatalar.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: "var(--text-primary)" }}>
                    <TriangleAlert size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#DC2626" }} />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
