import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { getBilling, PLANS } from "@/server/services/billing";
import { BillingApp } from "./billing-app";

export const metadata: Metadata = { title: "Assinatura" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await requireUser();
  const [b, sp] = await Promise.all([getBilling(user.id), searchParams]);
  return <BillingApp data={JSON.parse(JSON.stringify({ ...b, plans: PLANS }))} checkout={sp.checkout} />;
}
