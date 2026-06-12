import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getGonulluFromCookie } from "@/lib/gonullu-auth";
import { parseJson, zUzunMetin } from "@/lib/validation";

export const dynamic = "force-dynamic";


const geriBildirimSchema = z.object({
  konu: z.enum(["ONERI", "TALEP", "TEKNIK_SORUN", "DIGER"]),
  mesaj: zUzunMetin,
});

export async function GET() {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const list = await prisma.geriBildirim.findMany({
    where: { volunteerId: session.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, konu: true, mesaj: true, durum: true, createdAt: true },
  });

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getGonulluFromCookie();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, geriBildirimSchema);
  if ("error" in r) return r.error;
  const { konu, mesaj } = r.data;

  try {
    const fb = await prisma.geriBildirim.create({
      data: { volunteerId: session.id, konu, mesaj },
    });

    return NextResponse.json({ ok: true, id: fb.id }, { status: 201 });
  } catch (err) {
    console.error("[gonullu/geri-bildirim POST]", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
