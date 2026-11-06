import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Lock, Medal, MessageCircle } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { publicProfile } from "@/server/services/community";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { Avatar } from "@/components/layout/app-shell";
import { FollowButton } from "./follow-button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil na comunidade" };

export default async function CommunityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const p = await publicProfile(user.id, id).catch(() => null);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/community" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist hover:text-snow">
        <ArrowLeft className="h-4 w-4" /> Comunidade
      </Link>
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar name={p.name} has={p.hasAvatar} userId={p.id} size={80} />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">{p.name}</h1>
            {p.canView && p.level != null && (
              <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                <Badge tone="neon">Nível {p.level}</Badge>
                {p.since && <Badge>Desde {formatDate(p.since, { month: "short", year: "numeric" })}</Badge>}
              </div>
            )}
            {p.bio && <p className="mt-3 text-sm text-mist">{p.bio}</p>}
          </div>
          {!p.isSelf && <FollowButton userId={p.id} initial={p.follows} />}
        </div>
        {p.stats && (
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[["Publicações", p.stats.posts], ["Seguidores", p.stats.followers], ["Seguindo", p.stats.following]].map(([l, v]) => (
              <div key={l as string} className="rounded-xl border border-white/5 bg-ink-900/60 p-3"><div className="font-display text-xl font-bold">{v}</div><div className="text-[11px] text-mist">{l}</div></div>
            ))}
          </div>
        )}
      </Card>
      {!p.canView ? (
        <Card className="mt-4"><EmptyState icon={<Lock className="h-6 w-6" />} title="Perfil privado" description={p.visibility === "FOLLOWERS" ? "Siga esta pessoa para ver o perfil completo." : "Esta pessoa optou por manter o perfil privado."} /></Card>
      ) : (
        <>
          {p.achievements.length > 0 && (
            <Card className="mt-4 p-5">
              <h2 className="mb-3 text-sm font-semibold">Conquistas</h2>
              <div className="flex flex-wrap gap-2">{p.achievements.map((a) => <Badge key={a.code} tone="neon"><Medal className="h-3 w-3" /> {a.name}</Badge>)}</div>
            </Card>
          )}
          <div className="mt-4 space-y-3">
            {p.posts.length === 0 ? <Card><EmptyState title="Nenhuma publicação" /></Card> : p.posts.map((post) => (
              <Card key={post.id} className="p-5">
                <p className="whitespace-pre-wrap text-sm text-snow/90">{post.content}</p>
                <div className="mt-3 flex gap-4 text-xs text-mist">
                  <span>{formatDate(post.createdAt, { day: "2-digit", month: "short" })}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post._count.reactions}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post._count.comments}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      <p className="mt-6 text-center text-[11px] text-mist-700">Dados de treino, medidas e fotos nunca são exibidos em perfis.</p>
    </div>
  );
}
