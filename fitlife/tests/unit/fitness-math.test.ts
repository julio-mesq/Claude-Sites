import { describe, expect, it } from "vitest";
import { ageFrom, bmi, bmr, estimate1Rm, estimateTargets, levelFromXp, levelProgress, longestStreak, streakFromKeys, waterTargetMl, xpForLevel } from "@/lib/fitness-math";

describe("estimativas fisiológicas", () => {
  it("calcula a TMB por Mifflin-St Jeor", () => {
    expect(bmr("MALE", 80, 180, 30)).toBe(1780);
    expect(bmr("FEMALE", 60, 165, 30)).toBeCloseTo(1320.25, 2);
  });
  it("gera metas coerentes e com piso calórico", () => {
    const t = estimateTargets({ sex: "FEMALE", weightKg: 50, heightCm: 155, age: 60, trainingDaysPerWeek: 1, goal: "LOSE_FAT" });
    expect(t.calorieTarget).toBeGreaterThanOrEqual(1200);
    expect(t.proteinTarget).toBe(90);
    expect(t.carbsTarget).toBeGreaterThanOrEqual(0);
  });
  it("ganho de massa tem mais calorias que perda de gordura", () => {
    const base = { sex: "MALE" as const, weightKg: 75, heightCm: 178, age: 28, trainingDaysPerWeek: 4 };
    expect(estimateTargets({ ...base, goal: "GAIN_MUSCLE" }).calorieTarget).toBeGreaterThan(estimateTargets({ ...base, goal: "LOSE_FAT" }).calorieTarget);
  });
  it("IMC e idade", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
    expect(ageFrom(new Date(2000, 5, 15), new Date(2026, 5, 14))).toBe(25);
    expect(ageFrom(new Date(2000, 5, 15), new Date(2026, 5, 15))).toBe(26);
  });
  it("meta de água com limites", () => {
    expect(waterTargetMl(70)).toBe(2500);
    expect(waterTargetMl(20)).toBe(1500);
    expect(waterTargetMl(300)).toBe(5000);
  });
});

describe("1RM (Epley)", () => {
  it("retorna a própria carga para 1 repetição e 0 para entradas inválidas", () => {
    expect(estimate1Rm(100, 1)).toBe(100);
    expect(estimate1Rm(100, 10)).toBeCloseTo(133.3, 1);
    expect(estimate1Rm(0, 5)).toBe(0);
  });
});

describe("níveis", () => {
  it("curva monotônica", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    for (let l = 2; l < 30; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });
  it("nível a partir do XP", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    const p = levelProgress(150);
    expect(p.level).toBe(2);
    expect(p.pct).toBeGreaterThan(0);
    expect(p.pct).toBeLessThan(100);
  });
});

describe("sequências", () => {
  it("conta dias consecutivos até hoje ou ontem", () => {
    expect(streakFromKeys(["2026-11-04", "2026-11-05", "2026-11-06"], "2026-11-06")).toBe(3);
    expect(streakFromKeys(["2026-11-04", "2026-11-05"], "2026-11-06")).toBe(2);
    expect(streakFromKeys(["2026-11-03"], "2026-11-06")).toBe(0);
    expect(streakFromKeys([], "2026-11-06")).toBe(0);
  });
  it("atravessa virada de mês", () => {
    expect(streakFromKeys(["2026-10-30", "2026-10-31", "2026-11-01"], "2026-11-01")).toBe(3);
  });
  it("maior sequência histórica", () => {
    expect(longestStreak(["2026-01-01", "2026-01-02", "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-07"])).toBe(3);
  });
});
