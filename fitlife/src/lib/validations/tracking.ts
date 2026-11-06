import { z } from "zod";
import { dateOnly } from "./nutrition";

const cm = z.coerce.number().min(10).max(300).nullable().optional();

export const measurementSchema = z
  .object({
    measuredAt: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 86400_000, "A data não pode estar no futuro."),
    weightKg: z.coerce.number().min(30).max(300).nullable().optional(),
    heightCm: z.coerce.number().min(120).max(230).nullable().optional(),
    bodyFatPct: z.coerce.number().min(2).max(70).nullable().optional(),
    bodyFatMethod: z.string().trim().max(60).nullable().optional(),
    chestCm: cm,
    waistCm: cm,
    hipsCm: cm,
    armCm: cm,
    thighCm: cm,
    calfCm: cm,
    neckCm: cm,
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine((m) => m.bodyFatPct == null || (m.bodyFatMethod && m.bodyFatMethod.length > 1), {
    path: ["bodyFatMethod"],
    message: "Informe o método usado para medir o percentual de gordura.",
  })
  .refine(
    (m) => [m.weightKg, m.heightCm, m.bodyFatPct, m.chestCm, m.waistCm, m.hipsCm, m.armCm, m.thighCm, m.calfCm, m.neckCm].some((v) => v != null),
    "Informe pelo menos uma medida.",
  );

export const goalSchema = z.object({
  title: z.string().trim().min(2).max(100),
  metric: z.enum(["weight", "body_fat", "waist", "workouts", "custom"]),
  unit: z.string().trim().min(1).max(15),
  startValue: z.coerce.number().min(-10000).max(100000),
  targetValue: z.coerce.number().min(-10000).max(100000),
  currentValue: z.coerce.number().min(-10000).max(100000).optional(),
  deadline: z.coerce.date().nullable().optional(),
});

export const goalUpdateSchema = z.object({
  currentValue: z.coerce.number().min(-10000).max(100000).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  title: z.string().trim().min(2).max(100).optional(),
  deadline: z.coerce.date().nullable().optional(),
});

export const habitSchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().max(30).default("check"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#B6FF3B"),
  frequency: z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
  targetPerPeriod: z.coerce.number().int().min(1).max(7).default(1),
});

export const habitToggleSchema = z.object({ date: dateOnly });

export const calendarEventSchema = z
  .object({
    title: z.string().trim().min(2).max(100),
    type: z.enum(["WORKOUT", "REST", "GOAL", "REMINDER", "APPOINTMENT"]),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    allDay: z.boolean().default(false),
    workoutId: z.string().max(40).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    remindMinutesBefore: z.coerce.number().int().min(0).max(10080).nullable().optional(),
  })
  .refine((e) => !e.endsAt || e.endsAt >= e.startsAt, { path: ["endsAt"], message: "O fim deve ser depois do início." });

export const recoverySchema = z.object({
  date: dateOnly,
  sleepHours: z.coerce.number().min(0).max(24),
  fatigue: z.coerce.number().int().min(1).max(5),
  soreness: z.coerce.number().int().min(1).max(5),
  recoveryFeeling: z.coerce.number().int().min(1).max(5),
  isRestDay: z.boolean().default(false),
  notes: z.string().trim().max(300).nullable().optional(),
});

export const postSchema = z.object({
  content: z.string().trim().min(1, "Escreva algo.").max(1000),
  visibility: z.enum(["PUBLIC", "FOLLOWERS"]).default("PUBLIC"),
  achievementCode: z.string().max(40).nullable().optional(),
});

export const commentSchema = z.object({ content: z.string().trim().min(1).max(500) });

export const reportSchema = z.object({
  postId: z.string().max(40).optional(),
  commentId: z.string().max(40).optional(),
  reason: z.enum(["spam", "harassment", "misinformation", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
}).refine((r) => r.postId || r.commentId, "Informe o conteúdo denunciado.");

export const aiMessageSchema = z.object({ message: z.string().trim().min(1, "Escreva sua pergunta.").max(2000) });
