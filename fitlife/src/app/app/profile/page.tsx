import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { getProfileBundle } from "@/server/services/profile";
import { db } from "@/server/db";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { ProfileEditor } from "./profile-editor";
import { ageFrom } from "@/lib/fitness-math";
import { GOAL_LABEL, LEVEL_LABEL, LOCATION_LABEL, ROLE_LABEL, SEX_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const b = await getProfileBundle(user.id);
  const [workouts, achievements] = await Promise.all([db.workoutSession.count({ where: { userId: user.id, status: "COMPLETED" } }), db.userAchievement.count({ where: { userId: user.id } })]);
  const p = b.profile;
  return (
    <div>
      <PageHeader eyebrow="Conta" title="Meu perfil" />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <ProfileEditor name={b.name} email={b.email} username={p?.username ?? ""} bio={p?.bio ?? ""} hasAvatar={!!p?.avatarPath} level={b.level} xp={b.xp} stats={{ workouts, achievements, since: formatDate(b.createdAt, { month: "short", year: "numeric" }) }} role={ROLE_LABEL[b.role]!} />
        <Card>
          <CardHeader title="Perfil físico e preferências" subtitle="Usado para personalizar treinos e metas estimadas" action={<Link href="/onboarding?edit=1" className={buttonClass("secondary", "sm")}><Pencil className="h-4 w-4" /> Editar</Link>} />
          <dl className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Idade", p?.birthDate ? `${ageFrom(p.birthDate)} anos` : "—"],
              ["Sexo", p ? SEX_LABEL[p.sex] : "—"],
              ["Altura", p?.heightCm ? `${p.heightCm} cm` : "—"],
              ["Peso", p?.weightKg ? `${p.weightKg} kg` : "—"],
              ["Objetivo", p?.goal ? GOAL_LABEL[p.goal] : "—"],
              ["Experiência", p?.experience ? LEVEL_LABEL[p.experience] : "—"],
              ["Frequência", p?.trainingDaysPerWeek ? `${p.trainingDaysPerWeek}x por semana` : "—"],
              ["Tempo por treino", p?.sessionMinutes ? `${p.sessionMinutes} min` : "—"],
              ["Local", p?.location ? LOCATION_LABEL[p.location] : "—"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
                <dt className="text-[11px] text-mist">{l}</dt>
                <dd className="mt-0.5 text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-4 px-5 pb-5">
            {[
              ["Equipamentos", p?.equipment],
              ["Preferências alimentares", p?.dietaryPreferences],
              ["Restrições alimentares", p?.dietaryRestrictions],
              ["Atividades favoritas", p?.activityPreferences],
            ].map(([l, list]) => (
              <div key={l as string}>
                <div className="mb-2 text-xs text-mist">{l as string}</div>
                <div className="flex flex-wrap gap-1.5">{(list as string[] | undefined)?.length ? (list as string[]).map((x) => <Badge key={x}>{x}</Badge>) : <span className="text-sm text-mist-700">Não informado</span>}</div>
              </div>
            ))}
            {p?.hasHealthConditions && <p className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning">Você informou condições de saúde. Mantenha acompanhamento profissional.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
