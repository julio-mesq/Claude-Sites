import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Configurar experiência" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requireUser({ onboarded: false });
  const { edit } = await searchParams;
  if (user.onboardedAt && !edit) redirect("/app");
  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  return (
    <OnboardingWizard
      firstName={user.name.split(" ")[0]!}
      editing={!!user.onboardedAt}
      initial={
        profile
          ? {
              birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
              sex: profile.sex,
              heightCm: profile.heightCm ? String(profile.heightCm) : "",
              weightKg: profile.weightKg ? String(profile.weightKg) : "",
              goal: profile.goal ?? "",
              experience: profile.experience ?? "",
              trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 3,
              location: profile.location ?? "",
              equipment: profile.equipment,
              sessionMinutes: profile.sessionMinutes ?? 45,
              dietaryPreferences: profile.dietaryPreferences,
              dietaryRestrictions: profile.dietaryRestrictions,
              activityPreferences: profile.activityPreferences,
              hasHealthConditions: profile.hasHealthConditions,
              healthNotes: profile.healthNotes ?? "",
            }
          : undefined
      }
    />
  );
}
