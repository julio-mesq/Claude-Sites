import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/sora";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/ui/confirm";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "FitLife — Transforme seu corpo. Evolua sua mente.", template: "%s · FitLife" },
  description: "Plataforma fitness com treinos personalizados, nutrição, evolução física, gamificação e o assistente Fit AI.",
  applicationName: "FitLife",
  openGraph: { title: "FitLife", description: "Transforme seu corpo. Evolua sua mente. Supere seus limites.", type: "website", locale: "pt_BR" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#080A0A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-neon focus:px-4 focus:py-2 focus:text-ink-950">
          Pular para o conteúdo
        </a>
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{ classNames: { toast: "!bg-ink-800/95 !backdrop-blur-xl !border !border-white/10 !text-snow !rounded-2xl", description: "!text-mist" } }}
        />
      </body>
    </html>
  );
}
