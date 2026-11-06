import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listGoals, listMeasurements, listPhotos } from "@/server/services/progress";
import { muscleBalance } from "@/server/services/insights";
import { ProgressApp } from "./progress-app";

export const metadata: Metadata = { title: "Evolução" };

export default async function ProgressPage() {
  const user = await requireUser();
  const [measurements, photos, goals, balance] = await Promise.all([listMeasurements(user.id), listPhotos(user.id), listGoals(user.id), muscleBalance(user.id)]);
  return <ProgressApp measurements={JSON.parse(JSON.stringify(measurements))} photos={JSON.parse(JSON.stringify(photos))} goals={JSON.parse(JSON.stringify(goals))} balance={balance} />;
}
