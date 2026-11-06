"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Ban, Flag, Heart, Medal, MessageCircle, MoreHorizontal, Send, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm";
import { Avatar } from "@/components/layout/app-shell";
import { APP_TIMEZONE, cn } from "@/lib/utils";

type Post = { id: string; content: string; visibility: string; achievementCode: string | null; createdAt: string; author: { id: string; name: string; level: number; hasAvatar: boolean }; likes: number; comments: number; liked: boolean; mine: boolean; following: boolean };
type Comment = { id: string; content: string; createdAt: string; mine: boolean; author: { id: string; name: string } };

function ago(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: APP_TIMEZONE });
}

export function CommunityApp({ enabled, verified, stats, achievements }: { enabled: boolean; verified: boolean; stats: { followers: number; following: number; posts: number }; achievements: { code: string; name: string }[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [scope, setScope] = useState<"all" | "following">("all");
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [vis, setVis] = useState("PUBLIC");
  const [ach, setAch] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ postId?: string; commentId?: string } | null>(null);

  const load = useCallback(async (more = false) => {
    try {
      const r = await api<{ items: Post[]; nextCursor: string | null }>(`/community/posts?scope=${scope}${more && cursor ? `&cursor=${cursor}` : ""}`);
      setPosts((p) => (more && p ? [...p, ...r.items] : r.items));
      setCursor(r.nextCursor);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao carregar.");
      setPosts([]);
    }
  }, [scope, cursor]);
  useEffect(() => {
    if (!enabled) return;
    setPosts(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, enabled]);

  if (!enabled)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Comunidade" title="Comunidade FitLife" />
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="A comunidade é opcional"
            description="Você pode usar o FitLife sem participar. Ao ativar, outras pessoas poderão ver suas publicações conforme a privacidade escolhida. Seus dados de treino, medidas e fotos continuam privados."
            action={
              <Button
                onClick={async () => {
                  await api("/profile/preferences", { method: "PATCH", body: { communityEnabled: true } });
                  toast.success("Comunidade ativada.");
                  router.refresh();
                }}
              >
                Ativar comunidade
              </Button>
            }
          />
        </Card>
      </div>
    );

  async function publish() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api("/community/posts", { method: "POST", body: { content: text, visibility: vis, achievementCode: ach || null } });
      setText("");
      setAch("");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao publicar.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <PageHeader eyebrow="Comunidade" title="Feed" subtitle="Compartilhe evolução, conquistas e motivação." />
        <Card className="mb-4 p-4">
          {!verified && <p className="mb-3 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning">Confirme seu e-mail para publicar e comentar.</p>}
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Como foi seu treino hoje?" aria-label="Nova publicação" disabled={!verified} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select value={vis} onChange={(e) => setVis(e.target.value)} className="h-9 w-auto text-xs" aria-label="Visibilidade">
              <option value="PUBLIC">Público</option>
              <option value="FOLLOWERS">Somente seguidores</option>
            </Select>
            {achievements.length > 0 && (
              <Select value={ach} onChange={(e) => setAch(e.target.value)} className="h-9 w-auto text-xs" aria-label="Anexar conquista">
                <option value="">Anexar conquista</option>
                {achievements.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
              </Select>
            )}
            <span className="ml-auto text-[11px] text-mist-700">{text.length}/1000</span>
            <Button size="sm" onClick={publish} loading={posting} disabled={!verified || !text.trim()}>
              <Send className="h-4 w-4" /> Publicar
            </Button>
          </div>
        </Card>
        <Segmented value={scope} onChange={setScope} className="mb-4" size="sm" options={[{ value: "all", label: "Todos" }, { value: "following", label: "Seguindo" }]} />
        {!posts ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : posts.length === 0 ? (
          <Card><EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Nada por aqui ainda" description={scope === "following" ? "Siga pessoas para ver as publicações delas aqui." : "Seja a primeira pessoa a publicar!"} /></Card>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <Card key={p.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.author.name} has={p.author.hasAvatar} userId={p.author.id} size={40} />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Link href={`/app/community/u/${p.author.id}`} className="hover:text-neon">{p.author.name}</Link> <Badge>Nv {p.author.level}</Badge>
                      </div>
                      <div className="text-xs text-mist">{ago(p.createdAt)}{p.visibility === "FOLLOWERS" && " · seguidores"}</div>
                    </div>
                  </div>
                  <PostMenu
                    post={p}
                    onDelete={async () => {
                      if (!(await confirm({ title: "Excluir publicação?", confirmLabel: "Excluir", danger: true }))) return;
                      await api(`/community/posts/${p.id}`, { method: "DELETE" });
                      setPosts((l) => l?.filter((x) => x.id !== p.id) ?? null);
                    }}
                    onReport={() => setReporting({ postId: p.id })}
                    onFollow={async () => {
                      const r = await api<{ following: boolean }>(`/community/users/${p.author.id}/follow`, { method: "POST" });
                      setPosts((l) => l?.map((x) => (x.author.id === p.author.id ? { ...x, following: r.following } : x)) ?? null);
                      toast.success(r.following ? `Você segue ${p.author.name}.` : `Deixou de seguir ${p.author.name}.`);
                    }}
                    onBlock={async () => {
                      if (!(await confirm({ title: `Bloquear ${p.author.name}?`, description: "Vocês não verão mais as publicações um do outro.", confirmLabel: "Bloquear", danger: true }))) return;
                      await api(`/community/users/${p.author.id}/block`, { method: "POST" });
                      setPosts((l) => l?.filter((x) => x.author.id !== p.author.id) ?? null);
                    }}
                  />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-snow/90">{p.content}</p>
                {p.achievementCode && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neon/30 bg-neon/5 px-3 py-2 text-xs text-neon">
                    <Medal className="h-4 w-4" /> Conquista verificada pelo FitLife
                  </div>
                )}
                <div className="mt-4 flex items-center gap-1 border-t border-white/5 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(p.liked && "text-danger")}
                    aria-pressed={p.liked}
                    onClick={async () => {
                      setPosts((l) => l?.map((x) => (x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)) ?? null);
                      await api(`/community/posts/${p.id}/like`, { method: "POST" }).catch(() => load());
                    }}
                  >
                    <Heart className={cn("h-4 w-4", p.liked && "fill-current")} /> {p.likes}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpenComments(openComments === p.id ? null : p.id)} aria-expanded={openComments === p.id}>
                    <MessageCircle className="h-4 w-4" /> {p.comments}
                  </Button>
                </div>
                {openComments === p.id && <Comments postId={p.id} verified={verified} onReport={(commentId) => setReporting({ commentId })} />}
              </Card>
            ))}
            {cursor && <Button variant="secondary" className="w-full" onClick={() => load(true)}>Carregar mais</Button>}
          </div>
        )}
      </div>
      <aside className="space-y-4 lg:pt-24">
        <Card className="p-5">
          <div className="grid grid-cols-3 text-center">
            {[["Publicações", stats.posts], ["Seguidores", stats.followers], ["Seguindo", stats.following]].map(([l, v]) => (
              <div key={l as string}>
                <div className="font-display text-xl font-bold">{v}</div>
                <div className="text-[11px] text-mist">{l}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 text-sm text-mist">
          <div className="mb-2 flex items-center gap-2 font-semibold text-snow"><Shield className="h-4 w-4 text-neon" /> Ambiente seguro</div>
          <ul className="space-y-1.5 text-xs">
            <li>• Links externos são removidos automaticamente.</li>
            <li>• Denúncias são analisadas pela moderação.</li>
            <li>• Bloqueie qualquer pessoa a qualquer momento.</li>
            <li>• Seus dados corporais nunca são publicados.</li>
          </ul>
        </Card>
      </aside>
      <ReportModal target={reporting} onClose={() => setReporting(null)} />
    </div>
  );
}

function PostMenu({ post, onDelete, onReport, onFollow, onBlock }: { post: Post; onDelete: () => void; onReport: () => void; onFollow: () => void; onBlock: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-1.5 text-mist hover:bg-white/5" aria-label="Opções da publicação" aria-expanded={open}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass-strong absolute right-0 top-8 z-20 w-48 rounded-xl p-1" onMouseLeave={() => setOpen(false)}>
          {post.mine ? (
            <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /> Excluir</button>
          ) : (
            <>
              <button onClick={() => { setOpen(false); onFollow(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-snow"><UserPlus className="h-4 w-4" /> {post.following ? "Deixar de seguir" : "Seguir"}</button>
              <button onClick={() => { setOpen(false); onReport(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-snow"><Flag className="h-4 w-4" /> Denunciar</button>
              <button onClick={() => { setOpen(false); onBlock(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"><Ban className="h-4 w-4" /> Bloquear</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Comments({ postId, verified, onReport }: { postId: string; verified: boolean; onReport: (id: string) => void }) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const load = useCallback(() => api<{ items: Comment[] }>(`/community/posts/${postId}/comments`).then((r) => setItems(r.items)), [postId]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
      {!items ? <Skeleton className="h-10" /> : items.length === 0 ? <p className="text-xs text-mist">Nenhum comentário.</p> : items.map((c) => (
        <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl bg-ink-900/60 px-3 py-2">
          <div>
            <span className="text-xs font-semibold">{c.author.name}</span> <span className="text-[11px] text-mist">{ago(c.createdAt)}</span>
            <p className="text-sm text-snow/90">{c.content}</p>
          </div>
          {c.mine ? (
            <button className="p-1 text-mist hover:text-danger" aria-label="Excluir comentário" onClick={async () => { await api(`/community/comments/${c.id}`, { method: "DELETE" }); load(); }}><Trash2 className="h-3.5 w-3.5" /></button>
          ) : (
            <button className="p-1 text-mist hover:text-snow" aria-label="Denunciar comentário" onClick={() => onReport(c.id)}><Flag className="h-3.5 w-3.5" /></button>
          )}
        </div>
      ))}
      {verified && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            try {
              await api(`/community/posts/${postId}/comments`, { method: "POST", body: { content: text } });
              setText("");
              load();
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "Erro.");
            }
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Escreva um comentário" aria-label="Comentário" className="h-10 flex-1 rounded-xl border border-white/8 bg-ink-900/80 px-3 text-sm focus:border-neon/60 focus:outline-none" />
          <Button size="sm" type="submit">Enviar</Button>
        </form>
      )}
    </div>
  );
}

function ReportModal({ target, onClose }: { target: { postId?: string; commentId?: string } | null; onClose: () => void }) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Denunciar conteúdo"
      description="A moderação analisará a denúncia. Conteúdos com múltiplas denúncias são ocultados preventivamente."
      size="sm"
      footer={
        <Button
          onClick={async () => {
            try {
              await api("/community/reports", { method: "POST", body: { ...target, reason, details: details || undefined } });
              toast.success("Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.");
              setDetails("");
              onClose();
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Erro.");
            }
          }}
        >
          Enviar denúncia
        </Button>
      }
    >
      <div className="space-y-3">
        <Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Motivo">
          <option value="spam">Spam ou propaganda</option>
          <option value="harassment">Assédio ou ofensa</option>
          <option value="misinformation">Desinformação de saúde</option>
          <option value="inappropriate">Conteúdo impróprio</option>
          <option value="other">Outro</option>
        </Select>
        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} placeholder="Detalhes (opcional)" aria-label="Detalhes" />
      </div>
    </Modal>
  );
}
