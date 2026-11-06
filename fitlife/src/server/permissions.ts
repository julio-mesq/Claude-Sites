import type { Plan, Role } from "@prisma/client";

/** Hierarquia de papéis. Verificada SEMPRE no servidor. */
const RANK: Record<Role, number> = { USER: 0, PROFESSIONAL: 1, MODERATOR: 2, ADMIN: 3 };

export type Permission =
  | "admin:access"
  | "admin:users"
  | "admin:content"
  | "admin:settings"
  | "admin:logs"
  | "moderation:act";

const MATRIX: Record<Permission, Role> = {
  "admin:access": "MODERATOR",
  "moderation:act": "MODERATOR",
  "admin:content": "ADMIN",
  "admin:users": "ADMIN",
  "admin:settings": "ADMIN",
  "admin:logs": "ADMIN",
};

export function hasRole(role: Role, min: Role) {
  return RANK[role] >= RANK[min];
}

export function can(role: Role, permission: Permission) {
  return hasRole(role, MATRIX[permission]);
}

export const PLAN_LIMITS: Record<Plan, { aiMessagesPerDay: number; advancedReports: boolean; maxCustomWorkouts: number; maxHabits: number; photoStorageMb: number }> = {
  FREE: { aiMessagesPerDay: 10, advancedReports: false, maxCustomWorkouts: 8, maxHabits: 6, photoStorageMb: 50 },
  PRO: { aiMessagesPerDay: 100, advancedReports: true, maxCustomWorkouts: 50, maxHabits: 25, photoStorageMb: 500 },
  ELITE: { aiMessagesPerDay: 400, advancedReports: true, maxCustomWorkouts: 500, maxHabits: 100, photoStorageMb: 5000 },
};
