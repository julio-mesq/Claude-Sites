import { z } from "zod";
import { route } from "@/server/http";
import { Errors } from "@/server/errors";
import { listPhotos, uploadPhoto } from "@/server/services/progress";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listPhotos(user.id) }));
const meta = z.object({ pose: z.enum(["front", "side", "back"]), takenAt: z.coerce.date(), notes: z.string().trim().max(300).optional().nullable() });
export const POST = route({ role: "USER", limit: { name: "photos", max: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("Envie uma imagem.");
  const m = meta.parse({ pose: form.get("pose"), takenAt: form.get("takenAt"), notes: form.get("notes") || null });
  const p = await uploadPhoto(user.id, file, m);
  return { id: p.id };
});
