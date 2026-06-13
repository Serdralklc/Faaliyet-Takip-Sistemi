import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { talepKarsilayanMi } from "@/lib/istisare";
import type { TalepBirim } from "@/lib/istisare";

export const dynamic = "force-dynamic";

// GET: talep detayı + tüm mesajlar (kronolojik)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const { id: userId, role } = session.user;

  const talep = await prisma.talep.findUnique({
    where: { id },
    select: {
      id: true, baslik: true, birim: true, durum: true, sistem: true, createdAt: true,
      olusturanId: true,
      olusturan: { select: { ad: true, soyad: true, role: true, sistem: true } },
      mesajlar: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, mesaj: true, dosyalar: true, createdAt: true, gonderenId: true,
          gonderen: { select: { ad: true, soyad: true, role: true, merkezGorev: true, sistem: true } },
        },
      },
    },
  });
  if (!talep) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });

  // Erişim: oluşturan veya karşılayan taraf
  const erisim = talep.olusturanId === userId || talepKarsilayanMi(talep.birim as TalepBirim, role, session.user.yanRoller);
  if (!erisim) return NextResponse.json({ error: "Bu talebe erişiminiz yok" }, { status: 403 });

  return NextResponse.json(talep);
}
