import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { parseJson } from "@/lib/validation";
import { rolAtayabilir, ANA_ROLLER, ANA_ROL_LABEL } from "@/lib/constants";
import { syncRolCompat } from "@/lib/rol-sync";

// Ana rolü değiştirilebilen kullanıcıların mevcut rolleri (yönetim/merkez katmanı)
const MERKEZ_TIER = ["GENEL_MERKEZ", "TURKIYE_EGITIM_SORUMLUSU", "TURKIYE_UNIVERSITE_SORUMLUSU", "TURKIYE_LISE_SORUMLUSU", "TEKNIK"];

const bodySchema = z.object({ anaRol: z.enum(ANA_ROLLER.map(a => a.kod) as [string, ...string[]]) });

// POST: bir yönetim kullanıcısının ANA ROLÜNÜ değiştir (4 ana rol). Eski role/sistem/
// merkezGorev alanları syncRolCompat uyum köprüsü ile senkronlanır.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!rolAtayabilir(session.user.role, session.user.icerikYoneticisi)) {
    return NextResponse.json({ error: "Rol atama yetkiniz yok" }, { status: 403 });
  }

  const r = await parseJson(req, bodySchema);
  if ("error" in r) return r.error;
  const { anaRol } = r.data;

  const kullanici = await prisma.user.findUnique({
    where: { id },
    select: { role: true, ad: true, soyad: true, anaRol: { select: { kod: true } } },
  });
  if (!kullanici) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  // Yalnızca yönetim katmanı kullanıcılarının ana rolü değiştirilebilir (il/bölge değil)
  if (!MERKEZ_TIER.includes(kullanici.role)) {
    return NextResponse.json({ error: "Bu kullanıcının ana rolü buradan değiştirilemez" }, { status: 400 });
  }

  const hedef = await prisma.anaRol.findUnique({ where: { kod: anaRol }, select: { id: true } });
  if (!hedef) return NextResponse.json({ error: "Geçersiz ana rol" }, { status: 400 });

  await prisma.user.update({ where: { id }, data: { anaRolId: hedef.id } });
  await syncRolCompat(id); // role/sistem/merkezGorev/flags senkron

  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.ROLE_CHANGED,
    entity: "User",
    entityId: id,
    oldValue: { anaRol: kullanici.anaRol?.kod ?? null },
    newValue: { anaRol },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanici.ad} ${kullanici.soyad} — ana rol: ${ANA_ROL_LABEL[anaRol]}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
