import { z } from "zod";
import { route, query } from "@/server/http";
import { listUsers } from "@/server/services/admin";
export const GET = route({ role: "ADMIN" }, async ({ req }) => {
  const q = query(req, z.object({ q: z.string().max(80).optional(), page: z.coerce.number().int().min(1).default(1) }));
  return listUsers(q.q, q.page);
});
