import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { communityStats } from "@/server/services/community";
import { CommunityApp } from "./community-app";

export const metadata: Metadata = { title: "Comunidade" };

export default async function CommunityPage() {
  const user = await requireUser();
  const [pref, stats, achievements] = await Promise.all([
    db.userPreference.findUnique({ where: { userId: user.id }, select: { communityEnabled: true } }),
    communityStats(user.id),
    db.userAchievement.findMany({ where: { userId: user.id }, include: { achievement: { select: { code: true, name: true } } } }),
  ]);
  return <CommunityApp enabled={!!pref?.communityEnabled} verified={!!user.emailVerifiedAt} stats={stats} achievements={achievements.map((a) => a.achievement)} />;
}
