import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
export const db = new PrismaClient();

/** Cliente HTTP com cookie de sessão, simulando um navegador da mesma origem. */
export class Client {
  cookie = "";
  // Cada cliente simula um IP distinto (como chegaria via proxy reverso).
  ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  async req<T = any>(method: string, path: string, body?: unknown, opts: { origin?: string | null } = {}) {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.origin !== null) headers.Origin = opts.origin ?? BASE;
    if (this.cookie) headers.Cookie = this.cookie;
    headers["X-Forwarded-For"] = this.ip;
    const res = await fetch(`${BASE}/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    const set = res.headers.get("set-cookie");
    if (set?.startsWith("fl_session=")) {
      const v = set.split(";")[0]!;
      this.cookie = v === "fl_session=" ? "" : v;
    }
    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text);
    } catch {
      data = text as T;
    }
    return { status: res.status, data, headers: res.headers };
  }
  get = <T = any>(p: string) => this.req<T>("GET", p);
  post = <T = any>(p: string, b?: unknown) => this.req<T>("POST", p, b ?? {});
  put = <T = any>(p: string, b?: unknown) => this.req<T>("PUT", p, b);
  patch = <T = any>(p: string, b?: unknown) => this.req<T>("PATCH", p, b ?? {});
  del = <T = any>(p: string, b?: unknown) => this.req<T>("DELETE", p, b);
}

export const PASSWORD = "Teste@1234";
export const uniqueEmail = (tag: string) => `t-${tag.toLowerCase()}-${Date.now()}-${randomBytes(3).toString("hex")}@fitlife.test`;

export async function newUser(tag: string, onboard = true) {
  const c = new Client();
  const email = uniqueEmail(tag);
  const r = await c.post("/auth/register", { name: "Teste Automatizado", email, password: PASSWORD, confirmPassword: PASSWORD, acceptTerms: true });
  if (r.status !== 200) throw new Error(`register failed ${r.status} ${JSON.stringify(r.data)}`);
  if (onboard) {
    const o = await c.post("/onboarding", { birthDate: "1992-03-10", sex: "MALE", heightCm: 178, weightKg: 80, goal: "GAIN_MUSCLE", experience: "INTERMEDIATE", trainingDaysPerWeek: 4, location: "GYM", equipment: [], sessionMinutes: 60, dietaryPreferences: [], dietaryRestrictions: [], activityPreferences: [], hasHealthConditions: false });
    if (o.status !== 200) throw new Error(`onboarding failed ${o.status} ${JSON.stringify(o.data)}`);
  }
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  return { c, email, user };
}

export function hashToken(t: string) {
  return createHash("sha256").update(t).digest("hex");
}

export async function cleanupTestUsers() {
  await db.user.deleteMany({ where: { email: { endsWith: "@fitlife.test" } } });
}
