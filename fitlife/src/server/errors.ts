export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const Errors = {
  unauthorized: () => new AppError(401, "UNAUTHORIZED", "Faça login para continuar."),
  forbidden: (msg = "Você não tem permissão para esta ação.") => new AppError(403, "FORBIDDEN", msg),
  notFound: (what = "Recurso") => new AppError(404, "NOT_FOUND", `${what} não encontrado.`),
  conflict: (msg: string) => new AppError(409, "CONFLICT", msg),
  badRequest: (msg: string, details?: unknown) => new AppError(400, "BAD_REQUEST", msg, details),
  rateLimited: (retryAfterSec: number) =>
    new AppError(429, "RATE_LIMITED", `Muitas tentativas. Tente novamente em ${retryAfterSec}s.`, { retryAfterSec }),
  planRequired: (plan: string) => new AppError(402, "PLAN_REQUIRED", `Recurso disponível no plano ${plan}.`),
  unavailable: (msg: string) => new AppError(503, "UNAVAILABLE", msg),
};
