import type { Metadata } from "next";
import { CalendarCheck, Flag, Flame, Medal, Ruler, Star, Target, Trophy, Zap } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { journey } from "@/server/services/insights";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/reveal";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Body Journey" };

const KIND: Record<string, { icon: typeof Flag; label: string; color: string }> = {
  FIRST_WORKOUT: { icon: Flag, label: "Primeiro treino", color: "#B6FF3B" },
  FIRST_FULL_WEEK: { icon: CalendarCheck, label: "Semana completa", color: "#77D63B" },
  PERSONAL_RECORD: { icon: Trophy, label: "Recorde", color: "#FFB83B" },
  GOAL_REACHED: { icon: Target, label: "Meta", color: "#3BC8FF" },
  MEASUREMENT: { icon: Ruler, label: "Medida", color: "#9B8CFF" },
  HABIT_STREAK: { icon: Flame, label: "Hábito", color: "#FF7AB6" },
  ACHIEVEMENT: { icon: Medal, label: "Conquista", color: "#B6FF3B" },
  LEVEL_UP: { icon: Zap, label: "Nível", color: "#B6FF3B" },
  MISSION_COMPLETED: { icon: Star, label: "Missão", color: "#3BC8FF" },
};

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const user = await requireUser();
  const { kind } = await searchParams;
  const data = await journey(user.id, { take: 60, kind: kind && KIND[kind] ? kind : undefined });
  const byMonth = new Map<string, typeof data.items>();
  for (const m of data.items) {
    const k = formatDate(m.occurredAt, { month: "long", year: "numeric" });
    byMonth.set(k, [...(byMonth.get(k) ?? []), m]);
  }
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Body Journey" title="Sua linha do tempo" subtitle="Cada marco foi gerado por um registro real seu." />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <a href="/app/journey" className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm", !kind ? "border-neon/60 bg-neon/12 text-neon" : "border-white/8 text-mist")}>Todos</a>
        {Object.entries(KIND).map(([k, v]) => (
          <a key={k} href={`/app/journey?kind=${k}`} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm", kind === k ? "border-neon/60 bg-neon/12 text-neon" : "border-white/8 text-mist")}>{v.label}</a>
        ))}
      </div>
      {data.items.length === 0 ? (
        <Card><EmptyState icon={<Flag className="h-6 w-6" />} title="Sua jornada começa agora" description="Conclua treinos, bata recordes e atinja metas para preencher sua linha do tempo." /></Card>
      ) : (
        <div className="space-y-10">
          {[...byMonth.entries()].map(([month, items]) => (
            <section key={month}>
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.2em] text-mist first-letter:uppercase">{month}</h2>
              <ol className="relative space-y-4 border-l border-white/8 pl-8">
                {items.map((m, i) => {
                  const k = KIND[m.kind] ?? KIND.ACHIEVEMENT!;
                  return (
                    <li key={m.id} className="relative">
                      <span className="absolute -left-[45px] top-4 grid h-7 w-7 place-items-center rounded-full ring-4 ring-ink-950" style={{ background: k.color, boxShadow: `0 0 18px -2px ${k.color}` }}>
                        <k.icon className="h-3.5 w-3.5 text-ink-950" />
                      </span>
                      <Reveal delay={Math.min(i, 6) * 0.04}>
                        <Card className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Badge>{k.label}</Badge>
                            <time className="text-xs text-mist">{formatDate(m.occurredAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
                          </div>
                          <h3 className="mt-3 font-display text-lg font-bold">{m.title}</h3>
                          <p className="mt-1 text-sm text-mist">{m.description}</p>
                        </Card>
                      </Reveal>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
