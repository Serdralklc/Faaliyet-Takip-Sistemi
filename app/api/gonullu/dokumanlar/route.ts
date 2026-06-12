import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";

export const dynamic = "force-dynamic";

/** Gönüllülere açık doküman ağacı (erisimGonullu=true olanlar) */
export async function GET(req: NextRequest) {
  const gonullu = await getGonulluFromCookie();
  if (!gonullu) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const klasorId = req.nextUrl.searchParams.get("klasorId") || null;

  const [klasorlar, dosyalar] = await Promise.all([
    prisma.dokumanKlasor.findMany({
      where: { parentId: klasorId, erisimGonullu: true },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, _count: { select: { children: true, dokumanlar: true } } },
    }),
    prisma.dokuman.findMany({
      where: { klasorId, erisimGonullu: true },
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, url: true, boyut: true, uzanti: true, createdAt: true },
    }),
  ]);

  const breadcrumb: { id: string; ad: string }[] = [];
  let cursor = klasorId;
  while (cursor) {
    const k = await prisma.dokumanKlasor.findUnique({ where: { id: cursor }, select: { id: true, ad: true, parentId: true, erisimGonullu: true } });
    if (!k || !k.erisimGonullu) break;
    breadcrumb.unshift({ id: k.id, ad: k.ad });
    cursor = k.parentId;
  }

  return NextResponse.json({ klasorlar, dosyalar, breadcrumb });
}
