import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Documento legal</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-mist">Última atualização: {updated}</p>
      <div className="mt-6 rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm text-mist">
        Modelo de documento elaborado para a plataforma. Antes do lançamento comercial, revise com assessoria jurídica e preencha os dados do controlador (razão social, CNPJ e contato do encarregado).
      </div>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-snow/85 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-snow [&_li]:ml-5 [&_li]:list-disc [&_li]:mt-1.5 [&_p]:text-mist [&_li]:text-mist">{children}</div>
    </div>
  );
}
