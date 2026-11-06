import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getPlan } from "@/server/services/billing";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, prefs, plan, active] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id }, select: { avatarPath: true } }),
    db.userPreference.findUnique({ where: { userId: user.id }, select: { reducedMotion: true } }),
    getPlan(user.id),
    db.workoutSession.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, select: { id: true, name: true } }),
  ]);
  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp: user.xp,
        hasAvatar: !!profile?.avatarPath,
        emailVerified: !!user.emailVerifiedAt,
        reducedMotion: !!prefs?.reducedMotion,
        plan,
        activeSession: active,
      }}
    >
      {children}
    </AppShell>
  );
}
