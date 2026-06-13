import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { rolAtayabilir } from "@/lib/constants";
import type { Role, MerkezGorev, Sistem } from "@/app/generated/prisma/client";

// Atanabilir ANA ROLLER → {role, merkezGorev, sistem}
const ANA_ROL_MAP: Record<string, { role: Role; merkezGorev: MerkezGorev | null; sistem: Sistem }> = {
  MERKEZ_EKIP:     { role: "GENEL_MERKEZ",                merkezGorev: null,         sistem: "EGITIMCI" },
  ILKOGRETIM:      { role: "GENEL_MERKEZ",                merkezGorev: "ILKOGRETIM", sistem: "EGITIMCI" },
  LISE:            { role: "GENEL_MERKEZ",                merkezGorev: "LISE",       sistem: "EGITIMCI" },
  UNIVERSITE:      { role: "GENEL_MERKEZ",                merkezGorev: "UNIVERSITE", sistem: "EGITIMCI" },
  SEKRETERYA:      { role: "GENEL_MERKEZ",                merkezGorev: "SEKRETERYA", sistem: "EGITIMCI" },
  TR_UNI_GENCLIK:  { role: "TURKIYE_UNIVERSITE_SORUMLUSU", merkezGorev: null,        sistem: "UNIVERSITE" },
  TR_LISE_GENCLIK: { role: "TURKIYE_LISE_SORUMLUSU",       merkezGorev: null,        sistem: "LISE" },
  TR_EGITIM:       { role: "TURKIYE_EGITIM_SORUMLUSU",     merkezGorev: null,        sistem: "EGITIMCI" },
};

// Ana rolü değiştirilebilen kullanıcıların mevcut rolleri (merkez katmanı)
const MERKEZ_TIER = ["GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];

const bodySchema = z.object({ gorev: z.enum(Object.keys(ANA_ROL_MAP) as [string, ...string[]]) });

// POST: bir merkez-tier kullanıcısının ANA ROLÜNÜ değiştir
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!rolAtayabilir(session.user.role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Rol atama yetkiniz yok" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const hedef = ANA_ROL_MAP[r.data.gorev];

  const kullanici = await prisma.user.findUnique({
    where: { id },
    select: { role: true, ad: true, soyad: true, merkezGorev: true, sistem: true },
  });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Yalnızca merkez katmanı kullanıcılarının ana rolü değiştirilebilir (il/bölge/admin değil)
  if (!MERKEZ_TIER.includes(kullanici.role)) {
    return NextResponse.json({ error: "Bu kullanıcının ana rolü buradan değiştirilemez" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { role: hedef.role, merkezGorev: hedef.merkezGorev, sistem: hedef.sistem },
  });

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    oldValue: { role: kullanici.role, merkezGorev: kullanici.merkezGorev, sistem: kullanici.sistem },
    newValue: { role: hedef.role, merkezGorev: hedef.merkezGorev, sistem: hedef.sistem },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanici.ad} ${kullanici.soyad} — ana rol güncellendi (${r.data.gorev})`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
