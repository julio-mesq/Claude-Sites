import { route, body } from "@/server/http";
import { commentSchema } from "@/lib/validations/tracking";
import { addComment, listComments } from "@/server/services/community";
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => ({ items: await listComments(user.id, params.id) }));
export const POST = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => addComment(user.id, params.id, (await body(req, commentSchema)).content));
