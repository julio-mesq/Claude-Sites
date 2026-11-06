import { afterAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { Client, PASSWORD, db, hashToken, newUser, uniqueEmail } from "./client";

afterAll(async () => db.$disconnect());

describe("autenticação", () => {
  it("cadastro cria sessão, perfil, preferências e assinatura Free; senha não fica em texto puro", async () => {
    const { c, user } = await newUser("reg", false);
    const me = await c.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.data.user.email).toBe(user.email);
    expect(user.passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(user.passwordHash).not.toContain(PASSWORD);
    const sub = await db.subscription.findUnique({ where: { userId: user.id } });
    expect(sub?.plan).toBe("FREE");
    expect(user.termsAcceptedAt).not.toBeNull();
  });

  it("impede e-mail duplicado e dados inválidos", async () => {
    const { email } = await newUser("dup", false);
    const c = new Client();
    const r = await c.post("/auth/register", { name: "Outro", email, password: PASSWORD, confirmPassword: PASSWORD, acceptTerms: true });
    expect(r.status).toBe(409);
    const bad = await c.post("/auth/register", { name: "X", email: "invalido", password: "123", confirmPassword: "123", acceptTerms: false });
    expect(bad.status).toBe(422);
  });

  it("login, rotas protegidas e logout", async () => {
    const { email } = await newUser("login", false);
    const c = new Client();
    expect((await c.get("/auth/me")).status).toBe(401);
    expect((await c.post("/auth/login", { email, password: "Errada@123" })).status).toBe(400);
    const ok = await c.post("/auth/login", { email: email.toUpperCase(), password: PASSWORD });
    expect(ok.status).toBe(200);
    expect(ok.data.next).toBe("/onboarding");
    expect((await c.get("/auth/me")).status).toBe(200);
    expect((await c.post("/auth/logout")).status).toBe(200);
    expect((await c.get("/auth/me")).status).toBe(401);
  });

  it("mensagem genérica para e-mail inexistente (sem enumeração)", async () => {
    const c = new Client();
    const r = await c.post("/auth/login", { email: uniqueEmail("ghost"), password: PASSWORD });
    expect(r.status).toBe(400);
    expect(r.data.error.message).toBe("E-mail ou senha incorretos.");
    const f = await c.post("/auth/forgot", { email: uniqueEmail("ghost") });
    expect(f.status).toBe(200);
  });

  it("recuperação de senha: token de uso único e encerramento de sessões", async () => {
    const { c, email, user } = await newUser("reset", false);
    expect((await new Client().post("/auth/forgot", { email })).status).toBe(200);
    expect(await db.verificationToken.count({ where: { userId: user.id, type: "PASSWORD_RESET" } })).toBe(1);
    // O token real só existe no e-mail; o teste cria um token conhecido diretamente no banco.
    const token = randomBytes(32).toString("base64url");
    await db.verificationToken.create({ data: { userId: user.id, type: "PASSWORD_RESET", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 600_000) } });
    const anon = new Client();
    const r = await anon.post("/auth/reset", { token, password: "NovaSenha@99", confirmPassword: "NovaSenha@99" });
    expect(r.status).toBe(200);
    expect((await anon.post("/auth/reset", { token, password: "Outra@9999", confirmPassword: "Outra@9999" })).status).toBe(400);
    expect((await c.get("/auth/me")).status).toBe(401);
    const login = new Client();
    expect((await login.post("/auth/login", { email, password: PASSWORD })).status).toBe(400);
    expect((await login.post("/auth/login", { email, password: "NovaSenha@99" })).status).toBe(200);
  });

  it("token expirado é recusado", async () => {
    const { user } = await newUser("expired", false);
    const token = randomBytes(32).toString("base64url");
    await db.verificationToken.create({ data: { userId: user.id, type: "PASSWORD_RESET", tokenHash: hashToken(token), expiresAt: new Date(Date.now() - 1000) } });
    expect((await new Client().post("/auth/reset", { token, password: "NovaSenha@99", confirmPassword: "NovaSenha@99" })).status).toBe(400);
  });

  it("confirmação de e-mail", async () => {
    const { c, user } = await newUser("verify", false);
    const token = randomBytes(32).toString("base64url");
    await db.verificationToken.create({ data: { userId: user.id, type: "EMAIL_VERIFY", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 600_000) } });
    expect((await c.post("/auth/verify", { token })).status).toBe(200);
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt).not.toBeNull();
  });

  it("alteração de senha encerra as outras sessões e mantém a atual", async () => {
    const { c, email } = await newUser("chpw", false);
    const other = new Client();
    await other.post("/auth/login", { email, password: PASSWORD });
    const sessions = await c.get("/auth/sessions");
    expect(sessions.data.items.length).toBe(2);
    expect((await c.put("/auth/password", { currentPassword: "Errada@123", password: "Nova@12345", confirmPassword: "Nova@12345" })).status).toBe(400);
    expect((await c.put("/auth/password", { currentPassword: PASSWORD, password: "Nova@12345", confirmPassword: "Nova@12345" })).status).toBe(200);
    expect((await c.get("/auth/me")).status).toBe(200);
    expect((await other.get("/auth/me")).status).toBe(401);
  });

  it("exclusão de conta remove todos os dados (LGPD)", async () => {
    const { c, user } = await newUser("delete");
    expect((await c.del("/account", { password: PASSWORD, confirm: "errado" })).status).toBe(422);
    expect((await c.del("/account", { password: "Errada@123", confirm: "EXCLUIR" })).status).toBe(400);
    expect((await c.del("/account", { password: PASSWORD, confirm: "EXCLUIR" })).status).toBe(200);
    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await db.workout.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.bodyMeasurement.count({ where: { userId: user.id } })).toBe(0);
  });

  it("exportação de dados retorna JSON completo sem hash de senha", async () => {
    const { c } = await newUser("export");
    const r = await c.get("/account/export");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-disposition")).toContain("attachment");
    expect(r.data.data.profile.heightCm).toBe(178);
    expect(JSON.stringify(r.data)).not.toContain("argon2");
  });
});

describe("segurança HTTP", () => {
  it("bloqueia requisições mutáveis sem Origin ou de outra origem (CSRF)", async () => {
    const { c } = await newUser("csrf", false);
    expect((await c.req("POST", "/habits", { name: "Teste" }, { origin: null })).status).toBe(403);
    expect((await c.req("POST", "/habits", { name: "Teste" }, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("aplica rate limit no login por e-mail", async () => {
    const c = new Client();
    const email = uniqueEmail("rl");
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) statuses.push((await c.post("/auth/login", { email, password: "Errada@123" })).status);
    expect(statuses).toContain(429);
  });

  it("envia cabeçalhos de segurança", async () => {
    const res = await fetch(`${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/`);
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(res.headers.get("x-powered-by")).toBeNull();
  });

  it("cookie de sessão é HttpOnly e SameSite", async () => {
    const c = new Client();
    const res = await fetch(`${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: process.env.TEST_BASE_URL ?? "http://localhost:3000", "X-Forwarded-For": c.ip },
      body: JSON.stringify({ name: "Cookie Teste", email: uniqueEmail("cookie"), password: PASSWORD, confirmPassword: PASSWORD, acceptTerms: true }),
    });
    const set = res.headers.get("set-cookie") ?? "";
    expect(set).toMatch(/HttpOnly/i);
    expect(set).toMatch(/SameSite=lax/i);
    void c;
  });
});

describe("limite de cadastro", () => {
  it("cada tentativa conta uma única vez e permite vários cadastros na mesma rede", async () => {
    const c = new Client();
    for (let i = 0; i < 8; i++) {
      const r = await c.post("/auth/register", { name: "Pessoa Rede", email: uniqueEmail(`net${i}`), password: PASSWORD, confirmPassword: PASSWORD, acceptTerms: true });
      expect(r.status, `cadastro ${i + 1}`).toBe(200);
      c.cookie = "";
    }
    const extra = [];
    for (let i = 0; i < 3; i++) extra.push((await c.post("/auth/register", { name: "Pessoa Rede", email: uniqueEmail(`netx${i}`), password: PASSWORD, confirmPassword: PASSWORD, acceptTerms: true })).status);
    expect(extra).toContain(429);
  });
});
