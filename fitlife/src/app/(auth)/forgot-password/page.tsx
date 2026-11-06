"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/input";
import { forgotSchema } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = forgotSchema.safeParse({ email });
    if (!p.success) return setError(p.error.issues[0]!.message);
    setError(null);
    setLoading(true);
    try {
      await api("/auth/forgot", { method: "POST", body: p.data });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-12 w-12 text-neon" />
        <h1 className="mt-5 text-2xl font-bold">Verifique seu e-mail</h1>
        <p className="mt-3 text-sm text-mist">Se houver uma conta com <strong className="text-snow">{email}</strong>, você receberá um link para redefinir a senha. O link expira em 30 minutos.</p>
        <Link href="/login" className="mt-8 inline-block text-sm text-neon hover:underline">
          Voltar ao login
        </Link>
      </div>
    );

  return (
    <div>
      <h1 className="text-3xl font-bold">Recuperar senha</h1>
      <p className="mt-2 text-sm text-mist">Informe o e-mail da sua conta e enviaremos um link de redefinição.</p>
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <TextField label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Enviar link
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-mist">
        Lembrou?{" "}
        <Link href="/login" className="text-neon hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
