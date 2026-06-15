import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, ACTIONS } from "@/lib/audit";
import { bildirimKullanicilara } from "@/lib/bildirim";

export const dynamic = "force-dynamic";

// GET: oturum açan kullanıcının kendi profil bilgileri (telefon dahil)
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ad: true, soyad: true, email: true, telefon: true, role: true, sistem: true },
  });
  if (!u) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  return NextResponse.json(u);
}

// PATCH: telefon numarası güncelle
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const telefon: string = (body?.telefon ?? "").trim();

  // Basit format kontrolü: boş veya rakam/+/boşluk/tire
  if (telefon && !/^[\d\s+\-()]{7,20}$/.test(telefon)) {
    return NextResponse.json({ error: "Geçersiz telefon formatı." }, { status: 400 });
  }

  const eskiKayit = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ad: true, soyad: true, telefon: true },
  });
  if (!eskiKayit) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

  const eskiTelefon = eskiKayit.telefon ?? "";
  if (eskiTelefon === telefon) {
    return NextResponse.json({ success: true }); // değişiklik yok
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { telefon: telefon || null },
  });

  const kullanicıAd = `${eskiKayit.ad} ${eskiKayit.soyad}`;

  // Denetim logu
  await createAuditLog({
    userId: session.user.id,
    action: ACTIONS.PHONE_CHANGED,
    entity: "User",
    entityId: session.user.id,
    oldValue: { telefon: eskiTelefon || null },
    newValue: { telefon: telefon || null },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    description: `${kullanicıAd} telefon numarasını güncelledi: ${eskiTelefon || "(boş)"} → ${telefon || "(boş)"}`,
  });

  // Admin(ler)e bildirim
  const adminler = await prisma.user.findMany({
    where: { role: "SISTEM_ADMIN", status: "AKTIF" },
    select: { id: true },
  });
  if (adminler.length) {
    await bildirimKullanicilara({
      userIds: adminler.map(a => a.id),
      baslik: "Telefon Numarası Değiştirildi",
      mesaj: `${kullanicıAd} telefon numarasını güncelledi.${eskiTelefon ? ` Eski: ${eskiTelefon}` : ""} Yeni: ${telefon || "(silindi)"}`,
      tip: "BILGILENDIRME",
      link: "/panel/admin/kullanicilar",
      createdById: session.user.id,
      createdByName: kullanicıAd,
    });
  }

  return NextResponse.json({ success: true });
}
