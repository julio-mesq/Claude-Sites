import "server-only";

type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const min: Level = process.env.NODE_ENV === "production" ? "info" : "debug";

// Campos que nunca devem aparecer em logs.
const REDACT = /pass(word)?|token|secret|authorization|cookie|apikey|api_key/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = REDACT.test(k) ? "[redacted]" : redact(v, depth + 1);
  return out;
}

function write(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (order[level] < order[min] || process.env.FITLIFE_SILENT_LOGS === "1") return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...(meta ? (redact(meta) as object) : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => write("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
};
