import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ilId = searchParams.get("ilId");
  const bolgeId = searchParams.get("bolgeId");
  const yil = searchParams.get("yil");
  const donem = searchParams.get("donem");

  const { role, activeIlId, activeBolgeId } = session.user;

  // Yetki filtresi
  let ilFilter: string[] | undefined;

  if (role === "IL_SORUMLUSU") {
    if (!activeIlId) return NextResponse.json([]);
    ilFilter = [activeIlId];
  } else if (role === "BOLGE_SORUMLUSU") {
    if (!activeBolgeId) return NextResponse.json([]);
    const iller = await prisma.il.findMany({ where: { bolgeId: activeBolgeId } });
    ilFilter = iller.map((i) => i.id);
  }

  const where: Record<string, unknown> = {
    ...(ilId ? { ilId } : {}),
    ...(ilFilter ? { ilId: { in: ilFilter } } : {}),
    ...(yil ? { yil: Number(yil) } : {}),
    ...(donem ? { donem } : {}),
  };

  // Bölge filtresi
  if (bolgeId && !["IL_SORUMLUSU", "BOLGE_SORUMLUSU"].includes(role)) {
    const iller = await prisma.il.findMany({ where: { bolgeId } });
    where.ilId = { in: iller.map((i) => i.id) };
  }

  const single = searchParams.get("single") === "1";

  if (single) {
    const activity = await prisma.activity.findFirst({ where });
    return NextResponse.json(activity ?? null);
  }

  const activities = await prisma.activity.findMany({
    where,
    include: { il: { include: { bolge: true } } },
    orderBy: [{ yil: "desc" }, { donem: "asc" }],
  });

  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  if (!["IL_SORUMLUSU", "SISTEM_ADMIN", "GENEL_MERKEZ"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json();
  const { ilId, yil, donem, ...data } = body;

  // İl sorumlusu sadece kendi iline girebilir
  if (session.user.role === "IL_SORUMLUSU" && session.user.activeIlId !== ilId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const user = session.user;
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      assignments: {
        where: { status: "AKTIF" },
        take: 1,
        include: { bolge: true },
      },
    },
  });

  const activity = await prisma.activity.upsert({
    where: { ilId_yil_donem: { ilId, yil: Number(yil), donem } },
    update: {
      ...data,
      updatedById: user.id,
      updatedByName: `${user.ad} ${user.soyad}`,
    },
    create: {
      ilId,
      yil: Number(yil),
      donem,
      ...data,
      createdById: user.id,
      createdByName: `${user.ad} ${user.soyad}`,
      createdByRole: user.role,
      createdByIlId: userRecord?.assignments[0]?.ilId ?? null,
      createdByBolgeId: userRecord?.assignments[0]?.bolgeId ?? null,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: ACTIONS.ACTIVITY_CREATED,
    entity: "Activity",
    entityId: activity.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json(activity);
}
