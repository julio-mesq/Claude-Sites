import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { listSessions } from "@/server/services/auth";
import { listBlocked } from "@/server/services/community";
import { SettingsApp } from "./settings-app";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [prefs, sessions, blocked] = await Promise.all([db.userPreference.findUnique({ where: { userId: user.id } }), listSessions(user.id, user.sessionId), listBlocked(user.id)]);
  return <SettingsApp prefs={JSON.parse(JSON.stringify(prefs))} sessions={JSON.parse(JSON.stringify(sessions))} blocked={blocked} />;
}
