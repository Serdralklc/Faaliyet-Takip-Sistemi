import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseJson, zKisaMetin, zUzunMetin } from "@/lib/validation";
import { createAuditLog } from "@/lib/audit";
import { sendBildirimEmail } from "@/lib/mail";
import { YONETICI_ROLLERI, rolSistemi } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

const EPOSTA_TAVANI = 300; // tek gönderimde en fazla e-posta

function isAdmin(role?: string) {
  return !!role && YONETICI_ROLLERI.includes(role as Role);
}

/** Bildirim Merkezi erişimi — sayfa gating'i ile birebir: Merkez Ekip yalnız İçerik Yöneticisi yetkisiyle. */
function bildirimYetkili(user: { role: string; icerikYoneticisi: boolean }) {
  if (!isAdmin(user.role)) return false;
  if (user.role === "GENEL_MERKEZ" && !user.icerikYoneticisi) return false;
  return true;
}

/** GET — gönderilen bildirimler + görülme istatistiği (yönetici) */
export async function GET() {
  const session = await getSession();
  if (!session?.user || !bildirimYetkili(session.user)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const bildirimler = await prisma.bildirim.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { alimlar: true } } },
  });
  const gorulenler = await prisma.bildirimAlim.groupBy({
    by: ["bildirimId"],
    where: { goruldu: { not: null } },
    _count: { _all: true },
  });
  const gorulenMap = new Map(gorulenler.map(g => [g.bildirimId, g._count._all]));

  return NextResponse.json(
    bildirimler.map(b => ({ ...b, aliciSayisi: b._count.alimlar, gorulenSayisi: gorulenMap.get(b.id) ?? 0 }))
  );
}

const schema = z
  .object({
    baslik: zKisaMetin,
    mesaj: zUzunMetin,
    tip: z.enum(["DUYURU", "BILGILENDIRME", "DOSYA", "FORM"]).optional().default("DUYURU"),
    link: z.string().trim().max(500).optional(),
    hedefBolge: z.boolean().optional().default(false),
    hedefIl: z.boolean().optional().default(false),
    hedefGonullu: z.boolean().optional().default(false),
    sistemEgitim: z.boolean().optional().default(false),
    sistemUniversite: z.boolean().optional().default(false),
    sistemLise: z.boolean().optional().default(false),
    kanalEposta: z.boolean().optional().default(false),
  })
  .refine(d => d.hedefBolge || d.hedefIl || d.hedefGonullu, "En az bir hedef kitle seçin.")
  .refine(
    d => d.hedefGonullu || (!d.hedefBolge && !d.hedefIl) || d.sistemEgitim || d.sistemUniversite || d.sistemLise,
    "Bölge/il sorumluları için en az bir sistem seçin."
  );

/** POST — bildirim oluştur + alıcılara dağıt (+ opsiyonel e-posta) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || !bildirimYetkili(session.user)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const r = await parseJson(req, schema);
  if ("error" in r) return r.error;
  const d = r.data;

  // Sistem-kısıtlı sorumlu (Merkez Üni/Lise Gençlik Sorumlusu): yalnız kendi sistemine.
  // Gönüllü ve diğer sistemler sunucuda zorla engellenir (client'a güvenilmez).
  const kisit = rolSistemi(session.user.role);
  if (kisit) {
    d.hedefGonullu = false;
    d.sistemEgitim = false;
    d.sistemUniversite = kisit === "UNIVERSITE";
    d.sistemLise = kisit === "LISE";
    if (!d.hedefBolge && !d.hedefIl) {
      return NextResponse.json({ error: "En az bir hedef kitle seçin." }, { status: 400 });
    }
  }

  // Alıcıları çöz
  const sistemler = [
    ...(d.sistemEgitim ? ["EGITIMCI"] : []),
    ...(d.sistemUniversite ? ["UNIVERSITE"] : []),
    ...(d.sistemLise ? ["LISE"] : []),
  ];
  const rolKosullari = [
    ...(d.hedefBolge && sistemler.length ? [{ role: "BOLGE_SORUMLUSU" as const, sistem: { in: sistemler as never } }] : []),
    ...(d.hedefIl && sistemler.length ? [{ role: "IL_SORUMLUSU" as const, sistem: { in: sistemler as never } }] : []),
  ];

  const [users, volunteers] = await Promise.all([
    rolKosullari.length
      ? prisma.user.findMany({ where: { status: "AKTIF", OR: rolKosullari }, select: { id: true, ad: true, soyad: true, email: true } })
      : Promise.resolve([]),
    d.hedefGonullu
      ? prisma.volunteer.findMany({ select: { id: true, adSoyad: true, email: true } })
      : Promise.resolve([]),
  ]);

  if (users.length + volunteers.length === 0) {
    return NextResponse.json({ error: "Seçilen kitlede hiç alıcı bulunamadı." }, { status: 400 });
  }

  const bildirim = await prisma.bildirim.create({
    data: {
      baslik: d.baslik,
      mesaj: d.mesaj,
      tip: d.tip,
      link: d.link || null,
      hedefBolge: d.hedefBolge,
      hedefIl: d.hedefIl,
      hedefGonullu: d.hedefGonullu,
      sistemEgitim: d.sistemEgitim,
      sistemUniversite: d.sistemUniversite,
      sistemLise: d.sistemLise,
      kanalEposta: d.kanalEposta,
      createdById: session.user.id,
      createdByName: `${session.user.ad} ${session.user.soyad}`,
    },
  });

  await prisma.bildirimAlim.createMany({
    data: [
      ...users.map(u => ({ bildirimId: bildirim.id, userId: u.id, aliciAd: `${u.ad} ${u.soyad}` })),
      ...volunteers.map(v => ({ bildirimId: bildirim.id, volunteerId: v.id, aliciAd: v.adSoyad })),
    ],
  });

  // E-posta kanalı — başarısızlık gönderimi engellemez
  let epostaGonderilen = 0;
  if (d.kanalEposta) {
    const epostalar = [
      ...users.filter(u => u.email).map(u => ({ email: u.email!, ad: `${u.ad} ${u.soyad}` })),
      ...volunteers.filter(v => v.email).map(v => ({ email: v.email!, ad: v.adSoyad })),
    ].slice(0, EPOSTA_TAVANI);

    const sonuc = await Promise.allSettled(
      epostalar.map(e => sendBildirimEmail(e.email, e.ad, d.baslik, d.mesaj))
    );
    epostaGonderilen = sonuc.filter(s => s.status === "fulfilled").length;
    await prisma.bildirim.update({ where: { id: bildirim.id }, data: { epostaGonderilen } });
  }

  createAuditLog({
    userId: session.user.id,
    action: "BILDIRIM_GONDERILDI",
    entity: "Bildirim",
    entityId: bildirim.id,
    description: `Bildirim gönderildi: ${d.baslik} (${users.length + volunteers.length} alıcı${d.kanalEposta ? `, ${epostaGonderilen} e-posta` : ""})`,
  }).catch(console.error);

  return NextResponse.json(
    { ok: true, id: bildirim.id, aliciSayisi: users.length + volunteers.length, epostaGonderilen },
    { status: 201 }
  );
}
