import { describe, expect, it } from "vitest";
import { can, hasRole, PLAN_LIMITS } from "@/server/permissions";
import { mapOffProduct } from "@/server/services/food-db";

describe("permissões", () => {
  it("hierarquia de papéis", () => {
    expect(hasRole("ADMIN", "MODERATOR")).toBe(true);
    expect(hasRole("USER", "MODERATOR")).toBe(false);
    expect(hasRole("PROFESSIONAL", "USER")).toBe(true);
  });
  it("matriz de permissões", () => {
    expect(can("MODERATOR", "moderation:act")).toBe(true);
    expect(can("MODERATOR", "admin:users")).toBe(false);
    expect(can("ADMIN", "admin:settings")).toBe(true);
    expect(can("USER", "admin:access")).toBe(false);
  });
  it("limites crescem por plano", () => {
    expect(PLAN_LIMITS.PRO.aiMessagesPerDay).toBeGreaterThan(PLAN_LIMITS.FREE.aiMessagesPerDay);
    expect(PLAN_LIMITS.ELITE.aiMessagesPerDay).toBeGreaterThan(PLAN_LIMITS.PRO.aiMessagesPerDay);
    expect(PLAN_LIMITS.FREE.advancedReports).toBe(false);
  });
});

describe("integração Open Food Facts (mapeamento)", () => {
  it("mapeia produto completo e descarta incompletos", () => {
    expect(mapOffProduct({ product_name: "Aveia", brands: "Marca X, Y", nutriments: { "energy-kcal_100g": 380, proteins_100g: 13, carbohydrates_100g: 60, fat_100g: 7 } })).toMatchObject({ name: "Aveia", brand: "Marca X", calories: 380, source: "openfoodfacts" });
    expect(mapOffProduct({ product_name: "Sem dados", nutriments: { proteins_100g: 1 } })).toBeNull();
    expect(mapOffProduct({ product_name: "kJ", nutriments: { energy_100g: 1674, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } })?.calories).toBe(400);
  });
});
