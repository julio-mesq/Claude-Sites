import Link from "next/link";
import { ArrowLeft, Dumbbell, HeartPulse, Trophy } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="flex items-center gap-1.5 text-sm text-mist hover:text-snow">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-mist-700">Protegido com criptografia e boas práticas de segurança.</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-white/5 bg-ink-900 lg:block">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute -right-24 top-1/4 h-[500px] w-[500px] rounded-full bg-neon/15 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-end p-14">
          <h2 className="max-w-md text-4xl font-bold leading-tight">
            Transforme seu corpo. <span className="text-gradient">Evolua sua mente.</span> Supere seus limites.
          </h2>
          <div className="mt-10 grid max-w-md gap-3">
            {[
              { icon: Dumbbell, t: "Plano inicial criado a partir do seu perfil" },
              { icon: HeartPulse, t: "FitLife Pulse para medir sua consistência" },
              { icon: Trophy, t: "Conquistas e missões baseadas em registros reais" },
            ].map((i) => (
              <div key={i.t} className="glass flex items-center gap-3 rounded-2xl p-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
                  <i.icon className="h-5 w-5" />
                </div>
                <span className="text-sm text-snow/90">{i.t}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
