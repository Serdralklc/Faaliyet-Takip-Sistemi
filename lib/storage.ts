import "server-only";
import { randomBytes } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

/**
 * Dosya depolama soyutlaması.
 *
 * - BLOB_READ_WRITE_TOKEN tanımlıysa Vercel Blob kullanılır (production).
 * - Değilse proje kökündeki .uploads/ klasörüne yazılır (yalnızca geliştirme —
 *   Vercel'de kalıcı disk yoktur). Yerel dosyalar /api/dosya/{id} üzerinden,
 *   erişim kontrolünden geçirilerek servis edilir.
 *
 * Sağlayıcı değiştirmek (ör. Cloudflare R2) yalnızca bu dosyayı değiştirmek demektir.
 */

const LOCAL_DIR = path.join(process.cwd(), ".uploads");

export const isBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

export interface SavedFile {
  /** İndirme URL'i — blob'da mutlak URL, yerelde /api/dosya/{id} ile değiştirilir */
  url: string;
  /** Silme/okuma anahtarı */
  storageKey: string;
}

function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-80);
}

export async function saveFile(
  buffer: Buffer,
  opts: { fileName: string; contentType: string }
): Promise<SavedFile> {
  const key = `dokumanlar/${randomBytes(8).toString("hex")}-${safeName(opts.fileName)}`;

  if (isBlobConfigured) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, buffer, {
      access: "public",
      contentType: opts.contentType,
      addRandomSuffix: false,
    });
    return { url: blob.url, storageKey: blob.pathname };
  }

  const localName = key.replace("dokumanlar/", "");
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, localName), buffer);
  // URL, kayıt oluşturulduktan sonra /api/dosya/{dokumanId} olarak set edilir
  return { url: "", storageKey: `local:${localName}` };
}

export async function deleteFile(storageKey: string): Promise<void> {
  try {
    if (storageKey.startsWith("local:")) {
      await unlink(path.join(LOCAL_DIR, storageKey.slice(6)));
    } else {
      const { del } = await import("@vercel/blob");
      await del(storageKey);
    }
  } catch (e) {
    // Depolamada zaten yoksa kaydın silinmesini engelleme
    console.error("Dosya silinemedi:", storageKey, e);
  }
}

/** Yalnızca yerel sürücü — /api/dosya route'u için */
export async function readLocalFile(storageKey: string): Promise<Buffer | null> {
  if (!storageKey.startsWith("local:")) return null;
  try {
    return await readFile(path.join(LOCAL_DIR, storageKey.slice(6)));
  } catch {
    return null;
  }
}

/** İzin verilen dosya türleri (kullanıcı talebi: PDF, Word, Excel, PowerPoint, görseller) */
export const IZINLI_TIPLER: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export const MAX_DOSYA_BOYUTU = 20 * 1024 * 1024; // 20 MB
