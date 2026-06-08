-- Mevcut TURKIYE_SORUMLUSU rollerini sisteme göre yeni rollere dönüştür
-- Önce enum'a yeni değerleri ekle (Prisma bunu yapacak ama mevcut satırları güncellemek için önce ALTER gerekiyor)

-- 1. Yeni enum değerlerini ekle
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TURKIYE_EGITIM_SORUMLUSU';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TURKIYE_UNIVERSITE_SORUMLUSU';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TURKIYE_LISE_SORUMLUSU';

-- 2. Mevcut kullanıcıları sisteme göre güncelle
UPDATE "User"
SET role = CASE
  WHEN sistem = 'EGITIMCI'   THEN 'TURKIYE_EGITIM_SORUMLUSU'::"Role"
  WHEN sistem = 'UNIVERSITE' THEN 'TURKIYE_UNIVERSITE_SORUMLUSU'::"Role"
  WHEN sistem = 'LISE'       THEN 'TURKIYE_LISE_SORUMLUSU'::"Role"
  ELSE 'TURKIYE_EGITIM_SORUMLUSU'::"Role"
END
WHERE role = 'TURKIYE_SORUMLUSU';

-- Invitation ve RoleAssignment tablolarını da güncelle
UPDATE "Invitation"
SET role = 'TURKIYE_EGITIM_SORUMLUSU'::"Role"
WHERE role = 'TURKIYE_SORUMLUSU';

UPDATE "RoleAssignment"
SET role = 'TURKIYE_EGITIM_SORUMLUSU'::"Role"
WHERE role = 'TURKIYE_SORUMLUSU';
