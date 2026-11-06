import { z } from "zod";

export const MUSCLE_GROUPS = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS", "GLUTES", "ABS", "CARDIO", "MOBILITY"] as const;
export const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

const id = z.string().min(1).max(40);

export const workoutItemSchema = z.object({
  exerciseId: id,
  sets: z.coerce.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(20).regex(/^[0-9]+(\s*-\s*[0-9]+)?(s|min)?$/i, "Use números, ex.: 10, 8-12 ou 30s."),
  loadKg: z.coerce.number().min(0).max(1000).nullable().optional(),
  restSec: z.coerce.number().int().min(0).max(900),
  notes: z.string().trim().max(200).nullable().optional(),
});

export const workoutSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao treino.").max(80),
  description: z.string().trim().max(500).nullable().optional(),
  focus: z.enum(MUSCLE_GROUPS).nullable().optional(),
  isTemplate: z.boolean().default(false),
  estimatedMinutes: z.coerce.number().int().min(5).max(300).default(45),
  items: z.array(workoutItemSchema).min(1, "Adicione pelo menos um exercício.").max(40),
});

export const startSessionSchema = z.object({ workoutId: id.optional(), name: z.string().trim().min(2).max(80).optional() });

export const logSetSchema = z
  .object({
    exerciseId: id,
    setNumber: z.coerce.number().int().min(1).max(50),
    reps: z.coerce.number().int().min(0).max(500).nullable().optional(),
    loadKg: z.coerce.number().min(0).max(1000).nullable().optional(),
    durationSec: z.coerce.number().int().min(0).max(36000).nullable().optional(),
    distanceKm: z.coerce.number().min(0).max(500).nullable().optional(),
  })
  .refine((s) => s.reps != null || s.durationSec != null || s.distanceKm != null, "Informe repetições, tempo ou distância.");

export const finishSessionSchema = z.object({
  status: z.enum(["COMPLETED", "ABANDONED"]).default("COMPLETED"),
  perceivedEffort: z.coerce.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const exerciseAdminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).max(5).default([]),
  equipment: z.string().trim().min(2).max(60),
  difficulty: z.enum(DIFFICULTIES),
  description: z.string().trim().min(10).max(600),
  instructions: z.array(z.string().trim().min(3).max(300)).min(1).max(12),
  cautions: z.array(z.string().trim().min(3).max(300)).max(8).default([]),
  defaultSets: z.coerce.number().int().min(1).max(10),
  defaultReps: z.string().trim().min(1).max(20),
  defaultRestSec: z.coerce.number().int().min(0).max(600),
  isCardio: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const missionSchema = z.object({
  code: z.string().trim().regex(/^[A-Z0-9_]{3,30}$/, "Use letras maiúsculas, números e _"),
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().min(5).max(300),
  metric: z.enum(["WORKOUTS", "WORKOUT_MINUTES", "CARDIO_KM", "MEALS_LOGGED", "WATER_DAYS", "HABIT_CHECKINS", "ROUTINE_COMPLETIONS"]),
  targetValue: z.coerce.number().positive().max(10000),
  durationDays: z.coerce.number().int().min(1).max(90),
  xpReward: z.coerce.number().int().min(10).max(1000),
  icon: z.string().trim().max(30).default("target"),
  isActive: z.boolean().default(true),
});
