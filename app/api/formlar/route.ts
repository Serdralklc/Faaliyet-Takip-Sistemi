import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { formSchema } from "@/lib/form-yonetimi";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { YONETICI_ROLLERI } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** GET — tüm formlar (yönetici) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const formlar = await prisma.dinamikForm.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { yanitlar: true, sorular: true } } },
  });
  return NextResponse.json(formlar);
}

/** POST — yeni form (taslak olarak oluşur) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, formSchema);
  if ("error" in r) return r.error;
  const { sorular, ...meta } = r.data;

  const form = await prisma.dinamikForm.create({
    data: {
      ...meta,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
      sorular: { create: sorular.map((s, i) => ({ ...s, sira: i })) },
    },
    include: { sorular: { orderBy: { sira: "asc" } } },
  });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.FORM_CREATED,
    entity: "DinamikForm",
    entityId: form.id,
    description: `Form oluşturuldu: ${form.baslik}`,
  }).catch(console.error);

  return NextResponse.json(form, { status: 201 });
}
