import { route } from "@/server/http";
import { listHistory } from "@/server/services/workouts";
export const GET = route({ role: "USER" }, async ({ req, user }) => listHistory(user.id, { cursor: req.nextUrl.searchParams.get("cursor") ?? undefined }));
