"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { buttonClass } from "@/components/ui/button";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [msg, setMsg] = useState("Link de confirmação inválido.");
  const ran = useRef(false);
  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api("/auth/verify", { method: "POST", body: { token } })
      .then(() => setState("ok"))
      .catch((e) => {
        setMsg(e instanceof ApiError ? e.message : "Não foi possível confirmar.");
        setState("error");
      });
  }, [token]);
  return (
    <div className="text-center">
      {state === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-neon" />}
      {state === "ok" && <CheckCircle2 className="mx-auto h-12 w-12 text-neon" />}
      {state === "error" && <XCircle className="mx-auto h-12 w-12 text-danger" />}
      <h1 className="mt-5 text-2xl font-bold">{state === "loading" ? "Confirmando…" : state === "ok" ? "E-mail confirmado!" : "Não foi possível confirmar"}</h1>
      <p className="mt-3 text-sm text-mist">{state === "ok" ? "Sua conta está protegida e todos os recursos foram liberados." : state === "error" ? msg : "Aguarde um instante."}</p>
      {state !== "loading" && (
        <Link href="/app" className={buttonClass("primary", "md", "mt-8")}>
          Ir para o FitLife
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
