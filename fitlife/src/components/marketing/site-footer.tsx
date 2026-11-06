import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  const cols = [
    { title: "Produto", links: [["/#recursos", "Recursos"], ["/#plataforma", "Dashboard"], ["/#fit-ai", "Fit AI"], ["/#planos", "Planos"]] },
    { title: "Conta", links: [["/register", "Criar conta"], ["/login", "Entrar"], ["/forgot-password", "Recuperar senha"]] },
    { title: "Legal", links: [["/privacy", "Política de privacidade"], ["/terms", "Termos de uso"], ["/privacy#lgpd", "Seus direitos (LGPD)"]] },
  ];
  return (
    <footer className="relative border-t border-white/5 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">Transforme seu corpo. Evolua sua mente. Supere seus limites.</p>
          <p className="mt-6 max-w-xs text-xs leading-relaxed text-mist-700">
            O FitLife oferece orientação geral de bem-estar e não substitui avaliação de médicos, nutricionistas ou profissionais de educação física.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-snow">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href!} className="text-sm text-mist transition-colors hover:text-neon">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-mist-700 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} FitLife. Todos os direitos reservados.</span>
          <span>Feito para quem não para de evoluir.</span>
        </div>
      </div>
    </footer>
  );
}
