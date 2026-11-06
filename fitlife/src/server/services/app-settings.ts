import "server-only";
import { db } from "../db";

type Settings = { signupEnabled: boolean; communityEnabled: boolean; maintenanceMessage: string };
let cache: { at: number; value: Settings } | null = null;

/** Configurações globais definidas no painel administrativo (cache de 30s por instância). */
export async function appSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const rows = await db.appSetting.findMany();
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const value = {
    signupEnabled: m.get("signup.enabled") !== false,
    communityEnabled: m.get("community.enabled") !== false,
    maintenanceMessage: typeof m.get("maintenance.message") === "string" ? (m.get("maintenance.message") as string) : "",
  };
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateAppSettings() {
  cache = null;
}
