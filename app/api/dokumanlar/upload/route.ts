import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { canManageDocs } from "@/lib/dokuman-access";
import { saveFile, IZINLI_TIPLER, MAX_DOSYA_BOYUTU } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** POST multipart/form-data: file, klasorId?, erisim* ("1"/"0") — yalnızca yönetici */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  if (!canManageDocs(session.user.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form verisi." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });

  if (file.size > MAX_DOSYA_BOYUTU) {
    return NextResponse.json({ error: "Dosya 20 MB'tan büyük olamaz." }, { status: 400 });
  }
  const uzanti = IZINLI_TIPLER[file.type];
  if (!uzanti) {
    return NextResponse.json(
      { error: "Desteklenmeyen dosya türü. İzin verilenler: PDF, Word, Excel, PowerPoint ve görseller." },
      { status: 400 }
    );
  }

  const klasorId = (form.get("klasorId") as string) || null;
  if (klasorId) {
    const klasor = await prisma.dokumanKlasor.findUnique({ where: { id: klasorId }, select: { id: true } });
    if (!klasor) return NextResponse.json({ error: "Klasör bulunamadı." }, { status: 404 });
  }

  const flag = (k: string) => form.get(k) === "1";
  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveFile(buffer, { fileName: file.name, contentType: file.type });

  const dokuman = await prisma.dokuman.create({
    data: {
      ad: file.name,
      klasorId,
      url: saved.url, // local sürücüde boş — aşağıda set edilir
      storageKey: saved.storageKey,
      boyut: file.size,
      mimeTipi: file.type,
      uzanti,
      erisimEgitim: flag("erisimEgitim"),
      erisimUniversite: flag("erisimUniversite"),
      erisimLise: flag("erisimLise"),
      erisimGonullu: flag("erisimGonullu"),
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });

  let url = saved.url;
  if (!url) {
    url = `/api/dosya/${dokuman.id}`;
    await prisma.dokuman.update({ where: { id: dokuman.id }, data: { url } });
  }

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_UPLOADED,
    entity: "Dokuman",
    entityId: dokuman.id,
    newValue: { ad: file.name, boyut: file.size },
    description: `Doküman yüklendi: ${file.name}`,
  }).catch(console.error);

  return NextResponse.json({ ...dokuman, url }, { status: 201 });
}
