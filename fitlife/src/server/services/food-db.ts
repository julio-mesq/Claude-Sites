import "server-only";
import { logger } from "../logger";

/**
 * Integração opcional com o Open Food Facts (base pública e colaborativa, sem chave de API).
 * Ativada com NUTRITION_PROVIDER=openfoodfacts. Os valores retornados indicam a fonte e
 * devem ser conferidos pelo usuário com o rótulo do produto.
 */
export const externalFoodEnabled = process.env.NUTRITION_PROVIDER === "openfoodfacts";

type OffProduct = { product_name?: string; brands?: string; nutriments?: Record<string, number | string | undefined>; code?: string };

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

export function mapOffProduct(p: OffProduct) {
  const n = p.nutriments ?? {};
  const kcal = num(n["energy-kcal_100g"]) ?? (num(n["energy_100g"]) != null ? Math.round(num(n["energy_100g"])! / 4.184) : null);
  const protein = num(n["proteins_100g"]);
  const carbs = num(n["carbohydrates_100g"]);
  const fat = num(n["fat_100g"]);
  if (!p.product_name || kcal == null || protein == null || carbs == null || fat == null) return null;
  return { externalId: p.code ?? null, name: p.product_name.slice(0, 120), brand: p.brands?.split(",")[0]?.trim().slice(0, 80) || null, servingQty: 100, servingUnit: "g", calories: Math.round(kcal), proteinG: protein, carbsG: carbs, fatG: fat, source: "openfoodfacts" as const };
}

export async function searchExternalFoods(q: string) {
  if (!externalFoodEnabled || q.trim().length < 2) return [];
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", q);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "15");
  url.searchParams.set("fields", "code,product_name,brands,nutriments");
  try {
    const res = await fetch(url, { headers: { "User-Agent": "FitLife/0.1 (nutrition search)" }, signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { products?: OffProduct[] };
    return (json.products ?? []).map(mapOffProduct).filter((x): x is NonNullable<typeof x> => x !== null);
  } catch (err) {
    logger.warn("food_db.search_failed", { err });
    return [];
  }
}
