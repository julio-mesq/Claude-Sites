import { expect, type Page } from "@playwright/test";

export const PASSWORD = "Teste@1234";
export const email = (tag: string) => `e2e-${tag}-${Date.now()}@fitlife.test`;

export async function register(page: Page, tag: string) {
  const e = email(tag);
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Pessoa Teste");
  await page.getByLabel("E-mail").fill(e);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/onboarding");
  return e;
}

export async function onboard(page: Page) {
  await page.getByLabel("Data de nascimento").fill("1990-08-20");
  await page.getByLabel("Altura (cm)").fill("172");
  await page.getByLabel("Peso (kg)").fill("74");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Ganhar força" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Iniciante" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Casa" }).click();
  await page.getByRole("button", { name: "Halteres" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Criar meu plano" }).click();
  await expect(page.getByText("Tudo pronto")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Ir para o dashboard" }).click();
  await page.waitForURL("**/app");
}

/** IP simulado por arquivo de teste, para não esbarrar no rate limit de cadastro por IP. */
export const testIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
