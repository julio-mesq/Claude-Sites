"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { passwordStrength, registerSchema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const LABELS = ["Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", acceptTerms: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(form.password);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[i.path[0] as string] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api("/auth/register", { method: "POST", body: parsed.data });
      toast.success("Conta criada! Vamos configurar sua experiência.");
      router.replace("/onboarding");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0] ?? ""])));
      toast.error(err instanceof ApiError ? err.message : "Não foi possível criar a conta.");
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <h1 className="text-3xl font-bold">Crie sua conta</h1>
      <p className="mt-2 text-sm text-mist">Grátis para sempre no plano Free. Sem cartão de crédito.</p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField label="Nome" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Seu nome" />
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="voce@email.com" />
        <div className="relative">
          <TextField label="Senha" type={show ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} placeholder="Mínimo 8 caracteres" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[30px] p-1.5 text-mist hover:text-snow" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.password && (
          <div aria-live="polite">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < strength ? (strength <= 1 ? "bg-danger" : strength === 2 ? "bg-warning" : "bg-neon") : "bg-white/8")} />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-mist">Força da senha: {LABELS[strength]}</p>
          </div>
        )}
        <TextField label="Confirmar senha" type={show ? "text" : "password"} autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/6 bg-ink-900/60 p-3.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={form.acceptTerms}
            onClick={() => setForm({ ...form, acceptTerms: !form.acceptTerms })}
            className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors", form.acceptTerms ? "border-neon bg-neon text-ink-950" : "border-white/20")}
          >
            {form.acceptTerms && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </button>
          <span className="text-xs leading-relaxed text-mist">
            Li e aceito os{" "}
            <Link href="/terms" target="_blank" className="text-neon hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacy" target="_blank" className="text-neon hover:underline">
              Política de Privacidade
            </Link>
            , e consinto com o tratamento dos meus dados de saúde e medidas corporais para as funcionalidades do FitLife.
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-danger">{errors.acceptTerms}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Criar conta
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-mist">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-neon hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
