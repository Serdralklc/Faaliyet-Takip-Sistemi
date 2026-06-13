import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST — pop-up'ı bu kullanıcı için "görüldü" işaretle (TEK_SEFER tekrar gösterilmesin) */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  await prisma.popupGorulme
    .upsert({
      where: { popupId_userId: { popupId: id, userId: session.user.id } },
      create: { popupId: id, userId: session.user.id },
      update: {},
    })
    .catch(() => {}); // pop-up silinmiş olabilir — sessizce geç

  return NextResponse.json({ ok: true });
}
