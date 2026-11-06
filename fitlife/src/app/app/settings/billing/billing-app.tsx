"use client";

import { useState } from "react";
import { Check, CreditCard, Info, Receipt } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type Plan = { id: "FREE" | "PRO" | "ELITE"; name: string; priceMonthly: number; highlight: boolean; features: string[] };
type Data = { subscription: { plan: string; status: string; provider: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null; effectivePlan: string; payments: { id: string; amountCents: number; currency: string; status: string; plan: string; createdAt: string }[]; paymentsEnabled: boolean; plans: Plan[] };

export function BillingApp({ data, checkout }: { data: Data; checkout?: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  async function go(path: string, body?: unknown, key = path) {
    setLoading(key);
    try {
      const r = await api<{ url: string }>(path, { method: "POST", body });
      window.location.href = r.url;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
      setLoading(null);
    }
  }
  const sub = data.subscription;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Conta" title="Assinatura" subtitle={`Plano atual: ${data.plans.find((p) => p.id === data.effectivePlan)?.name}`} />
      {checkout === "success" && <div className="mb-4 rounded-xl border border-neon/30 bg-neon/5 p-3 text-sm text-neon">Pagamento em processamento. Seu plano será atualizado assim que o provedor confirmar.</div>}
      {checkout === "canceled" && <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-mist">Checkout cancelado. Nenhuma cobrança foi feita.</div>}
      {!data.paymentsEnabled && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm text-mist">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <span>Os pagamentos ainda não estão configurados nesta instalação (Stripe). Nenhum pagamento é simulado: a contratação ficará disponível quando as credenciais forem definidas pelo administrador.</span>
        </div>
      )}
      {sub && sub.plan !== "FREE" && (
        <Card className="mb-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-mist">Assinatura</div>
              <div className="font-display text-xl font-bold">{data.plans.find((p) => p.id === sub.plan)?.name}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Badge tone={sub.status === "ACTIVE" ? "neon" : "warning"}>{sub.status}</Badge>
                {sub.provider === "manual" && <Badge>Concedida pela equipe</Badge>}
                {sub.currentPeriodEnd && <Badge>{sub.cancelAtPeriodEnd ? "Termina" : "Renova"} em {formatDate(new Date(sub.currentPeriodEnd), { day: "2-digit", month: "short", year: "numeric" })}</Badge>}
              </div>
            </div>
            {sub.provider === "stripe" && <Button variant="secondary" onClick={() => go("/billing/portal")} loading={loading === "/billing/portal"}><CreditCard className="h-4 w-4" /> Gerenciar / cancelar</Button>}
          </div>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {data.plans.map((p) => {
          const current = data.effectivePlan === p.id;
          return (
            <Card key={p.id} className={cn("flex flex-col p-6", p.highlight && "border-neon/40 shadow-glow", current && "ring-1 ring-neon/50")}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                {current && <Badge tone="neon">Atual</Badge>}
              </div>
              <div className="mt-3 font-display text-3xl font-extrabold">{p.priceMonthly ? `R$ ${p.priceMonthly.toFixed(2).replace(".", ",")}` : "Grátis"}{p.priceMonthly > 0 && <span className="text-sm font-normal text-mist">/mês</span>}</div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => <li key={f} className="flex gap-2 text-sm text-mist"><Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {f}</li>)}
              </ul>
              {p.id !== "FREE" && !current && (
                <Button className="mt-6 w-full" variant={p.highlight ? "primary" : "outline"} disabled={!data.paymentsEnabled} loading={loading === p.id} onClick={() => go("/billing/checkout", { plan: p.id }, p.id)}>
                  {data.paymentsEnabled ? `Assinar ${p.name.replace("FitLife ", "")}` : "Indisponível no momento"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      <Card className="mt-5">
        <CardHeader title="Histórico de pagamentos" icon={<Receipt className="h-4 w-4" />} />
        <div className="p-5">
          {data.payments.length === 0 ? <p className="text-sm text-mist">Nenhum pagamento registrado.</p> : (
            <ul className="divide-y divide-white/5">
              {data.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2.5 text-sm">
                  <span>{formatDate(new Date(p.createdAt), { day: "2-digit", month: "short", year: "numeric" })} · {p.plan}</span>
                  <span className="flex items-center gap-2">{(p.amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: p.currency.toUpperCase() })} <Badge tone={p.status === "SUCCEEDED" ? "neon" : "danger"}>{p.status === "SUCCEEDED" ? "Pago" : "Falhou"}</Badge></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
