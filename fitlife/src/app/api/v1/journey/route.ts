import { route } from "@/server/http";
import { journey } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ req, user }) => journey(user.id, { cursor: req.nextUrl.searchParams.get("cursor") ?? undefined, kind: req.nextUrl.searchParams.get("kind") ?? undefined }));
