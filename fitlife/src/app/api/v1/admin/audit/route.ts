import { z } from "zod";
import { route, query } from "@/server/http";
import { listAudit } from "@/server/services/admin";
export const GET = route({ role: "ADMIN" }, async ({ req }) => listAudit(query(req, z.object({ action: z.string().max(60).optional(), page: z.coerce.number().int().min(1).default(1) }))));
