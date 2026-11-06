import { route } from "@/server/http";
import { db } from "@/server/db";
import { levelProgress } from "@/lib/fitness-math";
export const GET = route({ role: "USER" }, async ({ user }) => {
  const [all, mine, xp] = await Promise.all([
    db.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    db.userAchievement.findMany({ where: { userId: user.id } }),
    db.xpEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const unlocked = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));
  return { level: levelProgress(user.xp), xp: user.xp, items: all.map((a) => ({ ...a, unlockedAt: unlocked.get(a.id) ?? null })), rewards: xp };
});
