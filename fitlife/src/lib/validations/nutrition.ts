import { z } from "zod";

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACK", "DINNER", "SUPPER"] as const;

export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (AAAA-MM-DD).");

const macro = z.coerce.number().min(0).max(5000);

export const mealEntrySchema = z.object({
  date: dateOnly,
  mealType: z.enum(MEAL_TYPES),
  foodItemId: z.string().max(40).optional().nullable(),
  name: z.string().trim().min(1, "Informe o alimento.").max(120),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva.").max(10000),
  unit: z.string().trim().min(1).max(20),
  calories: z.coerce.number().min(0).max(10000),
  proteinG: macro,
  carbsG: macro,
  fatG: macro,
  saveToLibrary: z.boolean().optional(),
});

export const foodItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional().nullable(),
  servingQty: z.coerce.number().positive().max(10000),
  servingUnit: z.string().trim().min(1).max(20),
  calories: z.coerce.number().min(0).max(10000),
  proteinG: macro,
  carbsG: macro,
  fatG: macro,
  isFavorite: z.boolean().optional(),
});

export const waterSchema = z.object({ date: dateOnly, amountMl: z.coerce.number().int().min(-2000).max(3000).refine((v) => v !== 0) });

export const targetsSchema = z.object({
  calorieTarget: z.coerce.number().int().min(800).max(8000),
  proteinTarget: z.coerce.number().int().min(10).max(500),
  carbsTarget: z.coerce.number().int().min(0).max(1000),
  fatTarget: z.coerce.number().int().min(10).max(400),
});

export const recipeSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(400).optional().nullable(),
  ingredients: z.array(z.string().trim().min(1).max(160)).min(1).max(40),
  steps: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  servings: z.coerce.number().int().min(1).max(50),
  calories: z.coerce.number().min(0).max(10000).nullable().optional(),
  proteinG: macro.nullable().optional(),
  carbsG: macro.nullable().optional(),
  fatG: macro.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
});

export const shoppingItemSchema = z.object({ name: z.string().trim().min(1).max(100), quantity: z.string().trim().max(40).optional().nullable() });
