import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET — form yanıtları (yönetici, sonuç ekranı) */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || !YONETICI_ROLLERI.includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const form = await prisma.dinamikForm.findUnique({
    where: { id },
    include: {
      sorular: { orderBy: { sira: "asc" } },
      yanitlar: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!form) return NextResponse.json({ error: "Form bulunamadı." }, { status: 404 });

  // ── Hedef kitle (formun rol + sistem bayraklarına göre) ──
  const roller: Role[] = [
    ...(form.hedefBolge ? (["BOLGE_SORUMLUSU"] as Role[]) : []),
    ...(form.hedefIl ? (["IL_SORUMLUSU"] as Role[]) : []),
  ];
  const sistemler = [
    ...(form.sistemEgitim ? (["EGITIMCI"] as const) : []),
    ...(form.sistemUniversite ? (["UNIVERSITE"] as const) : []),
    ...(form.sistemLise ? (["LISE"] as const) : []),
  ];

  const hedefKitle =
    roller.length > 0 && sistemler.length > 0
      ? await prisma.user.findMany({
          where: { role: { in: roller }, sistem: { in: [...sistemler] }, status: "AKTIF" },
          select: {
            id: true,
            ad: true,
            soyad: true,
            email: true,
            sistem: true,
            role: true,
            assignments: {
              where: { status: "AKTIF" },
              take: 1,
              include: {
                il: { select: { ad: true } },
                bolge: { select: { ad: true } },
              },
            },
          },
        })
      : [];

  // ── Yanıtlamayanlar = hedef kitle − yanıt verenler ──
  const yanitlayanIds = new Set(form.yanitlar.map(y => y.userId));
  const yanitlamayanlar = hedefKitle
    .filter(u => !yanitlayanIds.has(u.id))
    .map(u => {
      const a = u.assignments[0];
      const konum = a?.il?.ad || a?.bolge?.ad || "—";
      return {
        id: u.id,
        adSoyad: `${u.ad} ${u.soyad}`,
        email: u.email,
        sistem: u.sistem,
        konum,
      };
    });

  return NextResponse.json({ ...form, yanitlamayanlar, hedefToplam: hedefKitle.length });
}
