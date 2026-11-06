"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/layout/app-shell";

export function ProfileEditor(props: { name: string; email: string; username: string; bio: string; hasAvatar: boolean; level: number; xp: number; stats: { workouts: number; achievements: number; since: string }; role: string }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ name: props.name, username: props.username, bio: props.bio });
  const [v, setV] = useState(0);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await api("/profile", { method: "PATCH", body: { name: f.name, username: f.username || null, bio: f.bio || null } });
      toast.success("Perfil atualizado.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span key={v}><Avatar name={props.name} has={props.hasAvatar} size={96} /></span>
          <button onClick={() => file.current?.click()} className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-neon text-ink-950 shadow-glow" aria-label="Alterar foto de perfil">
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Foto de perfil"
            onChange={async (e) => {
              const fl = e.target.files?.[0];
              if (!fl) return;
              const fd = new FormData();
              fd.append("file", fl);
              try {
                await api("/profile/avatar", { method: "POST", body: fd });
                toast.success("Foto atualizada.");
                setV((x) => x + 1);
                router.refresh();
              } catch (err) {
                toast.error(err instanceof ApiError ? err.message : "Erro no envio.");
              }
            }}
          />
        </div>
        {props.hasAvatar && (
          <button className="mt-3 flex items-center gap-1 text-xs text-mist hover:text-danger" onClick={async () => { await api("/profile/avatar", { method: "DELETE" }); router.refresh(); }}>
            <Trash2 className="h-3 w-3" /> Remover foto
          </button>
        )}
        <div className="mt-3 font-display text-xl font-bold">{props.name}</div>
        <div className="text-sm text-mist">{props.email}</div>
        <div className="mt-2 flex gap-1.5"><Badge tone="neon">Nível {props.level}</Badge><Badge>{props.role}</Badge></div>
        <div className="mt-5 grid w-full grid-cols-3 gap-2 text-center">
          {[["Treinos", props.stats.workouts], ["Conquistas", props.stats.achievements], ["Desde", props.stats.since]].map(([l, val]) => (
            <div key={l as string} className="rounded-xl border border-white/5 bg-ink-900/60 p-2.5"><div className="font-display font-bold">{val}</div><div className="text-[10px] text-mist">{l}</div></div>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <Field label="Nome" htmlFor="pf-n"><Input id="pf-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Nome de usuário (comunidade)" htmlFor="pf-u" hint="Opcional. 3–24 caracteres."><Input id="pf-u" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="seu.usuario" /></Field>
        <Field label="Bio" htmlFor="pf-b"><Textarea id="pf-b" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={280} /></Field>
        <Button className="w-full" onClick={save} loading={saving}>Salvar perfil</Button>
      </div>
    </Card>
  );
}
