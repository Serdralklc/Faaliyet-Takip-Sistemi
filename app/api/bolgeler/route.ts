import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // Kayıt sayfası için public erişime izin ver (sadece temel bilgiler)
  const { searchParams } = new URL(req.url);
  const publicAccess = searchParams.get("public") === "1";

  if (!publicAccess) {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const bolgeler = await prisma.bolge.findMany({
    include: { iller: { orderBy: { ad: "asc" }, select: { id: true, ad: true } } },
    orderBy: { no: "asc" },
  });

  return NextResponse.json(bolgeler);
}
