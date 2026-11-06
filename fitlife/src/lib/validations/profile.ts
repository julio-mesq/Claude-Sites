import { z } from "zod";

export const GOALS = ["GAIN_MUSCLE", "LOSE_FAT", "CONDITIONING", "STRENGTH", "HEALTH", "MAINTAIN", "MOBILITY"] as const;
export const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const LOCATIONS = ["GYM", "HOME", "OUTDOOR", "MIXED"] as const;
export const SEXES = ["MALE", "FEMALE", "OTHER", "UNDISCLOSED"] as const;

const tagList = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

export const onboardingSchema = z.object({
  birthDate: z.coerce
    .date()
    .refine((d) => {
      const age = (Date.now() - d.getTime()) / (365.25 * 86400_000);
      return age >= 16 && age <= 100;
    }, "O FitLife é destinado a pessoas entre 16 e 100 anos."),
  sex: z.enum(SEXES).default("UNDISCLOSED"),
  heightCm: z.coerce.number().min(120, "Altura mínima: 120 cm.").max(230, "Altura máxima: 230 cm."),
  weightKg: z.coerce.number().min(30, "Peso mínimo: 30 kg.").max(300, "Peso máximo: 300 kg."),
  goal: z.enum(GOALS),
  experience: z.enum(LEVELS),
  trainingDaysPerWeek: z.coerce.number().int().min(1).max(7),
  location: z.enum(LOCATIONS),
  equipment: tagList,
  sessionMinutes: z.coerce.number().int().min(10).max(180),
  dietaryPreferences: tagList,
  dietaryRestrictions: tagList,
  activityPreferences: tagList,
  hasHealthConditions: z.boolean().default(false),
  healthNotes: z.string().trim().max(500).optional().nullable(),
});

export const profileUpdateSchema = onboardingSchema.partial().extend({
  name: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,24}$/, "Use 3–24 caracteres: letras, números, _ ou .")
    .optional()
    .nullable(),
});

export const preferencesSchema = z.object({
  reducedMotion: z.boolean().optional(),
  weeklyWorkoutTarget: z.number().int().min(1).max(14).optional(),
  dailyWaterMl: z.number().int().min(500).max(8000).optional(),
  communityEnabled: z.boolean().optional(),
  profileVisibility: z.enum(["PRIVATE", "FOLLOWERS", "PUBLIC"]).optional(),
  showInRanking: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  reminderNotifications: z.boolean().optional(),
  aiUseHistory: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
});
