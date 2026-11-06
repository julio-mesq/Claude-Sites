import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "./auth/crypto";
import { env } from "./env";
import { Errors } from "./errors";

const ROOT = path.resolve(env.STORAGE_DIR);
const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Verifica a assinatura real do arquivo (magic bytes), não apenas o MIME declarado. */
function sniff(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

/**
 * Armazenamento local privado (fora de /public). Arquivos só são servidos por rotas autenticadas.
 * Em produção, substitua por S3/R2/Supabase Storage implementando as mesmas funções.
 */
export async function storeImage(scope: string, file: File, maxBytes = 8 * 1024 * 1024) {
  if (file.size > maxBytes) throw Errors.badRequest(`Arquivo muito grande (máx. ${Math.round(maxBytes / 1024 / 1024)} MB).`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime || !ALLOWED[mime]) throw Errors.badRequest("Formato não suportado. Envie JPG, PNG ou WebP.");
  const rel = path.join(scope.replace(/[^a-zA-Z0-9_-]/g, ""), `${randomToken(16)}.${ALLOWED[mime]}`);
  const abs = path.join(ROOT, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf, { mode: 0o600 });
  return { storagePath: rel, mimeType: mime, sizeBytes: buf.length };
}

function safe(rel: string) {
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) throw Errors.forbidden();
  return abs;
}

export async function readStoredFile(rel: string) {
  return readFile(safe(rel));
}

export async function deleteStoredFile(rel: string) {
  await rm(safe(rel), { force: true });
}
