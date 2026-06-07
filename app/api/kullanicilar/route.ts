import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { Role, Sistem } from "@/app/generated/prisma/client";

// GET: kullanıcı listesi
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { role } = session.user;
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status");
  const rolFilter = searchParams.get("role") as Role | null;

  // Session'dan sistem filtresi — SISTEM_ADMIN hangi karttan girdiyse o sistemi görür
  const sessionSistem = session.user.sistem as Sistem | undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(status      ? { status: status as never } : {}),
      ...(rolFilter   ? { role: rolFilter }         : {}),
      ...(sessionSistem ? { sistem: sessionSistem } : {}),
    },
    include: {
      assignments: {
        where: { status: "AKTIF" },
        include: { il: true, bolge: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // passwordHash'i boolean'a çevir (güvenlik için hash değerini döndürme)
  const safeUsers = users.map((u) => ({
    ...u,
    passwordHash: u.passwordHash ? "SET" : null,
  }));

  return NextResponse.json(safeUsers);
}

// POST: davet ile kullanıcı oluştur
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { role } = session.user;
  if (!["SISTEM_ADMIN", "GENEL_MERKEZ"].includes(role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json();
  const { ad, soyad, email, telefon, userRole, bolgeId, ilId } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [user, invitation] = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        ad, soyad, email, telefon,
        role:   userRole as Role,
        status: "AKTIF",
        sistem: (session.user.sistem as Sistem) ?? "EGITIMCI",
      },
    });

    const inv = await tx.invitation.create({
      data: {
        email,
        role: userRole as Role,
        bolgeId: bolgeId || null,
        ilId: ilId || null,
        invitedById: session.user.id,
        expiresAt,
      },
    });

    if (bolgeId || ilId) {
      await tx.roleAssignment.create({
        data: {
          userId: newUser.id,
          role: userRole as Role,
          bolgeId: bolgeId || null,
          ilId: ilId || null,
        },
      });
    }

    return [newUser, inv];
  });

  await sendInvitationEmail(email, `${ad} ${soyad}`, invitation.token);

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.USER_INVITED,
    entity: "User",
    entityId: user.id,
    newValue: { email, role: userRole },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${ad} ${soyad} davet edildi`,
  });

  return NextResponse.json({ success: true, userId: user.id });
}
