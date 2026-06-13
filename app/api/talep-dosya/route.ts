import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";
import { TALEP_OLUSTURAN_ROLLERI, TALEP_PANEL_ROLLERI } from "@/lib/istisare";

export const dynamic = "force-dynamic";

// POST multipart — İstişare talebi için dosya yükleme (oluşturan + karşılayan taraf)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (![...TALEP_OLUSTURAN_ROLLERI, ...TALEP_PANEL_ROLLERI].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 }); }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (file.size > MAX_DOSYA_BOYUTU) return NextResponse.json({ error: "Dosya 20 MB'tan büyük olamaz." }, { status: 400 });
  if (!IZINLI_TIPLER[file.type]) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü (PDF, Word, Excel, PowerPoint, görsel)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, { fileName: file.name, contentType: file.type });

  // Blob varsa public url; yoksa yerel servis route'u
  const url = saved.url ?? `/api/talep-dosya/serve?key=${encodeURIComponent(saved.storageKey)}&ad=${encodeURIComponent(file.name)}`;

  return NextResponse.json({ ad: file.name, url }, { status: 201 });
}
