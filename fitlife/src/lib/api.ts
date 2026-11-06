"use client";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string[]>) {
    super(message);
  }
}

type Opts = Omit<RequestInit, "body"> & { body?: unknown };

/** Cliente HTTP para a API REST do FitLife. Lança ApiError com mensagem amigável. */
export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      ...opts,
      headers: { ...(isForm || opts.body === undefined ? {} : { "Content-Type": "application/json" }), ...(opts.headers ?? {}) },
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "OFFLINE", "Sem conexão. Verifique sua internet e tente novamente.");
  }
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? "Algo deu errado. Tente novamente.", err.fields);
  }
  return data as T;
}
