"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Info, Lock, Send, ShieldAlert, Sparkles, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeMarkdown } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Status = { id: "anthropic" | "local-demo"; label: string; model: string | null; demo: boolean; plan: string; used: number; limit: number };

const SUGGESTIONS = ["Como executar o agachamento com segurança?", "Monte uma semana de treinos para o meu objetivo", "Qual alternativa ao supino se eu treino em casa?", "Como está minha frequência de treinos?", "Quanto de proteína é uma referência geral?", "Dicas para manter a consistência"];

export function CoachChat({ firstName, status: initialStatus, initial, useHistory }: { firstName: string; status: Status; initial: Msg[]; useHistory: boolean }) {
  const confirm = useConfirm();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const end = useRef<HTMLDivElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming) return;
    if (status.used >= status.limit) return toast.error(`Limite diário do plano atingido (${status.limit} mensagens).`);
    setInput("");
    const uid = `u${Date.now()}`;
    const aid = `a${Date.now()}`;
    setMessages((m) => [...m, { id: uid, role: "user", content: message }, { id: aid, role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch("/api/v1/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new ApiError(res.status, data?.error?.code ?? "ERROR", data?.error?.message ?? "Não foi possível obter resposta.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === aid ? { ...x, content: x.content + chunk } : x)));
      }
      setStatus((s) => ({ ...s, used: s.used + 1 }));
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== aid));
      toast.error(e instanceof ApiError ? (e.status === 429 ? "Limite de mensagens atingido. Tente mais tarde ou conheça o plano Pro." : e.message) : "Erro de conexão.");
    } finally {
      setStreaming(false);
      ta.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-12rem)] max-w-4xl flex-col lg:h-[calc(100dvh-8rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-neon to-neon-600 text-ink-950 shadow-glow">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">FIT AI</h1>
            <div className="flex items-center gap-2 text-xs text-mist">
              {status.demo ? <Badge tone="warning">Modo demonstração local</Badge> : <Badge tone="neon">{status.label}</Badge>}
              <span>
                {status.used}/{status.limit} mensagens hoje
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!(await confirm({ title: "Apagar conversa?", description: "Todo o histórico com o Fit AI será removido.", confirmLabel: "Apagar", danger: true }))) return;
              await api("/ai", { method: "DELETE" });
              setMessages([]);
            }}
          >
            <Trash2 className="h-4 w-4" /> Limpar conversa
          </Button>
        )}
      </div>

      {status.demo && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/5 p-3 text-xs text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nenhum provedor de IA está configurado nesta instalação. As respostas vêm de regras automáticas e da biblioteca do FitLife — <strong>não é inteligência artificial</strong>. Para ativar o Fit AI real, configure <code className="rounded bg-black/30 px-1">ANTHROPIC_API_KEY</code> no servidor.
          </span>
        </div>
      )}

      <Card className="relative flex-1 overflow-y-auto p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="h-10 w-10 text-neon" />
            <h2 className="mt-4 text-xl font-semibold">Olá, {firstName}! Como posso ajudar hoje?</h2>
            <p className="mt-2 max-w-md text-sm text-mist">Pergunte sobre exercícios, técnica, organização de treinos, nutrição geral ou consistência.</p>
            <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border border-white/8 bg-ink-900/60 px-4 py-3 text-left text-sm text-mist transition-colors hover:border-neon/30 hover:text-snow">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl", m.role === "user" ? "bg-ink-700 text-mist" : "bg-neon/15 text-neon")}>{m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", m.role === "user" ? "rounded-tr-md bg-neon text-sm text-ink-950" : "rounded-tl-md border border-white/5 bg-ink-800/80")}>
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : m.content ? (
                    <SafeMarkdown text={m.content} />
                  ) : (
                    <span className="flex gap-1 py-1.5" aria-label="Digitando">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-neon/70" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
        )}
      </Card>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="glass flex items-end gap-2 rounded-2xl p-2">
          <textarea
            ref={ta}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            maxLength={2000}
            rows={1}
            placeholder="Pergunte ao Fit AI…"
            aria-label="Mensagem para o Fit AI"
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-snow placeholder:text-mist-700 focus:outline-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || streaming} loading={streaming} aria-label="Enviar">
            {!streaming && <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-mist-700">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> Não diagnostica doenças nem prescreve medicamentos. Não substitui profissionais de saúde.
          </span>
          <Link href="/app/settings#privacidade" className="flex items-center gap-1 hover:text-mist">
            <Lock className="h-3 w-3" /> {useHistory ? "Usando seu histórico (autorizado)" : "Histórico não autorizado"}
          </Link>
        </div>
      </form>
    </div>
  );
}
