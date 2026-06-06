import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Role } from "@/app/generated/prisma/client";

export { authOptions };

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(req?: NextRequest) {
  const session = await getSession();
  if (!session?.user) return null;
  return session.user;
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export const VIEWER_ROLES: Role[] = [
  "SISTEM_ADMIN",
  "GENEL_MERKEZ",
  "TURKIYE_SORUMLUSU",
  "BOLGE_SORUMLUSU",
  "IL_SORUMLUSU",
];

export const ADMIN_ROLES: Role[] = ["SISTEM_ADMIN", "GENEL_MERKEZ"];

export const ROLE_LABELS: Record<Role, string> = {
  SISTEM_ADMIN: "Sistem Admini",
  GENEL_MERKEZ: "Genel Merkez",
  TURKIYE_SORUMLUSU: "Türkiye Sorumlusu",
  BOLGE_SORUMLUSU: "Bölge Sorumlusu",
  IL_SORUMLUSU: "İl Sorumlusu",
  BEKLEYEN: "Bekleyen",
};
