import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson } from "@/lib/validation";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { dokumanaErisebilir } from "@/lib/dokuman-access";

const schema = z
  .object({
    klasorId: z.string().optional(),
    dokumanId: z.string().optional(),
    /** Gün cinsinden geçerlilik — verilmezse süresiz */
    gecerlilikGun: z.coerce.number().int().min(1).max(365).optional(),
  })
  .refine(d => !!d.klasorId !== !!d.dokumanId, "Klasör veya dosya seçilmeli (yalnızca biri).");

/** POST — paylaşım linki üret (yalnızca yönetici) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const { klasorId, dokumanId, gecerlilikGun } = r.data;

  // Paylaşım linkini, dosya/klasöre erişimi olan herkes oluşturabilir (görüntüle/indir/paylaş).
  const erisimSelect = { ad: true, erisimEgitim: true, erisimUniversite: true, erisimLise: true };
  let hedefAd = "";
  let erisebilir = false;
  if (klasorId) {
    const k = await prisma.dokumanKlasor.findUnique({ where: { id: klasorId }, select: erisimSelect });
    if (!k) return NextResponse.json({ error: "Klasör bulunamadı." }, { status: 404 });
    hedefAd = k.ad; erisebilir = dokumanaErisebilir(session.user, k);
  } else if (dokumanId) {
    const d = await prisma.dokuman.findUnique({ where: { id: dokumanId }, select: erisimSelect });
    if (!d) return NextResponse.json({ error: "Doküman bulunamadı." }, { status: 404 });
    hedefAd = d.ad; erisebilir = dokumanaErisebilir(session.user, d);
  }
  if (!erisebilir) return NextResponse.json({ error: "Bu öğeye erişiminiz yok." }, { status: 403 });

  const paylasim = await prisma.dokumanPaylasim.create({
    data: {
      token: randomBytes(16).toString("hex"),
      klasorId: klasorId ?? null,
      dokumanId: dokumanId ?? null,
      expiresAt: gecerlilikGun ? new Date(Date.now() + gecerlilikGun * 86_400_000) : null,
      createdById: session.user.id,
    },
  });

  createAuditLog({
    userId: session.user.id,
    action: ACTIONS.DOC_SHARED,
    entity: klasorId ? "DokumanKlasor" : "Dokuman",
    entityId: klasorId ?? dokumanId,
    description: `Paylaşım linki oluşturuldu: ${hedefAd}`,
  }).catch(console.error);

  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
  return NextResponse.json({ ok: true, url: `${base}/paylasim/${paylasim.token}`, expiresAt: paylasim.expiresAt }, { status: 201 });
}
