import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSessionUser } from "./session";
import { hasRole } from "../permissions";

/** Garante usuário autenticado em Server Components; redireciona caso contrário. */
export async function requireUser(opts: { onboarded?: boolean } = { onboarded: true }) {
  const user = await getSessionUser();
  if (!user) redirect("/session-expired");
  if (opts.onboarded !== false && !user.onboardedAt) redirect("/onboarding");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (!hasRole(user.role, role)) redirect("/app?denied=1");
  return user;
}
