import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listMissions } from "@/server/services/routine";
import { refreshMissions } from "@/server/services/gamification";
import { MissionsApp } from "./missions-app";

export const metadata: Metadata = { title: "Mission Mode" };

export default async function MissionsPage() {
  const user = await requireUser();
  await refreshMissions(user.id);
  const data = await listMissions(user.id);
  return <MissionsApp data={JSON.parse(JSON.stringify(data))} />;
}
