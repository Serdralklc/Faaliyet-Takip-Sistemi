import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🔍 Silinecek veriler kontrol ediliyor...\n");

  const adminList = await prisma.user.findMany({
    where: { role: "SISTEM_ADMIN" },
    select: { id: true, ad: true, soyad: true, email: true },
  });
  console.log("✅ KORUNACAK admin hesapları:");
  adminList.forEach(u => console.log(`   - ${u.ad} ${u.soyad} | ${u.email}`));

  const silinecekUsers = await prisma.user.findMany({
    where: { role: { not: "SISTEM_ADMIN" } },
    select: { id: true, ad: true, soyad: true, email: true, role: true },
  });
  console.log(`\n🗑  Silinecek kullanıcılar (${silinecekUsers.length} adet):`);
  silinecekUsers.forEach(u => console.log(`   - ${u.ad} ${u.soyad} | ${u.email} | ${u.role}`));

  const counts = {
    activity:        await prisma.activity.count(),
    roleAssignment:  await prisma.roleAssignment.count(),
    invitation:      await prisma.invitation.count(),
    auditLog:        await prisma.auditLog.count(),
    housingVisit:    await prisma.housingVisit.count(),
    housingStudent:  await prisma.housingStudent.count(),
    housingUnit:     await prisma.housingUnit.count(),
    ilHedef:         await prisma.ilHedef.count(),
    bolgeHedef:      await prisma.bolgeHedef.count(),
  };

  console.log("\n🗑  Silinecek veriler:");
  Object.entries(counts).forEach(([k, v]) => console.log(`   - ${k}: ${v} kayıt`));

  console.log("\n⚡ Silme işlemi başlıyor...\n");

  await prisma.housingVisit.deleteMany({});
  await prisma.housingStudent.deleteMany({});
  await prisma.housingUnit.deleteMany({});
  await prisma.ilHedef.deleteMany({});
  await prisma.bolgeHedef.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.roleAssignment.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.auditLog.deleteMany({});

  const deletedUsers = await prisma.user.deleteMany({
    where: { role: { not: "SISTEM_ADMIN" } },
  });

  console.log(`✅ ${deletedUsers.count} kullanıcı silindi`);
  console.log("✅ Tüm faaliyet, hedef, barınma, davet ve log verileri silindi");
  console.log("\n🎉 Sistem temizlendi. Admin hesabı ve coğrafi yapı korundu.");
}

main()
  .catch(e => { console.error("❌ Hata:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
