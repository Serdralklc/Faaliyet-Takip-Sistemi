import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { rolAtayabilir } from "@/lib/constants";
import type { Role, MerkezGorev } from "@/app/generated/prisma/client";

// Atanabilir merkez görevleri → {role, merkezGorev}
const GOREV_MAP: Record<string, { role: Role; merkezGorev: MerkezGorev | null }> = {
  MERKEZ_EKIP: { role: "GENEL_MERKEZ", merkezGorev: null },
  ILKOGRETIM:  { role: "GENEL_MERKEZ", merkezGorev: "ILKOGRETIM" },
  LISE:        { role: "GENEL_MERKEZ", merkezGorev: "LISE" },
  UNIVERSITE:  { role: "GENEL_MERKEZ", merkezGorev: "UNIVERSITE" },
  SEKRETERYA:  { role: "GENEL_MERKEZ", merkezGorev: "SEKRETERYA" },
  TEKNIK:      { role: "TEKNIK",       merkezGorev: null },
};

const bodySchema = z.object({ gorev: z.enum(Object.keys(GOREV_MAP) as [string, ...string[]]) });

// POST: bir Merkez Ekip / Teknik kullanıcısının merkez görevini değiştir
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!rolAtayabilir(session.user.role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Rol atama yetkiniz yok" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const hedef = GOREV_MAP[r.data.gorev];

  const kullanici = await prisma.user.findUnique({
    where: { id },
    select: { role: true, ad: true, soyad: true, merkezGorev: true },
  });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Yalnızca merkez katmanı (Merkez Ekip / Teknik) kullanıcılarına görev atanır
  if (kullanici.role !== "GENEL_MERKEZ" && kullanici.role !== "TEKNIK") {
    return NextResponse.json({ error: "Bu kullanıcıya merkez görevi atanamaz" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { role: hedef.role, merkezGorev: hedef.merkezGorev } });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    oldValue: { role: kullanici.role, merkezGorev: kullanici.merkezGorev },
    newValue: { role: hedef.role, merkezGorev: hedef.merkezGorev },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanici.ad} ${kullanici.soyad} — merkez görevi güncellendi (${r.data.gorev})`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
