import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { readPagination } from "@/lib/validation";


export const dynamic = "force-dynamic";


function isAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user) return false;
  return ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(session.user.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const il     = searchParams.get("il")      || undefined;
  const okul   = searchParams.get("okul")    || undefined;
  const ogrenim = searchParams.get("ogrenim") || undefined;

  const where = {
    ...(il      ? { il:      { contains: il,      mode: "insensitive" as const } } : {}),
    ...(okul    ? { okul:    { contains: okul,    mode: "insensitive" as const } } : {}),
    ...(ogrenim ? { ogrenim: ogrenim as never }                                    : {}),
  };

  const selectClause = {
    id: true, adSoyad: true, telefon: true, email: true,
    ogrenim: true, ogrenimTuru: true, okul: true, bolum: true, il: true, createdAt: true,
    _count: { select: { bursBasvurulari: true, geriBildirimler: true } },
  };

  const pag = readPagination(searchParams);

  if (!pag.paged) {
    // Geriye uyumlu mod: düz dizi, sert tavanlı
    const gonulluler = await prisma.volunteer.findMany({
      where,
      select: selectClause,
      orderBy: { createdAt: "desc" },
      take: pag.take,
    });
    return NextResponse.json(gonulluler);
  }

  const [gonulluler, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      select: selectClause,
      orderBy: { createdAt: "desc" },
      skip: pag.skip,
      take: pag.take,
    }),
    prisma.volunteer.count({ where }),
  ]);

  return NextResponse.json({ items: gonulluler, total, page: pag.page, limit: pag.limit });
}
