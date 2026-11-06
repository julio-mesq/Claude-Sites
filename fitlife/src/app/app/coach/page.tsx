import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { aiHistory, aiStatus } from "@/server/ai/service";
import { db } from "@/server/db";
import { CoachChat } from "./coach-chat";

export const metadata: Metadata = { title: "Fit AI" };

export default async function CoachPage() {
  const user = await requireUser();
  const [status, history, pref] = await Promise.all([aiStatus(user.id), aiHistory(user.id), db.userPreference.findUnique({ where: { userId: user.id }, select: { aiUseHistory: true } })]);
  return <CoachChat firstName={user.name.split(" ")[0]!} status={status} useHistory={!!pref?.aiUseHistory} initial={history.map((m) => ({ id: m.id, role: m.role === "USER" ? "user" : "assistant", content: m.content }))} />;
}
