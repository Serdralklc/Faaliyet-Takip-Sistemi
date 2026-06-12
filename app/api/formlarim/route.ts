import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formWhere } from "@/lib/form-yonetimi";

export const dynamic = "force-dynamic";

/** GET — bana yayınlanmış formlar + yanıt durumum */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const where = formWhere(session.user);
  if (!where) return NextResponse.json([]);

  const formlar = await prisma.dinamikForm.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sorular: true } },
      yanitlar: { where: { userId: session.user.id }, select: { id: true, createdAt: true } },
    },
  });

  return NextResponse.json(
    formlar.map(f => ({
      id: f.id,
      baslik: f.baslik,
      aciklama: f.aciklama,
      soruSayisi: f._count.sorular,
      createdAt: f.createdAt,
      yanitlandi: f.yanitlar.length > 0,
      yanitTarihi: f.yanitlar[0]?.createdAt ?? null,
    }))
  );
}
