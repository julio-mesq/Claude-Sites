import { route, body } from "@/server/http";
import { postSchema } from "@/lib/validations/tracking";
import { createPost, feed } from "@/server/services/community";
export const GET = route({ role: "USER" }, async ({ req, user }) => feed(user.id, { cursor: req.nextUrl.searchParams.get("cursor") ?? undefined, scope: req.nextUrl.searchParams.get("scope") === "following" ? "following" : "all" }));
export const POST = route({ role: "USER" }, async ({ req, user }) => createPost(user.id, await body(req, postSchema)));
