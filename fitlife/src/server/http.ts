import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import type { Role } from "@prisma/client";
import { AppError, Errors } from "./errors";
import { logger } from "./logger";
import { getSessionUser, type SessionUser } from "./auth/session";
import { hasRole } from "./permissions";
import { rateLimit } from "./rate-limit";
import { env } from "./env";

type Ctx<P> = { req: NextRequest; params: P; ip: string };
type AuthedCtx<P> = Ctx<P> & { user: SessionUser };

type Options = {
  /** Papel mínimo exigido. Omitir = rota pública. */
  role?: Role;
  /** Limite por IP (ou por usuário, se autenticado) por janela. */
  limit?: { name: string; max: number; windowSec: number };
  /** Rotas que recebem chamadas externas (webhooks) não exigem Origin. */
  skipOriginCheck?: boolean;
};

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function ipOf(req: NextRequest) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** Proteção CSRF: cookies SameSite=Lax + verificação de Origin/Referer em métodos mutáveis. */
function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) throw Errors.forbidden("Origem da requisição ausente.");
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    throw Errors.forbidden("Origem inválida.");
  }
  const allowed = new Set([req.nextUrl.host, req.headers.get("host") ?? "", new URL(env.APP_URL).host]);
  if (!allowed.has(host)) throw Errors.forbidden("Origem não permitida.");
}

export function toErrorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: err.issues[0]?.message ?? "Dados inválidos.", fields: err.flatten().fieldErrors } },
      { status: 422 },
    );
  }
  if (err instanceof AppError) {
    const res = NextResponse.json({ error: { code: err.code, message: err.message, details: err.details } }, { status: err.status });
    if (err.status === 429 && err.details && typeof err.details === "object" && "retryAfterSec" in err.details) {
      res.headers.set("Retry-After", String((err.details as { retryAfterSec: number }).retryAfterSec));
    }
    return res;
  }
  logger.error("api.unhandled", { err });
  return NextResponse.json({ error: { code: "INTERNAL", message: "Erro interno. Tente novamente." } }, { status: 500 });
}

export function route<P = Record<string, string>>(
  opts: Options & { role: Role },
  fn: (ctx: AuthedCtx<P>) => Promise<Response | unknown>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<Response>;
export function route<P = Record<string, string>>(
  opts: Options,
  fn: (ctx: Ctx<P> & { user: SessionUser | null }) => Promise<Response | unknown>,
): (req: NextRequest, ctx: { params: Promise<P> }) => Promise<Response>;
export function route<P>(opts: Options, fn: (ctx: AuthedCtx<P>) => Promise<Response | unknown>) {
  return async (req: NextRequest, context: { params: Promise<P> }) => {
    const started = Date.now();
    try {
      if (MUTATING.has(req.method) && !opts.skipOriginCheck) assertSameOrigin(req);
      const user = await getSessionUser();
      if (opts.role) {
        if (!user) throw Errors.unauthorized();
        if (!hasRole(user.role, opts.role)) throw Errors.forbidden();
      }
      const ip = ipOf(req);
      if (opts.limit) await rateLimit(`${opts.limit.name}:${user?.id ?? ip}`, opts.limit.max, opts.limit.windowSec);
      const params = (await context.params) ?? ({} as P);
      const result = await fn({ req, params, ip, user: user as SessionUser });
      const res = result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
      res.headers.set("Cache-Control", "no-store");
      return res;
    } catch (err) {
      return toErrorResponse(err);
    } finally {
      const ms = Date.now() - started;
      if (ms > 1500) logger.warn("api.slow", { path: req.nextUrl.pathname, method: req.method, ms });
    }
  };
}

export async function body<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw Errors.badRequest("Corpo JSON inválido.");
  }
  return schema.parse(json);
}

export function query<S extends ZodTypeAny>(req: NextRequest, schema: S): z.output<S> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
}
