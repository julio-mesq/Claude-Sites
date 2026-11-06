import { route } from "@/server/http";
import { readStoredFile } from "@/server/storage";
import { deletePhoto, getPhotoForOwner } from "@/server/services/progress";
// Fotos são servidas apenas ao dono, sem cache compartilhado.
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  const p = await getPhotoForOwner(user.id, params.id);
  const buf = await readStoredFile(p.storagePath);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": p.mimeType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
});
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deletePhoto(user.id, params.id);
  return { ok: true };
});
