/**
 * Gönüllü JWT kimlik doğrulama yardımcıları
 * Cookie adı: gonullu-token
 * Payload: { id, adSoyad, telefon }
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "serhendi-gonullu-secret-key-2024"
);

const COOKIE_NAME = "gonullu-token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export interface GonulluPayload {
  id:      string;
  adSoyad: string;
  telefon: string;
}

/** JWT oluştur ve cookie'ye yaz */
export async function setGonulluCookie(payload: GonulluPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   MAX_AGE,
    path:     "/",
  });

  return token;
}

/** Cookie'yi sil */
export async function clearGonulluCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Cookie'den payload oku (server component / route handler) */
export async function getGonulluFromCookie(): Promise<GonulluPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as GonulluPayload;
  } catch {
    return null;
  }
}

/** NextRequest'ten doğrula (middleware / edge) */
export async function getGonulluFromRequest(req: NextRequest): Promise<GonulluPayload | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as GonulluPayload;
  } catch {
    return null;
  }
}
