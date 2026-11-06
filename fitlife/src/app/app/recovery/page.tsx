import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { recoveryOverview } from "@/server/services/routine";
import { dateKey } from "@/lib/utils";
import { RecoveryApp } from "./recovery-app";

export const metadata: Metadata = { title: "Smart Recovery" };

export default async function RecoveryPage() {
  const user = await requireUser();
  const data = await recoveryOverview(user.id);
  return <RecoveryApp data={JSON.parse(JSON.stringify(data))} today={dateKey()} />;
}
