import "server-only";
import type { z } from "zod";
import { db } from "../db";
import { Errors } from "../errors";
import { audit } from "../audit";
import { rateLimit } from "../rate-limit";
import type { postSchema, reportSchema } from "@/lib/validations/tracking";
import { notify } from "./notifications";
import { appSettings } from "./app-settings";

const BANNED = [/\bhttps?:\/\/\S+/gi]; // links externos bloqueados para reduzir spam/phishing
const SPAM_WORDS = /(ganhe dinheiro|clique aqui|promoção imperdível|bit\.ly|whatsapp\.com\/|t\.me\/)/i;

function sanitize(text: string) {
  let out = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  for (const r of BANNED) out = out.replace(r, "[link removido]");
  return out;
}

async function assertCommunityAccess(userId: string, needVerified = true) {
  if (!(await appSettings()).communityEnabled) throw Errors.unavailable("A comunidade está temporariamente suspensa.");
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { emailVerifiedAt: true, preferences: { select: { communityEnabled: true } } } });
  if (!u.preferences?.communityEnabled) throw Errors.forbidden("Ative a comunidade nas configurações para participar.");
  if (needVerified && !u.emailVerifiedAt) throw Errors.forbidden("Confirme seu e-mail para publicar na comunidade.");
}

async function blockedIds(userId: string) {
  const rows = await db.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
  return [...new Set(rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)))];
}

export async function feed(userId: string, opts: { cursor?: string; scope?: "all" | "following" } = {}) {
  await assertCommunityAccess(userId, false);
  const blocked = await blockedIds(userId);
  const following = (await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })).map((f) => f.followingId);
  const take = 15;
  const posts = await db.communityPost.findMany({
    where: {
      hiddenAt: null,
      authorId: { notIn: blocked },
      author: { status: "ACTIVE", preferences: { communityEnabled: true } },
      ...(opts.scope === "following" ? { authorId: { in: [...following, userId], notIn: blocked } } : {}),
      OR: [{ visibility: "PUBLIC" }, { authorId: userId }, { visibility: "FOLLOWERS", authorId: { in: following } }],
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: {
      author: { select: { id: true, name: true, level: true, profile: { select: { username: true, avatarPath: true } } } },
      _count: { select: { reactions: true, comments: { where: { hiddenAt: null } } } },
      reactions: { where: { userId }, select: { type: true } },
    },
  });
  return {
    items: posts.slice(0, take).map((p) => ({
      id: p.id,
      content: p.content,
      visibility: p.visibility,
      achievementCode: p.achievementCode,
      createdAt: p.createdAt,
      author: { id: p.author.id, name: p.author.profile?.username ? `@${p.author.profile.username}` : p.author.name, level: p.author.level, hasAvatar: !!p.author.profile?.avatarPath },
      likes: p._count.reactions,
      comments: p._count.comments,
      liked: p.reactions.length > 0,
      mine: p.author.id === userId,
      following: following.includes(p.author.id),
    })),
    nextCursor: posts.length > take ? posts[take - 1]!.id : null,
  };
}

export async function createPost(userId: string, data: z.infer<typeof postSchema>) {
  await assertCommunityAccess(userId);
  await rateLimit(`post:${userId}`, 5, 600);
  const content = sanitize(data.content);
  if (SPAM_WORDS.test(content)) throw Errors.badRequest("Sua publicação parece spam e foi bloqueada.");
  const dup = await db.communityPost.findFirst({ where: { authorId: userId, content, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  if (dup) throw Errors.conflict("Você já publicou este conteúdo recentemente.");
  if (data.achievementCode) {
    const owns = await db.userAchievement.findFirst({ where: { userId, achievement: { code: data.achievementCode } } });
    if (!owns) throw Errors.badRequest("Você só pode compartilhar conquistas desbloqueadas.");
  }
  return db.communityPost.create({ data: { authorId: userId, content, visibility: data.visibility, achievementCode: data.achievementCode ?? null } });
}

export async function deletePost(userId: string, postId: string) {
  const res = await db.communityPost.deleteMany({ where: { id: postId, authorId: userId } });
  if (res.count === 0) throw Errors.notFound("Publicação");
}

async function visiblePost(userId: string, postId: string) {
  const blocked = await blockedIds(userId);
  const p = await db.communityPost.findFirst({ where: { id: postId, hiddenAt: null, authorId: { notIn: blocked } } });
  if (!p) throw Errors.notFound("Publicação");
  if (p.visibility === "FOLLOWERS" && p.authorId !== userId) {
    const f = await db.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: p.authorId } } });
    if (!f) throw Errors.notFound("Publicação");
  }
  return p;
}

export async function toggleLike(userId: string, postId: string) {
  await assertCommunityAccess(userId, false);
  await rateLimit(`like:${userId}`, 120, 600);
  const p = await visiblePost(userId, postId);
  const existing = await db.reaction.findUnique({ where: { postId_userId: { postId, userId } } });
  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await db.reaction.create({ data: { postId, userId } });
  if (p.authorId !== userId) {
    const recent = await db.notification.findFirst({ where: { userId: p.authorId, type: "like", href: `/app/community?post=${postId}`, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (!recent) await notify(p.authorId, { type: "like", title: "Sua publicação recebeu curtidas", body: "Alguém curtiu sua publicação na comunidade.", href: `/app/community?post=${postId}` });
  }
  return { liked: true };
}

export async function listComments(userId: string, postId: string) {
  await visiblePost(userId, postId);
  const blocked = await blockedIds(userId);
  const comments = await db.comment.findMany({
    where: { postId, hiddenAt: null, authorId: { notIn: blocked } },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { author: { select: { id: true, name: true, profile: { select: { username: true } } } } },
  });
  return comments.map((c) => ({ id: c.id, content: c.content, createdAt: c.createdAt, mine: c.authorId === userId, author: { id: c.author.id, name: c.author.profile?.username ? `@${c.author.profile.username}` : c.author.name } }));
}

export async function addComment(userId: string, postId: string, content: string) {
  await assertCommunityAccess(userId);
  await rateLimit(`comment:${userId}`, 20, 600);
  const p = await visiblePost(userId, postId);
  const clean = sanitize(content);
  if (SPAM_WORDS.test(clean)) throw Errors.badRequest("Seu comentário parece spam e foi bloqueado.");
  const c = await db.comment.create({ data: { postId, authorId: userId, content: clean } });
  if (p.authorId !== userId) await notify(p.authorId, { type: "comment", title: "Novo comentário", body: clean.slice(0, 120), href: `/app/community?post=${postId}` });
  return c;
}

export async function deleteComment(userId: string, commentId: string) {
  const res = await db.comment.deleteMany({ where: { id: commentId, authorId: userId } });
  if (res.count === 0) throw Errors.notFound("Comentário");
}

export async function report(userId: string, data: z.infer<typeof reportSchema>) {
  await rateLimit(`report:${userId}`, 10, 3600);
  if (data.postId) await visiblePost(userId, data.postId);
  if (data.commentId && !(await db.comment.findUnique({ where: { id: data.commentId } }))) throw Errors.notFound("Comentário");
  const existing = await db.report.findFirst({ where: { reporterId: userId, postId: data.postId ?? null, commentId: data.commentId ?? null, status: "OPEN" } });
  if (existing) return existing;
  const r = await db.report.create({ data: { reporterId: userId, postId: data.postId ?? null, commentId: data.commentId ?? null, reason: data.reason, details: data.details ?? null } });
  // Ocultação automática preventiva com 3+ denúncias distintas abertas.
  if (data.postId) {
    const n = await db.report.count({ where: { postId: data.postId, status: "OPEN" } });
    if (n >= 3) await db.communityPost.update({ where: { id: data.postId }, data: { hiddenAt: new Date(), hiddenReason: "Ocultado automaticamente por múltiplas denúncias (aguardando moderação)." } });
  }
  return r;
}

export async function toggleFollow(userId: string, targetId: string) {
  if (userId === targetId) throw Errors.badRequest("Você não pode seguir a si mesmo.");
  await assertCommunityAccess(userId, false);
  const target = await db.user.findFirst({ where: { id: targetId, status: "ACTIVE", preferences: { communityEnabled: true } } });
  if (!target || (await blockedIds(userId)).includes(targetId)) throw Errors.notFound("Usuário");
  const key = { followerId_followingId: { followerId: userId, followingId: targetId } };
  if (await db.follow.findUnique({ where: key })) {
    await db.follow.delete({ where: key });
    return { following: false };
  }
  await db.follow.create({ data: { followerId: userId, followingId: targetId } });
  await notify(targetId, { type: "follow", title: "Novo seguidor", body: "Alguém começou a seguir você na comunidade.", href: "/app/community" });
  return { following: true };
}

export async function block(userId: string, targetId: string) {
  if (userId === targetId) throw Errors.badRequest("Ação inválida.");
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } }, create: { blockerId: userId, blockedId: targetId }, update: {} });
  await db.follow.deleteMany({ where: { OR: [{ followerId: userId, followingId: targetId }, { followerId: targetId, followingId: userId }] } });
  await audit("community.block", { actorId: userId, target: targetId });
}

export async function unblock(userId: string, targetId: string) {
  await db.block.deleteMany({ where: { blockerId: userId, blockedId: targetId } });
}

export async function listBlocked(userId: string) {
  const rows = await db.block.findMany({ where: { blockerId: userId }, include: { blocked: { select: { id: true, name: true } } } });
  return rows.map((r) => r.blocked);
}

export async function communityStats(userId: string) {
  const [followers, following, posts] = await Promise.all([
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
    db.communityPost.count({ where: { authorId: userId, hiddenAt: null } }),
  ]);
  return { followers, following, posts };
}

/** Perfil na comunidade, respeitando a visibilidade escolhida pelo dono (PRIVATE, FOLLOWERS, PUBLIC). */
export async function publicProfile(viewerId: string, targetId: string) {
  await assertCommunityAccess(viewerId, false);
  if ((await blockedIds(viewerId)).includes(targetId)) throw Errors.notFound("Perfil");
  const u = await db.user.findFirst({
    where: { id: targetId, status: "ACTIVE", preferences: { communityEnabled: true } },
    select: { id: true, name: true, level: true, createdAt: true, preferences: { select: { profileVisibility: true } }, profile: { select: { username: true, bio: true, avatarPath: true } } },
  });
  if (!u) throw Errors.notFound("Perfil");
  const isSelf = viewerId === targetId;
  const follows = !!(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: targetId } } }));
  const vis = u.preferences?.profileVisibility ?? "PRIVATE";
  const canView = isSelf || vis === "PUBLIC" || (vis === "FOLLOWERS" && follows);
  const base = { id: u.id, name: u.profile?.username ? `@${u.profile.username}` : u.name, hasAvatar: !!u.profile?.avatarPath, isSelf, follows, visibility: vis, canView };
  if (!canView) return { ...base, level: null, bio: null, since: null, stats: null, achievements: [], posts: [] };
  const [stats, achievements, posts] = await Promise.all([
    communityStats(targetId),
    db.userAchievement.findMany({ where: { userId: targetId }, include: { achievement: { select: { code: true, name: true, tier: true } } }, orderBy: { unlockedAt: "desc" } }),
    db.communityPost.findMany({
      where: { authorId: targetId, hiddenAt: null, ...(isSelf || follows ? {} : { visibility: "PUBLIC" }) },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, content: true, createdAt: true, _count: { select: { reactions: true, comments: { where: { hiddenAt: null } } } } },
    }),
  ]);
  return { ...base, level: u.level, bio: u.profile?.bio ?? null, since: u.createdAt, stats, achievements: achievements.map((a) => a.achievement), posts };
}
