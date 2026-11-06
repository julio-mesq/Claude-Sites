import { route } from "@/server/http";
import { db } from "@/server/db";
import { Errors } from "@/server/errors";
import { deleteStoredFile, readStoredFile, storeImage } from "@/server/storage";
export const GET = route({ role: "USER" }, async ({ user, req }) => {
  const target = req.nextUrl.searchParams.get("u") ?? user.id;
  const p = await db.profile.findUnique({ where: { userId: target }, select: { avatarPath: true, user: { select: { preferences: { select: { communityEnabled: true } } } } } });
  // Avatares de terceiros só são visíveis para quem participa da comunidade.
  if (!p?.avatarPath || (target !== user.id && !p.user.preferences?.communityEnabled)) throw Errors.notFound("Avatar");
  const buf = await readStoredFile(p.avatarPath);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": p.avatarPath.endsWith(".png") ? "image/png" : p.avatarPath.endsWith(".webp") ? "image/webp" : "image/jpeg", "Cache-Control": "private, max-age=300" } });
});
export const POST = route({ role: "USER", limit: { name: "avatar", max: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("Envie uma imagem.");
  const stored = await storeImage(`avatars/${user.id}`, file, 3 * 1024 * 1024);
  const prev = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarPath: true } });
  await db.profile.update({ where: { userId: user.id }, data: { avatarPath: stored.storagePath } });
  if (prev?.avatarPath) await deleteStoredFile(prev.avatarPath);
  return { ok: true };
});
export const DELETE = route({ role: "USER" }, async ({ user }) => {
  const prev = await db.profile.findUnique({ where: { userId: user.id }, select: { avatarPath: true } });
  await db.profile.update({ where: { userId: user.id }, data: { avatarPath: null } });
  if (prev?.avatarPath) await deleteStoredFile(prev.avatarPath);
  return { ok: true };
});
