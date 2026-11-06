import { expect, test } from "@playwright/test";
import { PASSWORD, onboard, register, testIp } from "./helpers";

test.use({ extraHTTPHeaders: { "X-Forwarded-For": testIp() } });

test("landing page apresenta hero, planos e FAQ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("SEU PRÓXIMO NÍVEL");
  await expect(page.getByRole("link", { name: /Começar gratuitamente/ })).toBeVisible();
  await expect(page.getByText("FitLife Pro").first()).toBeVisible();
  await expect(page.getByText("Depoimentos demonstrativos")).toBeVisible();
  await page.getByText("O FitLife é gratuito?").click();
  await expect(page.getByText(/O plano Free inclui/)).toBeVisible();
});

test("rotas protegidas redirecionam para o login", async ({ page }) => {
  await page.goto("/app/workouts");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fworkouts/);
});

test("jornada completa: cadastro, onboarding, treino, nutrição, hábito, logout e login", async ({ page }) => {
  const email = await register(page, "journey");
  await onboard(page);
  await expect(page.getByRole("heading", { name: /Pessoa/ })).toBeVisible();
  await expect(page.getByText("Próximo treino")).toBeVisible();

  // Treino: iniciar pelo dashboard e registrar uma série.
  await page.getByRole("button", { name: "Iniciar treino" }).first().click();
  await page.waitForURL("**/app/workouts/session/**");
  const repsField = page.getByLabel("Repetições realizadas");
  if (await repsField.isVisible()) {
    await page.getByLabel("Carga em kg").fill("12");
    await repsField.fill("10");
  } else {
    await page.getByLabel(/Tempo \(min\)/).fill("10");
  }
  await page.getByRole("button", { name: /Concluir série 1/ }).click();
  await expect(page.getByRole("button", { name: "Pular descanso" }).or(page.getByText(/concluído/))).toBeVisible();
  await page.getByRole("button", { name: "Finalizar treino" }).last().click();
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await expect(page.getByText("Treino concluído").first()).toBeVisible({ timeout: 20_000 });

  // Nutrição: registro manual.
  await page.goto("/app/nutrition");
  await page.getByRole("button", { name: "Adicionar" }).first().click();
  await page.getByRole("tab", { name: "Registrar manualmente" }).click();
  await page.getByLabel("Alimento", { exact: true }).fill("Iogurte natural");
  await page.getByLabel("Calorias (kcal)").fill("120");
  await page.getByLabel("Proteínas (g)").fill("8");
  await page.getByLabel("Carboidratos (g)").fill("10");
  await page.getByLabel("Gorduras (g)").fill("5");
  await page.getByRole("button", { name: "Adicionar ao diário" }).click();
  await expect(page.getByText("Iogurte natural", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+250ml" }).click();
  await expect(page.getByText(/0,25 \//)).toBeVisible();

  // Hábito: marcar hoje.
  await page.goto("/app/habits");
  const first = page.getByRole("button", { name: /^Marcar .* hoje$/ }).first();
  await first.click();
  await expect(page.getByRole("button", { name: /^Desmarcar .* hoje$/ }).first()).toBeVisible();

  // Logout e login novamente.
  await page.getByRole("button", { name: "Menu do perfil" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await page.waitForURL("**/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/app");
  await expect(page.getByText("Treinos realizados")).toBeVisible();
});

test("criador de treinos: adicionar, reordenar e salvar", async ({ page }) => {
  await register(page, "builder");
  await onboard(page);
  await page.goto("/app/workouts/new");
  await page.getByLabel("Nome", { exact: true }).fill("Meu treino E2E");
  await page.getByRole("button", { name: "Adicionar exercício" }).click();
  await page.getByLabel("Buscar exercício").fill("Prancha");
  await page.getByRole("button", { name: /^Prancha Abdômen/ }).click();
  await page.getByLabel("Buscar exercício").fill("Flexão de braços");
  await page.getByRole("button", { name: /^Flexão de braços/ }).click();
  await page.getByRole("button", { name: "Concluir" }).click();
  await page.getByRole("button", { name: "Mover para cima" }).nth(1).click();
  await expect(page.locator("ol > li").first()).toContainText("Flexão de braços");
  await page.getByRole("button", { name: "Salvar treino" }).click();
  await page.waitForURL("**/app/workouts");
  await expect(page.getByRole("link", { name: "Meu treino E2E" })).toBeVisible();
});
