import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254);

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .regex(/[a-z]/, "Inclua pelo menos uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(80, "Nome muito longo.")
  .regex(/^[\p{L}\p{M}' .-]+$/u, "Use apenas letras no nome.");

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Aceite os termos e a política de privacidade." }) }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não coincidem." });

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Informe a senha.").max(128) });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ token: z.string().min(20).max(200), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não coincidem." });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não coincidem." });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Confirme sua senha.").max(128),
  confirm: z.literal("EXCLUIR", { errorMap: () => ({ message: 'Digite "EXCLUIR" para confirmar.' }) }),
});

export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}
