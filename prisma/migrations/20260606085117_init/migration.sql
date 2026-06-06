-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SISTEM_ADMIN', 'GENEL_MERKEZ', 'TURKIYE_SORUMLUSU', 'BOLGE_SORUMLUSU', 'IL_SORUMLUSU', 'BEKLEYEN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('AKTIF', 'BEKLEMEDE', 'PASIF');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('AKTIF', 'TAMAMLANDI');

-- CreateEnum
CREATE TYPE "Donem" AS ENUM ('DONEM_1', 'DONEM_2', 'YAZ_DONEMI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BEKLEYEN',
    "status" "UserStatus" NOT NULL DEFAULT 'BEKLEMEDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bolge" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "ad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bolge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Il" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "bolgeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Il_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "bolgeId" TEXT,
    "ilId" TEXT,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'AKTIF',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "endedById" TEXT,
    "note" TEXT,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "bolgeId" TEXT,
    "ilId" TEXT,
    "invitedById" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "ilId" TEXT NOT NULL,
    "yil" INTEGER NOT NULL,
    "donem" "Donem" NOT NULL,
    "ik_toplamDergah" INTEGER NOT NULL DEFAULT 0,
    "ik_kursuYapilanDergah" INTEGER NOT NULL DEFAULT 0,
    "ik_egitmenSayisi" INTEGER NOT NULL DEFAULT 0,
    "ik_egitmenYardimciSayisi" INTEGER NOT NULL DEFAULT 0,
    "ik_elifBaOgrenci" INTEGER NOT NULL DEFAULT 0,
    "ik_kuranOgrenci" INTEGER NOT NULL DEFAULT 0,
    "ik_gecisOgrenci" INTEGER NOT NULL DEFAULT 0,
    "ls_toplamDergah" INTEGER NOT NULL DEFAULT 0,
    "ls_ilimDersYeri" INTEGER NOT NULL DEFAULT 0,
    "ls_ilimDersKatilim" INTEGER NOT NULL DEFAULT 0,
    "ls_sabahNamaziSayisi" INTEGER NOT NULL DEFAULT 0,
    "ls_sabahNamaziKatilim" INTEGER NOT NULL DEFAULT 0,
    "ls_kafileSayisi" INTEGER NOT NULL DEFAULT 0,
    "ls_kafileOgrenci" INTEGER NOT NULL DEFAULT 0,
    "ls_toplamFaaliyet" INTEGER NOT NULL DEFAULT 0,
    "ls_yeniIntisap" INTEGER NOT NULL DEFAULT 0,
    "uni_toplamDergah" INTEGER NOT NULL DEFAULT 0,
    "uni_ilimDersYeri" INTEGER NOT NULL DEFAULT 0,
    "uni_ilimDersKatilim" INTEGER NOT NULL DEFAULT 0,
    "uni_sabahNamaziSayisi" INTEGER NOT NULL DEFAULT 0,
    "uni_sabahNamaziKatilim" INTEGER NOT NULL DEFAULT 0,
    "uni_kafileSayisi" INTEGER NOT NULL DEFAULT 0,
    "uni_kafileOgrenci" INTEGER NOT NULL DEFAULT 0,
    "uni_toplamFaaliyet" INTEGER NOT NULL DEFAULT 0,
    "uni_kykBulusmaSayisi" INTEGER NOT NULL DEFAULT 0,
    "uni_kykKatilim" INTEGER NOT NULL DEFAULT 0,
    "uni_yeniIntisap" INTEGER NOT NULL DEFAULT 0,
    "eay_mevcutEv" INTEGER NOT NULL DEFAULT 0,
    "eay_mevcutApart" INTEGER NOT NULL DEFAULT 0,
    "eay_mevcutYurt" INTEGER NOT NULL DEFAULT 0,
    "eay_acilacakEv" INTEGER NOT NULL DEFAULT 0,
    "eay_acilacakApart" INTEGER NOT NULL DEFAULT 0,
    "eay_acilacakYurt" INTEGER NOT NULL DEFAULT 0,
    "eay_kapanacakEv" INTEGER NOT NULL DEFAULT 0,
    "eay_kapanacakApart" INTEGER NOT NULL DEFAULT 0,
    "eay_kapanacakYurt" INTEGER NOT NULL DEFAULT 0,
    "eay_bursBalan" INTEGER NOT NULL DEFAULT 0,
    "eay_iliskiKesme" INTEGER NOT NULL DEFAULT 0,
    "eay_toplamZiyaret" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdByRole" "Role" NOT NULL,
    "createdByIlId" TEXT,
    "createdByBolgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bolge_no_key" ON "Bolge"("no");

-- CreateIndex
CREATE INDEX "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "RoleAssignment_ilId_status_idx" ON "RoleAssignment"("ilId", "status");

-- CreateIndex
CREATE INDEX "RoleAssignment_bolgeId_status_idx" ON "RoleAssignment"("bolgeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Activity_ilId_idx" ON "Activity"("ilId");

-- CreateIndex
CREATE INDEX "Activity_yil_donem_idx" ON "Activity"("yil", "donem");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_ilId_yil_donem_key" ON "Activity"("ilId", "yil", "donem");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Il" ADD CONSTRAINT "Il_bolgeId_fkey" FOREIGN KEY ("bolgeId") REFERENCES "Bolge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_bolgeId_fkey" FOREIGN KEY ("bolgeId") REFERENCES "Bolge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_ilId_fkey" FOREIGN KEY ("ilId") REFERENCES "Il"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ilId_fkey" FOREIGN KEY ("ilId") REFERENCES "Il"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
