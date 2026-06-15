import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { readPagination } from "@/lib/validation";
import { donemGirisDurum, egitimYazAlaniMi } from "@/lib/faaliyet-yapilandirma";

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

  const pag = readPagination(searchParams);

  const includeClause = { il: { include: { bolge: true } } };
  const orderByClause = [{ yil: "desc" as const }, { donem: "asc" as const }];

  if (!pag.paged) {
    // Geriye uyumlu mod: düz dizi, sert tavanlı
    const activities = await prisma.activity.findMany({
      where,
      include: includeClause,
      orderBy: orderByClause,
      take: pag.take,
    });
    return NextResponse.json(activities);
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: includeClause,
      orderBy: orderByClause,
      skip: pag.skip,
      take: pag.take,
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({ items: activities, total, page: pag.page, limit: pag.limit });
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

  // Arşivlenmiş dönem salt-okunur — veri korunur, değiştirilemez
  const mevcut = await prisma.activity.findUnique({
    where: { ilId_yil_donem: { ilId, yil: Number(yil), donem } },
    select: { arsivlendi: true },
  });
  if (mevcut?.arsivlendi) {
    return NextResponse.json(
      { error: "Bu dönem arşivlenmiş ve salt-okunurdur. Düzenlemek için önce arşivden çıkarılmalıdır." },
      { status: 409 }
    );
  }

  // Dönem kilidi: il eğitimcisi kapalı dönemde giremez/değiştiremez (admin/merkez muaf).
  if (session.user.role === "IL_SORUMLUSU") {
    const durum = await donemGirisDurum("EGITIMCI", Number(yil), donem);
    if (!durum.acik) {
      return NextResponse.json({ error: durum.sebep ?? "Bu dönemde veri girişi kapalıdır." }, { status: 403 });
    }
    // Yaz dönemi: Eğitim Birimi'nde yalnız İlköğretim alanları yazılır (diğerleri yok sayılır).
    if (donem === "YAZ_DONEMI") {
      for (const k of Object.keys(data)) {
        if (!egitimYazAlaniMi(k)) delete (data as Record<string, unknown>)[k];
      }
    }
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
