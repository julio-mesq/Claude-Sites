import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listWorkouts } from "@/server/services/workouts";
import { CalendarApp } from "./calendar-app";

export const metadata: Metadata = { title: "Calendário" };

export default async function CalendarPage() {
  const user = await requireUser();
  const workouts = await listWorkouts(user.id);
  return <CalendarApp workouts={workouts.map((w) => ({ id: w.id, name: w.name }))} />;
}
