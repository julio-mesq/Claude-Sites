import { route } from "@/server/http";
import { sendVerification } from "@/server/services/auth";
export const POST = route({ role: "USER" }, async ({ user }) => sendVerification(user.id));
