"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { resetSchema } from "@/lib/validations/auth";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (!token)
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Link inválido</h1>
        <p className="mt-3 text-sm text-mist">Este link de redefinição está incompleto.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-neon hover:underline">
          Solicitar novo link
        </Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = resetSchema.safeParse({ token, ...form });
    if (!p.success) return setErrors(Object.fromEntries(p.error.issues.map((i) => [i.path[0] as string, i.message])));
    setErrors({});
    setLoading(true);
    try {
      await api("/auth/reset", { method: "POST", body: p.data });
      router.replace("/login?reset=1");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível redefinir.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Nova senha</h1>
      <p className="mt-2 text-sm text-mist">Escolha uma senha forte. Todas as sessões ativas serão encerradas.</p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <TextField label="Nova senha" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <TextField label="Confirmar senha" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Redefinir senha
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
