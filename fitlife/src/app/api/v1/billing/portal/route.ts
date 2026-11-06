import { route } from "@/server/http";
import { createPortal } from "@/server/services/billing";
export const POST = route({ role: "USER" }, async ({ user }) => createPortal(user.id));
