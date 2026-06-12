import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** POST multipart — form yanıtı için dosya yükleme (bölge/il sorumluları) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!["BOLGE_SORUMLUSU", "IL_SORUMLUSU"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  if (file.size > MAX_DOSYA_BOYUTU) return NextResponse.json({ error: "Dosya 20 MB'tan büyük olamaz." }, { status: 400 });
  if (!IZINLI_TIPLER[file.type]) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü (PDF, Word, Excel, PowerPoint, görsel)." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, { fileName: file.name, contentType: file.type });

  const kayit = await prisma.formYanitDosya.create({
    data: {
      ad: file.name,
      storageKey: saved.storageKey,
      url: saved.url,
      mimeTipi: file.type,
      boyut: file.size,
      yukleyenId: session.user.id,
    },
  });

  let url = saved.url;
  if (!url) {
    url = `/api/form-dosya/${kayit.id}`;
    await prisma.formYanitDosya.update({ where: { id: kayit.id }, data: { url } });
  }

  return NextResponse.json({ dosyaId: kayit.id, ad: kayit.ad, url }, { status: 201 });
}
