import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { Role, Sistem } from "@/app/generated/prisma/client";
import { rolAtayabilir } from "@/lib/constants";
import {
  parseJson,
  readPagination,
  zAdSoyad,
  zEmail,
  zKisaMetinOptional,
  zTelefonOptional,
} from "@/lib/validation";

// GET: kullanıcı listesi
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { role, sistem: userSistem } = session.user;
  const YETKILI = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  if (!YETKILI.includes(role)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status");
  const rolFilter = searchParams.get("role") as Role | null;
  const sistemParam = searchParams.get("sistem") as Sistem | null;

  const isSuperAdmin = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU"].includes(role);

  const SISTEM_KISITLI = ["TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  // Sistem kısıtlı roller yalnızca kendi sistemini sorgulayabilir
  const effectiveSistem = SISTEM_KISITLI.includes(role)
    ? (userSistem as Sistem)
    : sistemParam;

  // YONETICI sekmesi: admin rollere sahip kullanıcılar (sistem filtresi yok)
  const YONETICI_ROLLERI: Role[] = ["SISTEM_ADMIN", "GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU"];
  const YONETICI_BASVURU_GOREVLER = ["TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "GENEL_MERKEZ"];

  let whereClause: Record<string, unknown> = {};

  if ((effectiveSistem as string) === "YONETICI") {
    if (status === "BEKLEMEDE") {
      // Bekleyenler: BEKLEYEN rolü + basvuruGorev yönetici görevi olanlar
      whereClause = {
        role: "BEKLEYEN",
        status: "BEKLEMEDE",
        basvuruGorev: { in: YONETICI_BASVURU_GOREVLER },
      };
    } else {
      // Aktifler: yönetici rollerinden biri
      whereClause = {
        role: { in: YONETICI_ROLLERI },
        status: "AKTIF",
      };
    }
  } else {
    const sistemFilter = effectiveSistem
      ? { sistem: effectiveSistem }
      : isSuperAdmin ? {} : { sistem: session.user.sistem as Sistem };

    whereClause = {
      ...sistemFilter,
      // Yönetici rolleri normal sistem sekmelerinde görünmez
      role: { notIn: YONETICI_ROLLERI as Role[] },
      // Bekleyenler içinde yönetici görevi başvuranlar normal sekmelerde gözükmez
      ...(status === "BEKLEMEDE"
        ? { basvuruGorev: { notIn: YONETICI_BASVURU_GOREVLER } }
        : {}),
      ...(status    ? { status: status as never } : {}),
      ...(rolFilter ? { role: rolFilter }         : {}),
    };
  }

  const pag = readPagination(searchParams);

  const includeClause = {
    assignments: {
      where: { status: "AKTIF" as const },
      include: { il: true, bolge: true },
      take: 1,
    },
    anaRol: { select: { kod: true } },
    yanRoller: { select: { yanRol: { select: { kod: true } } } },
  };
  const orderByClause = { createdAt: "desc" as const };

  // passwordHash'i boolean'a çevir + ana/yan rol kodlarını düzleştir
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toSafe = (u: any) => ({
    ...u,
    passwordHash: u.passwordHash ? "SET" : null,
    anaRolKod: u.anaRol?.kod ?? null,
    yanRolKods: (u.yanRoller ?? []).map((r: { yanRol: { kod: string } }) => r.yanRol.kod),
    anaRol: undefined,
    yanRoller: undefined,
  });

  if (!pag.paged) {
    // Geriye uyumlu mod: düz dizi, sert tavanlı
    const users = await prisma.user.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: orderByClause,
      take: pag.take,
    });
    return NextResponse.json(users.map(toSafe));
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: orderByClause,
      skip: pag.skip,
      take: pag.take,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return NextResponse.json({
    items: users.map(toSafe),
    total,
    page: pag.page,
    limit: pag.limit,
  });
}

// POST: davet ile kullanıcı oluştur
const inviteSchema = z.object({
  ad: zAdSoyad,
  soyad: zAdSoyad,
  email: zEmail,
  telefon: zTelefonOptional,
  userRole: z.enum(Role),
  bolgeId: zKisaMetinOptional,
  ilId: zKisaMetinOptional,
  sistem: z.enum(Sistem).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { role } = session.user;
  if (!rolAtayabilir(role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Kullanıcı davet etme (rol atama) yetkiniz yok" }, { status: 403 });
  }

  const r = await parseJson(req, inviteSchema);
  if ("error" in r) return r.error;
  const { ad, soyad, email, telefon, userRole, bolgeId, ilId, sistem } = r.data;

  // Admin rolü davetle atanamaz (yalnızca veritabanından).
  if (userRole === "SISTEM_ADMIN") {
    return NextResponse.json({ error: "Admin rolü atanamaz." }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [user, invitation] = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        ad, soyad, email,
        telefon: telefon || null,
        role:   userRole,
        status: "AKTIF",
        sistem: sistem ?? (session.user.sistem as Sistem) ?? "EGITIMCI",
      },
    });

    const inv = await tx.invitation.create({
      data: {
        email,
        role: userRole,
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
          role: userRole,
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
