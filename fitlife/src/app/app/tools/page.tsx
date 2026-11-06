import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/card";
import { Calculators } from "./calculators";

export const metadata: Metadata = { title: "Ferramentas" };

export default function ToolsPage() {
  return (
    <div>
      <PageHeader eyebrow="Ferramentas" title="Calculadoras de treino" subtitle="Utilitários rápidos para o dia a dia. Resultados são estimativas de referência." />
      <Calculators />
    </div>
  );
}
