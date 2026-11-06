"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await api<{ next: string }>("/auth/login", { method: "POST", body: parsed.data });
      const next = params.get("next");
      // Aceita apenas redirecionamentos internos (evita open redirect).
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.replace(res.next === "/onboarding" ? "/onboarding" : (safeNext ?? res.next));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível entrar.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
      <p className="mt-2 text-sm text-mist">Entre para continuar sua evolução.</p>
      {params.get("expired") && <p className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning">Sua sessão expirou. Entre novamente.</p>}
      {params.get("reset") && <p className="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-3 text-sm text-neon">Senha redefinida com sucesso. Entre com a nova senha.</p>}
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="voce@email.com" />
        <div className="relative">
          <TextField label="Senha" type={show ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} placeholder="••••••••" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[30px] p-1.5 text-mist hover:text-snow" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-mist hover:text-neon">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Entrar
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-mist">
        Ainda não tem conta?{" "}
        <Link href="/register" className="font-medium text-neon hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
