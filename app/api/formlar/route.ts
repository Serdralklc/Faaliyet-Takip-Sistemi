import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { formSchema, formYonetimWhere, formSistemKisiti, formDuzenleyebilir } from "@/lib/form-yonetimi";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { YONETICI_ROLLERI, formYonetimiYanRol } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** Form Yönetimi erişimi — sayfa gating'i ile birebir: Merkez Ekip yalnız Form yan rolüyle. */
function formYetkili(user: { role: string; yanRoller: string[] }) {
  if (!isAdmin(user.role)) return false;
  if (user.role === "GENEL_MERKEZ" && !formYonetimiYanRol(user.yanRoller)) return false;
  return true;
}

/** GET — formlar (yönetici). Üni/Lise Gençlik sorumlusu yalnız kendi sistemini görür. */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !formYetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const where = formYonetimWhere(session.user);
  const formlar = await prisma.dinamikForm.findMany({
    where: where ?? undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { yanitlar: true, sorular: true } } },
  });
  // Her forma "düzenlenebilir" bayrağı (sahibi olmadığı formu sistem sorumlusu düzenleyemez)
  const cevap = formlar.map((f) => ({ ...f, duzenlenebilir: formDuzenleyebilir(session.user, f) }));
  return NextResponse.json(cevap);
}

/** POST — yeni form (taslak olarak oluşur) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !formYetkili(session.user)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const r = await parseJson(req, formSchema);
  if ("error" in r) return r.error;
  const { sorular, ...meta } = r.data;

  // Üni/Lise Gençlik sorumlusu: sistem yalnız kendi sistemine zorlanır (diğerleri kapalı)
  const kisit = formSistemKisiti(session.user);
  const metaSon = kisit ? { ...meta, ...kisit } : meta;

  const form = await prisma.dinamikForm.create({
    data: {
      ...metaSon,
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
