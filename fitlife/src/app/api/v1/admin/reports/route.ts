import { z } from "zod";
import { route, query } from "@/server/http";
import { listReports } from "@/server/services/admin";
export const GET = route({ role: "MODERATOR" }, async ({ req }) => ({ items: await listReports(query(req, z.object({ status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]).default("OPEN") })).status) }));
