"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#plataforma", label: "Plataforma" },
  { href: "/#fit-ai", label: "Fit AI" },
  { href: "/#planos", label: "Planos" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all", scrolled ? "glass-strong border-b border-white/5" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-mist transition-colors hover:text-snow">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={buttonClass("ghost", "sm")}>
            Entrar
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            Começar grátis
          </Link>
        </div>
        <button className="rounded-lg p-2 text-snow md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="glass-strong border-t border-white/5 px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col" aria-label="Principal (mobile)">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-white/5 py-3.5 text-base text-snow">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login" className={buttonClass("secondary", "md")}>
              Entrar
            </Link>
            <Link href="/register" className={buttonClass("primary", "md")}>
              Começar grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
