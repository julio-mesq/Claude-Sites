import type { Metadata } from "next";
import { Crown, Droplets, Flame, Footprints, Lock, Medal, Repeat, Route, Ruler, Salad, Shield, Target, TrendingUp, Trophy } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { leaderboard } from "@/server/services/insights";
import { levelProgress } from "@/lib/fitness-math";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { ShareAchievement } from "./share-achievement";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Conquistas" };

const ICONS: Record<string, typeof Trophy> = { footprints: Footprints, flame: Flame, "trending-up": TrendingUp, shield: Shield, route: Route, trophy: Trophy, droplets: Droplets, salad: Salad, ruler: Ruler, repeat: Repeat, target: Target, crown: Crown };
const TIER: Record<string, string> = { bronze: "from-amber-700 to-amber-500", silver: "from-slate-400 to-slate-200", gold: "from-yellow-500 to-amber-300", platinum: "from-neon to-cyan-300" };

export default async function AchievementsPage() {
  const user = await requireUser();
  const [all, mine, rewards, ranking, pref] = await Promise.all([
    db.achievement.findMany({ orderBy: { xpReward: "asc" } }),
    db.userAchievement.findMany({ where: { userId: user.id } }),
    db.xpEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 25 }),
    leaderboard(user.id),
    db.userPreference.findUnique({ where: { userId: user.id }, select: { showInRanking: true, communityEnabled: true } }),
  ]);
  const unlocked = new Map(mine.map((m) => [m.achievementId, m.unlockedAt]));
  const lp = levelProgress(user.xp);
  return (
    <div>
      <PageHeader eyebrow="Gamificação" title="Conquistas" subtitle="Concedidas automaticamente com base em eventos reais do sistema." />
      <Card className="relative mb-6 overflow-hidden p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-neon/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-neon to-neon-600 font-display text-3xl font-extrabold text-ink-950 shadow-glow">{lp.level}</div>
          <div className="flex-1">
            <div className="text-sm text-mist">Nível atual</div>
            <div className="font-display text-2xl font-bold">Nível {lp.level} · {user.xp} XP</div>
            <ProgressBar value={lp.pct} className="mt-3 h-2.5" label="Progresso do nível" />
            <div className="mt-1.5 text-xs text-mist">{lp.needed - lp.current} XP para o nível {lp.level + 1}</div>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-display text-3xl font-bold">{mine.length}<span className="text-lg text-mist">/{all.length}</span></div>
            <div className="text-xs text-mist">conquistas</div>
          </div>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {all.map((a) => {
          const at = unlocked.get(a.id);
          const Icon = ICONS[a.icon] ?? Medal;
          return (
            <Card key={a.id} className={cn("relative p-5 text-center", !at && "opacity-60")}>
              <div className={cn("mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br text-ink-950", at ? TIER[a.tier] : "from-ink-600 to-ink-700 text-mist")}>{at ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}</div>
              <div className="mt-4 font-display font-bold uppercase tracking-wide">{a.name}</div>
              <p className="mt-1 text-xs text-mist">{a.description}</p>
              <div className="mt-3 flex justify-center gap-1.5">
                <Badge tone={at ? "neon" : "neutral"}>+{a.xpReward} XP</Badge>
                <Badge className="capitalize">{a.tier}</Badge>
              </div>
              {at && (
                <>
                  <div className="mt-2 text-[11px] text-mist-700">Desbloqueada em {formatDate(at, { day: "2-digit", month: "short", year: "numeric" })}</div>
                  {pref?.communityEnabled && <ShareAchievement code={a.code} name={a.name} />}
                </>
              )}
            </Card>
          );
        })}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Histórico de recompensas" icon={<Trophy className="h-4 w-4" />} />
          {rewards.length === 0 ? (
            <EmptyState title="Nenhuma recompensa ainda" description="Treinos, hábitos, refeições e medidas geram XP." />
          ) : (
            <ul className="divide-y divide-white/5 p-2">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span>{r.reason}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-mist">{formatDate(r.createdAt)}</span>
                    <span className="font-semibold text-neon">+{r.amount}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Ranking semanal (opcional)" subtitle="XP ganho nos últimos 7 dias por quem optou por participar" icon={<Crown className="h-4 w-4" />} />
          <div className="p-2">
            {!pref?.showInRanking && <p className="m-3 rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-mist">Você não participa do ranking. Ative em Configurações → Privacidade, se quiser.</p>}
            {ranking.length === 0 ? (
              <EmptyState title="Ninguém no ranking ainda" />
            ) : (
              <ol className="divide-y divide-white/5">
                {ranking.map((r) => (
                  <li key={r.id} className={cn("flex items-center justify-between px-3 py-2.5 text-sm", r.isMe && "rounded-xl bg-neon/5")}>
                    <span className="flex items-center gap-3">
                      <span className={cn("grid h-7 w-7 place-items-center rounded-lg text-xs font-bold", r.rank <= 3 ? "bg-neon text-ink-950" : "bg-white/5 text-mist")}>{r.rank}</span>
                      {r.name} {r.isMe && <Badge tone="neon">Você</Badge>}
                    </span>
                    <span className="text-xs text-mist">Nv {r.level} · <span className="font-semibold text-snow">{r.weeklyXp} XP</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
