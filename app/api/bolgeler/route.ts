import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const bolgeler = await prisma.bolge.findMany({
    include: { iller: true },
    orderBy: { no: "asc" },
  });

  return NextResponse.json(bolgeler);
}
