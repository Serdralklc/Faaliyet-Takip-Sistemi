import "server-only";
import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import type { AuthTokenType } from "@/app/generated/prisma/client";

/** Token geçerlilik süreleri (dakika) */
const TTL_MIN: Record<AuthTokenType, number> = {
  SIFRE_SIFIRLAMA_USER:       60,
  SIFRE_SIFIRLAMA_VOLUNTEER:  60,
  EPOSTA_DOGRULAMA_VOLUNTEER: 60 * 24 * 3, // 3 gün
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Yeni token üretir; aynı kişi+tip için önceki kullanılmamış token'ları siler.
 * Dönen ham token yalnızca e-posta linkine gömülür — DB'de hash'i saklanır.
 */
export async function createAuthToken(
  type: AuthTokenType,
  subject: { userId?: string; volunteerId?: string }
): Promise<string> {
  const raw = randomBytes(32).toString("hex");

  await prisma.authToken.deleteMany({
    where: {
      type,
      usedAt: null,
      ...(subject.userId ? { userId: subject.userId } : {}),
      ...(subject.volunteerId ? { volunteerId: subject.volunteerId } : {}),
    },
  });

  await prisma.authToken.create({
    data: {
      tokenHash:   sha256(raw),
      type,
      userId:      subject.userId ?? null,
      volunteerId: subject.volunteerId ?? null,
      expiresAt:   new Date(Date.now() + TTL_MIN[type] * 60_000),
    },
  });

  return raw;
}

/**
 * Ham token'ı doğrular ve tek kullanımlık olarak tüketir.
 * Geçersiz/süresi dolmuş/kullanılmış ise null döner.
 */
export async function consumeAuthToken(type: AuthTokenType, rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;
  const record = await prisma.authToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }
  await prisma.authToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record;
}
