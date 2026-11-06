import { describe, expect, it } from "vitest";
import { passwordStrength, registerSchema, resetSchema } from "@/lib/validations/auth";
import { onboardingSchema } from "@/lib/validations/profile";
import { logSetSchema, workoutSchema } from "@/lib/validations/fitness";
import { mealEntrySchema } from "@/lib/validations/nutrition";
import { measurementSchema, reportSchema } from "@/lib/validations/tracking";

const okReg = { name: "Ana Souza", email: "ANA@Email.com ", password: "Senha@123", confirmPassword: "Senha@123", acceptTerms: true };

describe("cadastro", () => {
  it("normaliza e-mail", () => {
    expect(registerSchema.parse(okReg).email).toBe("ana@email.com");
  });
  it("rejeita senhas fracas, divergentes e termos não aceitos", () => {
    expect(registerSchema.safeParse({ ...okReg, password: "abc", confirmPassword: "abc" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...okReg, password: "semnumeroA", confirmPassword: "semnumeroA" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...okReg, confirmPassword: "Outra@123" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...okReg, acceptTerms: false }).success).toBe(false);
  });
  it("rejeita nomes com caracteres de marcação", () => {
    expect(registerSchema.safeParse({ ...okReg, name: "<script>" }).success).toBe(false);
  });
  it("força da senha", () => {
    expect(passwordStrength("")).toBe(0);
    expect(passwordStrength("Senha@12345678")).toBe(4);
  });
  it("reset exige token", () => {
    expect(resetSchema.safeParse({ token: "x", password: "Senha@123", confirmPassword: "Senha@123" }).success).toBe(false);
  });
});

describe("onboarding", () => {
  const base = { birthDate: "1995-01-01", heightCm: 170, weightKg: 70, goal: "HEALTH", experience: "BEGINNER", trainingDaysPerWeek: 3, location: "HOME", sessionMinutes: 30 };
  it("aceita perfil válido com defaults", () => {
    const r = onboardingSchema.parse(base);
    expect(r.equipment).toEqual([]);
    expect(r.sex).toBe("UNDISCLOSED");
  });
  it("bloqueia menores de 16 anos e valores implausíveis", () => {
    const y = new Date().getFullYear() - 10;
    expect(onboardingSchema.safeParse({ ...base, birthDate: `${y}-01-01` }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, weightKg: 10 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, trainingDaysPerWeek: 9 }).success).toBe(false);
  });
});

describe("treinos", () => {
  it("valida faixa de repetições", () => {
    const item = { exerciseId: "x", sets: 3, reps: "8-12", restSec: 60 };
    expect(workoutSchema.safeParse({ name: "Treino A", items: [item] }).success).toBe(true);
    expect(workoutSchema.safeParse({ name: "Treino A", items: [{ ...item, reps: "muitas" }] }).success).toBe(false);
    expect(workoutSchema.safeParse({ name: "Treino A", items: [] }).success).toBe(false);
  });
  it("série exige repetições, tempo ou distância", () => {
    expect(logSetSchema.safeParse({ exerciseId: "x", setNumber: 1 }).success).toBe(false);
    expect(logSetSchema.safeParse({ exerciseId: "x", setNumber: 1, reps: 10, loadKg: 40 }).success).toBe(true);
    expect(logSetSchema.safeParse({ exerciseId: "x", setNumber: 1, distanceKm: 5 }).success).toBe(true);
  });
});

describe("nutrição e medidas", () => {
  it("rejeita macros negativos e datas inválidas", () => {
    const e = { date: "2026-11-06", mealType: "LUNCH", name: "Arroz", quantity: 100, unit: "g", calories: 130, proteinG: 2.5, carbsG: 28, fatG: 0.3 };
    expect(mealEntrySchema.safeParse(e).success).toBe(true);
    expect(mealEntrySchema.safeParse({ ...e, proteinG: -1 }).success).toBe(false);
    expect(mealEntrySchema.safeParse({ ...e, date: "06/11/2026" }).success).toBe(false);
  });
  it("percentual de gordura exige método e ao menos uma medida", () => {
    expect(measurementSchema.safeParse({ measuredAt: new Date(), bodyFatPct: 18 }).success).toBe(false);
    expect(measurementSchema.safeParse({ measuredAt: new Date(), bodyFatPct: 18, bodyFatMethod: "Bioimpedância" }).success).toBe(true);
    expect(measurementSchema.safeParse({ measuredAt: new Date() }).success).toBe(false);
  });
  it("denúncia precisa de alvo", () => {
    expect(reportSchema.safeParse({ reason: "spam" }).success).toBe(false);
  });
});
