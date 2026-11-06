import { expect, test } from "@playwright/test";
import { onboard, register, testIp } from "./helpers";

test.use({ extraHTTPHeaders: { "X-Forwarded-For": testIp() } });

test("experiência mobile: menu inferior, sem rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await register(page, "mobile");
  await onboard(page);
  const nav = page.getByRole("navigation", { name: "Navegação inferior" });
  await expect(nav).toBeVisible();
  for (const path of ["/app", "/app/workouts", "/app/nutrition", "/app/progress", "/app/calendar", "/app/coach", "/app/settings"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
  }
  await nav.getByRole("button", { name: "Mais opções" }).click();
  await page.getByRole("dialog", { name: "Todas as áreas" }).getByRole("link", { name: "Hábitos" }).click();
  await expect(page).toHaveURL(/\/app\/habits/);
});
