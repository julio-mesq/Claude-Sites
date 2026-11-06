import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "America/Sao_Paulo";

/** Chave de data local (AAAA-MM-DD) no fuso informado. */
export function dateKey(d: Date = new Date(), tz = APP_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Converte AAAA-MM-DD em Date UTC à meia-noite (formato de colunas @db.Date). */
export function keyToDate(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDaysKey(key: string, days: number) {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Segunda-feira da semana da data (AAAA-MM-DD). */
export function weekStartKey(key: string) {
  const d = keyToDate(key);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDaysKey(key, -dow);
}

export function formatNumber(n: number, digits = 0) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  const date = typeof d === "string" ? (d.length === 10 ? keyToDate(d) : new Date(d)) : d;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: typeof d === "string" && d.length === 10 ? "UTC" : APP_TIMEZONE, ...opts }).format(date);
}

export function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Deslocamento (min) do fuso em relação ao UTC no instante informado. */
function tzOffsetMinutes(at: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Instante UTC correspondente à meia-noite local da data (AAAA-MM-DD) no fuso. */
export function zonedStartOfDay(key: string, tz = APP_TIMEZONE) {
  const guess = new Date(`${key}T00:00:00.000Z`);
  return new Date(guess.getTime() - tzOffsetMinutes(guess, tz) * 60000);
}
