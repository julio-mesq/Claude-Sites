import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { getDay } from "@/server/services/nutrition";
import { dateKey } from "@/lib/utils";
import { NutritionApp } from "./nutrition-app";

export const metadata: Metadata = { title: "Nutrição" };

export default async function NutritionPage() {
  const user = await requireUser();
  const today = dateKey();
  const day = await getDay(user.id, today);
  return <NutritionApp today={today} initialDay={JSON.parse(JSON.stringify(day))} />;
}
