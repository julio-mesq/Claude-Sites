import { route, body } from "@/server/http";
import { forgotSchema } from "@/lib/validations/auth";
import { forgotPassword } from "@/server/services/auth";
export const POST = route({}, async ({ req, ip }) => {
  const { email } = await body(req, forgotSchema);
  await forgotPassword(email, ip);
  return { ok: true, message: "Se houver uma conta com este e-mail, enviaremos um link de redefinição." };
});
