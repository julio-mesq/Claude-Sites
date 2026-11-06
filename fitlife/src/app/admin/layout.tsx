import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { requireRole } from "@/server/auth/guard";
import { Logo } from "@/components/layout/logo";
import { ROLE_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("MODERATOR");
  return (
    <div className="min-h-dvh">
      <header className="glass-strong sticky top-0 z-30 border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
            <span className="hidden items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs text-warning sm:flex">
              <Shield className="h-3.5 w-3.5" /> Painel administrativo · {ROLE_LABEL[user.role]}
            </span>
          </div>
          <Link href="/app" className="flex items-center gap-1.5 text-sm text-mist hover:text-snow">
            <ArrowLeft className="h-4 w-4" /> Voltar ao app
          </Link>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
