import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ROLE_LABELS, ADMIN_ROLES, VIEWER_ROLES } from "./constants";
import type { Role } from "./constants";

export { authOptions, ROLE_LABELS, ADMIN_ROLES, VIEWER_ROLES };
export type { Role };

export async function getSession() {
  return await getServerSession(authOptions);
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
