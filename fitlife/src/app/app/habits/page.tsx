import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listHabits } from "@/server/services/routine";
import { dateKey } from "@/lib/utils";
import { HabitsApp } from "./habits-app";

export const metadata: Metadata = { title: "Hábitos" };

export default async function HabitsPage() {
  const user = await requireUser();
  return <HabitsApp initial={await listHabits(user.id)} today={dateKey()} />;
}
