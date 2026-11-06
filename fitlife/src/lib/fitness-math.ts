/**
 * Cálculos de referência usados pelo FitLife.
 * IMPORTANTE: são estimativas populacionais (ex.: Mifflin-St Jeor), não prescrições clínicas.
 */
export type Sex = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";
export type Goal = "GAIN_MUSCLE" | "LOSE_FAT" | "CONDITIONING" | "STRENGTH" | "HEALTH" | "MAINTAIN" | "MOBILITY";

export function ageFrom(birthDate: Date, now = new Date()) {
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

export function bmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/** Taxa metabólica basal estimada (Mifflin-St Jeor). Para sexo não informado usa a média das fórmulas. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "MALE") return base + 5;
  if (sex === "FEMALE") return base - 161;
  return base - 78;
}

export function activityFactor(trainingDaysPerWeek: number) {
  if (trainingDaysPerWeek <= 1) return 1.2;
  if (trainingDaysPerWeek <= 3) return 1.375;
  if (trainingDaysPerWeek <= 5) return 1.55;
  return 1.725;
}

const GOAL_ADJUST: Record<Goal, number> = {
  GAIN_MUSCLE: 1.1,
  LOSE_FAT: 0.8,
  CONDITIONING: 1,
  STRENGTH: 1.05,
  HEALTH: 1,
  MAINTAIN: 1,
  MOBILITY: 1,
};

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  GAIN_MUSCLE: 1.8,
  LOSE_FAT: 1.8,
  CONDITIONING: 1.4,
  STRENGTH: 1.7,
  HEALTH: 1.2,
  MAINTAIN: 1.4,
  MOBILITY: 1.2,
};

export function estimateTargets(input: { sex: Sex; weightKg: number; heightCm: number; age: number; trainingDaysPerWeek: number; goal: Goal }) {
  const tdee = bmr(input.sex, input.weightKg, input.heightCm, input.age) * activityFactor(input.trainingDaysPerWeek);
  const calories = Math.max(1200, Math.round((tdee * GOAL_ADJUST[input.goal]) / 10) * 10);
  const protein = Math.round(input.weightKg * PROTEIN_G_PER_KG[input.goal]);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calorieTarget: calories, proteinTarget: protein, carbsTarget: carbs, fatTarget: fat, tdee: Math.round(tdee) };
}

/** 1RM estimado (Epley). Útil para detectar recordes pessoais com diferentes repetições. */
export function estimate1Rm(loadKg: number, reps: number) {
  if (reps <= 0 || loadKg <= 0) return 0;
  if (reps === 1) return loadKg;
  return Math.round(loadKg * (1 + reps / 30) * 10) / 10;
}

/** XP necessário acumulado para alcançar um nível (curva suave). */
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 100) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - cur, needed: next - cur, pct: next === cur ? 100 : ((xp - cur) / (next - cur)) * 100 };
}

/** Sequência de dias consecutivos terminando hoje (ou ontem, para não "quebrar" antes do fim do dia). */
export function streakFromKeys(keys: Iterable<string>, today: string) {
  const set = new Set(keys);
  const prev = (k: string) => {
    const d = new Date(`${k}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  let cursor = set.has(today) ? today : prev(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = prev(cursor);
  }
  return streak;
}

export function longestStreak(keys: Iterable<string>) {
  const sorted = [...new Set(keys)].sort();
  let best = 0;
  let run = 0;
  let last: number | null = null;
  for (const k of sorted) {
    const t = Date.parse(`${k}T00:00:00Z`) / 86400_000;
    run = last !== null && t - last === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    last = t;
  }
  return best;
}

export function waterTargetMl(weightKg: number) {
  return Math.round(Math.min(5000, Math.max(1500, weightKg * 35)) / 100) * 100;
}
