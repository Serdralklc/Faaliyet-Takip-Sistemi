import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";


export const dynamic = "force-dynamic";


function isAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user) return false;
  return ["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session.user.role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const il     = searchParams.get("il")      || undefined;
  const okul   = searchParams.get("okul")    || undefined;
  const ogrenim = searchParams.get("ogrenim") || undefined;

  const gonulluler = await prisma.volunteer.findMany({
    where: {
      ...(il      ? { il:      { contains: il,      mode: "insensitive" } } : {}),
      ...(okul    ? { okul:    { contains: okul,    mode: "insensitive" } } : {}),
      ...(ogrenim ? { ogrenim: ogrenim as never }                           : {}),
    },
    select: {
      id: true, adSoyad: true, telefon: true, email: true,
      ogrenim: true, ogrenimTuru: true, okul: true, bolum: true, il: true, createdAt: true,
      _count: { select: { bursBasvurulari: true, geriBildirimler: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gonulluler);
}
