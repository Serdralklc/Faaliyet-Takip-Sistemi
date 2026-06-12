/** Yerel depolama sürücüsü duman testi — kaydet/oku/sil (geçici test, sonra silinir) */
import { saveFile, readLocalFile, deleteFile } from "../lib/storage";

async function main() {
  const icerik = Buffer.from("Türkçe içerik testi: ĞÜŞİÖÇ ğüşıöç — doküman merkezi duman testi");
  const saved = await saveFile(icerik, { fileName: "Test Dosyası (ğüşıöç).txt", contentType: "text/plain" });
  console.log("KAYDEDILDI:", saved.storageKey, "| url:", saved.url || "(local — /api/dosya/{id} sonradan)");

  const geri = await readLocalFile(saved.storageKey);
  console.log("OKUNDU:", geri ? `${geri.length} bayt, eşleşme=${geri.equals(icerik)}` : "BAŞARISIZ");

  await deleteFile(saved.storageKey);
  const silinmis = await readLocalFile(saved.storageKey);
  console.log("SILINDI:", silinmis === null ? "evet" : "HAYIR — dosya hâlâ var!");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
