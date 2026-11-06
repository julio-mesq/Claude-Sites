import "server-only";
import type { z } from "zod";
import type { MealType } from "@prisma/client";
import { db } from "../db";
import { Errors } from "../errors";
import type { foodItemSchema, mealEntrySchema, recipeSchema, shoppingItemSchema, targetsSchema } from "@/lib/validations/nutrition";
import { addDaysKey, keyToDate } from "@/lib/utils";
import { afterActivity, awardXp, XP } from "./gamification";

const r1 = (n: number) => Math.round(n * 10) / 10;

export async function getTargets(userId: string, dateKey: string) {
  const t = await db.nutritionLog.findFirst({ where: { userId, date: { lte: keyToDate(dateKey) } }, orderBy: { date: "desc" } });
  const pref = await db.userPreference.findUnique({ where: { userId }, select: { dailyWaterMl: true } });
  return {
    calories: t?.calorieTarget ?? null,
    protein: t?.proteinTarget ?? null,
    carbs: t?.carbsTarget ?? null,
    fat: t?.fatTarget ?? null,
    waterMl: pref?.dailyWaterMl ?? 2500,
    isEstimate: true,
  };
}

export async function setTargets(userId: string, dateKey: string, data: z.infer<typeof targetsSchema>) {
  const date = keyToDate(dateKey);
  await db.nutritionLog.upsert({ where: { userId_date: { userId, date } }, create: { userId, date, ...data, notes: "Definido manualmente." }, update: { ...data, notes: "Definido manualmente." } });
}

export async function getDay(userId: string, dateKey: string) {
  const date = keyToDate(dateKey);
  const [meals, water, targets] = await Promise.all([
    db.meal.findMany({ where: { userId, date, isCustomTemplate: false }, include: { entries: { orderBy: { createdAt: "asc" } } } }),
    db.waterLog.aggregate({ where: { userId, date }, _sum: { amountMl: true } }),
    getTargets(userId, dateKey),
  ]);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const m of meals) for (const e of m.entries) {
    totals.calories += e.calories;
    totals.protein += e.proteinG;
    totals.carbs += e.carbsG;
    totals.fat += e.fatG;
  }
  return {
    date: dateKey,
    meals,
    totals: { calories: Math.round(totals.calories), protein: r1(totals.protein), carbs: r1(totals.carbs), fat: r1(totals.fat) },
    waterMl: Math.max(0, water._sum.amountMl ?? 0),
    targets,
  };
}

async function mealFor(userId: string, dateKey: string, type: MealType) {
  const date = keyToDate(dateKey);
  const existing = await db.meal.findFirst({ where: { userId, date, type, isCustomTemplate: false } });
  return existing ?? db.meal.create({ data: { userId, date, type } });
}

export async function addEntry(userId: string, input: z.infer<typeof mealEntrySchema>) {
  if (input.foodItemId) {
    const food = await db.foodItem.findFirst({ where: { id: input.foodItemId, OR: [{ userId }, { userId: null }] } });
    if (!food) throw Errors.notFound("Alimento");
  }
  const meal = await mealFor(userId, input.date, input.mealType);
  let foodItemId = input.foodItemId ?? null;
  if (!foodItemId && input.saveToLibrary) {
    const f = await db.foodItem.create({
      data: { userId, name: input.name, servingQty: input.quantity, servingUnit: input.unit, calories: input.calories, proteinG: input.proteinG, carbsG: input.carbsG, fatG: input.fatG, source: "user" },
    });
    foodItemId = f.id;
  }
  const entry = await db.mealEntry.create({
    data: { mealId: meal.id, foodItemId, name: input.name, quantity: input.quantity, unit: input.unit, calories: input.calories, proteinG: input.proteinG, carbsG: input.carbsG, fatG: input.fatG },
  });
  await awardXp(userId, XP.mealDay, "Diário alimentar", `meal-day:${input.date}`);
  await afterActivity(userId);
  return entry;
}

export async function deleteEntry(userId: string, entryId: string) {
  const res = await db.mealEntry.deleteMany({ where: { id: entryId, meal: { userId } } });
  if (res.count === 0) throw Errors.notFound("Registro");
}

/** Copia todas as refeições de um dia para outro (ex.: repetir o dia anterior). */
export async function copyDay(userId: string, fromKey: string, toKey: string) {
  const meals = await db.meal.findMany({ where: { userId, date: keyToDate(fromKey), isCustomTemplate: false }, include: { entries: true } });
  let copied = 0;
  for (const m of meals) {
    if (m.entries.length === 0) continue;
    const target = await mealFor(userId, toKey, m.type);
    await db.mealEntry.createMany({
      data: m.entries.map((e) => ({ mealId: target.id, foodItemId: e.foodItemId, name: e.name, quantity: e.quantity, unit: e.unit, calories: e.calories, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG })),
    });
    copied += m.entries.length;
  }
  if (copied > 0) {
    await awardXp(userId, XP.mealDay, "Diário alimentar", `meal-day:${toKey}`);
    await afterActivity(userId);
  }
  return { copied };
}

// ───────────── Refeições personalizadas (modelos) ─────────────

export async function saveMealTemplate(userId: string, mealId: string, name: string) {
  const meal = await db.meal.findFirst({ where: { id: mealId, userId }, include: { entries: true } });
  if (!meal || meal.entries.length === 0) throw Errors.badRequest("Refeição vazia ou inexistente.");
  return db.meal.create({
    data: {
      userId,
      date: meal.date,
      type: meal.type,
      name: name.slice(0, 80),
      isCustomTemplate: true,
      entries: { create: meal.entries.map((e) => ({ foodItemId: e.foodItemId, name: e.name, quantity: e.quantity, unit: e.unit, calories: e.calories, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG })) },
    },
  });
}

export async function listMealTemplates(userId: string) {
  return db.meal.findMany({ where: { userId, isCustomTemplate: true }, include: { entries: true }, orderBy: { createdAt: "desc" } });
}

export async function applyMealTemplate(userId: string, templateId: string, dateKey: string, type: MealType) {
  const tpl = await db.meal.findFirst({ where: { id: templateId, userId, isCustomTemplate: true }, include: { entries: true } });
  if (!tpl) throw Errors.notFound("Refeição personalizada");
  const meal = await mealFor(userId, dateKey, type);
  await db.mealEntry.createMany({
    data: tpl.entries.map((e) => ({ mealId: meal.id, foodItemId: e.foodItemId, name: e.name, quantity: e.quantity, unit: e.unit, calories: e.calories, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG })),
  });
  await awardXp(userId, XP.mealDay, "Diário alimentar", `meal-day:${dateKey}`);
  await afterActivity(userId);
}

export async function deleteMealTemplate(userId: string, id: string) {
  const res = await db.meal.deleteMany({ where: { id, userId, isCustomTemplate: true } });
  if (res.count === 0) throw Errors.notFound("Refeição personalizada");
}

// ───────────── Água ─────────────

export async function addWater(userId: string, dateKey: string, amountMl: number) {
  const date = keyToDate(dateKey);
  const current = (await db.waterLog.aggregate({ where: { userId, date }, _sum: { amountMl: true } }))._sum.amountMl ?? 0;
  const delta = Math.max(-current, amountMl);
  if (delta === 0) return { waterMl: current };
  await db.waterLog.create({ data: { userId, date, amountMl: delta } });
  const total = current + delta;
  const pref = await db.userPreference.findUnique({ where: { userId }, select: { dailyWaterMl: true } });
  if (total >= (pref?.dailyWaterMl ?? 2500)) await awardXp(userId, XP.waterGoal, "Meta de hidratação", `water:${dateKey}`);
  await afterActivity(userId);
  return { waterMl: total };
}

// ───────────── Biblioteca de alimentos ─────────────

export async function searchFoods(userId: string, q: string, favoritesOnly = false) {
  return db.foodItem.findMany({
    where: {
      OR: [{ userId }, { userId: null }],
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(favoritesOnly ? { isFavorite: true, userId } : {}),
    },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    take: 30,
  });
}

export async function recentFoods(userId: string) {
  const entries = await db.mealEntry.findMany({ where: { meal: { userId } }, orderBy: { createdAt: "desc" }, take: 60 });
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.name.toLowerCase()) ? false : (seen.add(e.name.toLowerCase()), true))).slice(0, 12);
}

export async function createFood(userId: string, data: z.infer<typeof foodItemSchema>) {
  return db.foodItem.create({ data: { ...data, userId, source: "user" } });
}

export async function toggleFavorite(userId: string, id: string) {
  const f = await db.foodItem.findFirst({ where: { id, userId } });
  if (!f) throw Errors.notFound("Alimento");
  return db.foodItem.update({ where: { id }, data: { isFavorite: !f.isFavorite } });
}

export async function deleteFood(userId: string, id: string) {
  const res = await db.foodItem.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Alimento");
}

// ───────────── Histórico ─────────────

export async function history(userId: string, days = 14, endKey: string) {
  const start = addDaysKey(endKey, -(days - 1));
  const rows = await db.$queryRaw<{ d: string; kcal: number; p: number; c: number; f: number }[]>`
    SELECT to_char(m.date, 'YYYY-MM-DD') AS d, COALESCE(SUM(e.calories),0)::float AS kcal, COALESCE(SUM(e."proteinG"),0)::float AS p,
           COALESCE(SUM(e."carbsG"),0)::float AS c, COALESCE(SUM(e."fatG"),0)::float AS f
    FROM meals m JOIN meal_entries e ON e."mealId" = m.id
    WHERE m."userId" = ${userId} AND m."isCustomTemplate" = false AND m.date BETWEEN ${keyToDate(start)}::date AND ${keyToDate(endKey)}::date
    GROUP BY m.date ORDER BY m.date`;
  const water = await db.$queryRaw<{ d: string; ml: number }[]>`
    SELECT to_char(date, 'YYYY-MM-DD') AS d, SUM("amountMl")::int AS ml FROM water_logs
    WHERE "userId" = ${userId} AND date BETWEEN ${keyToDate(start)}::date AND ${keyToDate(endKey)}::date GROUP BY date`;
  const byDay = new Map(rows.map((r) => [r.d, r]));
  const waterBy = new Map(water.map((w) => [w.d, w.ml]));
  return Array.from({ length: days }, (_, i) => {
    const d = addDaysKey(start, i);
    const r = byDay.get(d);
    return { date: d, calories: Math.round(r?.kcal ?? 0), protein: r1(r?.p ?? 0), carbs: r1(r?.c ?? 0), fat: r1(r?.f ?? 0), waterMl: waterBy.get(d) ?? 0 };
  });
}

// ───────────── Receitas e lista de compras ─────────────

export async function listRecipes(userId: string) {
  return db.recipe.findMany({ where: { OR: [{ userId }, { userId: null }] }, orderBy: [{ userId: "desc" }, { title: "asc" }] });
}

export async function createRecipe(userId: string, data: z.infer<typeof recipeSchema>) {
  return db.recipe.create({ data: { ...data, userId } });
}

export async function deleteRecipe(userId: string, id: string) {
  const res = await db.recipe.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Receita");
}

export async function listShopping(userId: string) {
  return db.shoppingListItem.findMany({ where: { userId }, orderBy: [{ checked: "asc" }, { createdAt: "desc" }] });
}

export async function addShopping(userId: string, data: z.infer<typeof shoppingItemSchema>) {
  const count = await db.shoppingListItem.count({ where: { userId } });
  if (count >= 200) throw Errors.badRequest("Limite de 200 itens na lista.");
  return db.shoppingListItem.create({ data: { ...data, userId } });
}

export async function addRecipeToShopping(userId: string, recipeId: string) {
  const r = await db.recipe.findFirst({ where: { id: recipeId, OR: [{ userId }, { userId: null }] } });
  if (!r) throw Errors.notFound("Receita");
  await db.shoppingListItem.createMany({ data: r.ingredients.slice(0, 40).map((name) => ({ userId, name: name.slice(0, 100) })) });
  return { added: r.ingredients.length };
}

export async function toggleShopping(userId: string, id: string) {
  const it = await db.shoppingListItem.findFirst({ where: { id, userId } });
  if (!it) throw Errors.notFound("Item");
  return db.shoppingListItem.update({ where: { id }, data: { checked: !it.checked } });
}

export async function deleteShopping(userId: string, id: string | "checked") {
  if (id === "checked") return db.shoppingListItem.deleteMany({ where: { userId, checked: true } });
  const res = await db.shoppingListItem.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Item");
}
