import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { formWhere, formSoruGorunur, cevapsizTip } from "@/lib/form-yonetimi";

export const dynamic = "force-dynamic";

/** GET — doldurulacak form (görünürlük kontrolü + mevcut yanıtım) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = formWhere(session.user);
  if (!where) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const form = await prisma.dinamikForm.findFirst({
    where: { id, ...where },
    include: { sorular: { orderBy: { sira: "asc" } } },
  });
  if (!form) return NextResponse.json({ error: "Form bulunamadı veya size açık değil." }, { status: 404 });

  const yanitim = await prisma.formYanit.findUnique({
    where: { formId_userId: { formId: id, userId: session.user.id } },
    select: { cevaplar: true, createdAt: true },
  });

  return NextResponse.json({ ...form, yanitim });
}

const cevapDeger = z.union([
  z.string().max(5000),
  z.number(),
  z.array(z.string().max(500)).max(50),
  z.object({ dosyaId: z.string(), ad: z.string().max(300), url: z.string().max(1000) }),
]);

const yanitSchema = z.object({ cevaplar: z.record(z.string(), cevapDeger) });

/** POST — formu yanıtla (tek yanıt; zorunlular sunucuda doğrulanır) */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = formWhere(session.user);
  if (!where) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { id } = await params;
  const form = await prisma.dinamikForm.findFirst({
    where: { id, ...where },
    include: { sorular: true },
  });
  if (!form) return NextResponse.json({ error: "Form bulunamadı veya size açık değil." }, { status: 404 });

  const r = await parseJson(req, yanitSchema);
  if ("error" in r) return r.error;
  const { cevaplar } = r.data;

  // Zorunlu alan kontrolü — bölüm başlıkları + koşulu sağlanmayan (gizli) sorular atlanır
  for (const soru of form.sorular) {
    if (cevapsizTip(soru.tip)) continue;
    if (!formSoruGorunur(soru, form.sorular, cevaplar)) continue;
    if (!soru.zorunlu) continue;
    const c = cevaplar[soru.id];
    const bos =
      c === undefined || c === null || c === "" ||
      (Array.isArray(c) && c.length === 0);
    if (bos) {
      return NextResponse.json({ error: `"${soru.etiket}" alanı zorunludur.` }, { status: 400 });
    }
  }

  // Bilinmeyen soru anahtarlarını at
  const soruIdler = new Set(form.sorular.map(s => s.id));
  const temiz = Object.fromEntries(Object.entries(cevaplar).filter(([k]) => soruIdler.has(k)));

  try {
    const yanit = await prisma.formYanit.create({
      data: {
        formId: id,
        userId: session.user.id,
        userName: `${session.user.ad} ${session.user.soyad}`,
        cevaplar: temiz,
      },
    });

    createAuditLog({
      userId: session.user.id,
      action: ACTIONS.FORM_ANSWERED,
      entity: "DinamikForm",
      entityId: id,
      description: `Form yanıtlandı: ${form.baslik}`,
    }).catch(console.error);

    return NextResponse.json({ ok: true, id: yanit.id }, { status: 201 });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Bu formu zaten yanıtladınız." }, { status: 409 });
    }
    throw e;
  }
}
