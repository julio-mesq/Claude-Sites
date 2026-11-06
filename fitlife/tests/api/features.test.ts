import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, newUser, type Client } from "./client";
import { dateKey } from "@/lib/utils";

let A: { c: Client; user: { id: string } };
let B: { c: Client; user: { id: string } };
let exerciseIds: string[] = [];

beforeAll(async () => {
  A = await newUser("featA");
  B = await newUser("featB");
  const ex = await A.c.get("/exercises?group=CHEST");
  exerciseIds = ex.data.items.slice(0, 2).map((e: { id: string }) => e.id);
});
afterAll(async () => db.$disconnect());

describe("onboarding", () => {
  it("gera plano inicial, hábitos, metas nutricionais, agenda e medida inicial", async () => {
    expect(await db.workout.count({ where: { userId: A.user.id } })).toBeGreaterThanOrEqual(3);
    expect(await db.habit.count({ where: { userId: A.user.id } })).toBeGreaterThanOrEqual(2);
    expect(await db.nutritionLog.count({ where: { userId: A.user.id } })).toBe(1);
    expect(await db.calendarEvent.count({ where: { userId: A.user.id, type: "WORKOUT" } })).toBe(4);
    expect(await db.bodyMeasurement.count({ where: { userId: A.user.id } })).toBe(1);
    const day = await A.c.get(`/nutrition/day?date=${dateKey()}`);
    expect(day.data.targets.calories).toBeGreaterThan(1500);
  });
});

describe("treinos", () => {
  let workoutId = "";
  it("cria, edita, reordena e lista treinos", async () => {
    const r = await A.c.post("/workouts", { name: "Peito Teste", items: exerciseIds.map((id) => ({ exerciseId: id, sets: 2, reps: "8-10", restSec: 60 })) });
    expect(r.status).toBe(200);
    workoutId = r.data.id;
    expect(r.data.exercises[0].exerciseId).toBe(exerciseIds[0]);
    const u = await A.c.put(`/workouts/${workoutId}`, { name: "Peito Teste B", items: [...exerciseIds].reverse().map((id) => ({ exerciseId: id, sets: 3, reps: "10", loadKg: 20, restSec: 90 })) });
    expect(u.status).toBe(200);
    expect(u.data.name).toBe("Peito Teste B");
    expect(u.data.exercises[0].exerciseId).toBe(exerciseIds[1]);
    expect(u.data.exercises[0].loadKg).toBe(20);
  });

  it("rejeita exercício inexistente", async () => {
    const r = await A.c.post("/workouts", { name: "Inválido", items: [{ exerciseId: "nao-existe", sets: 2, reps: "8", restSec: 60 }] });
    expect(r.status).toBe(400);
  });

  it("isola dados: outro usuário não vê nem altera o treino", async () => {
    expect((await B.c.get(`/workouts/${workoutId}`)).status).toBe(404);
    expect((await B.c.del(`/workouts/${workoutId}`)).status).toBe(404);
    expect((await B.c.post("/sessions", { workoutId })).status).toBe(404);
  });

  it("executa treino: registra séries, detecta recorde e salva histórico", async () => {
    const s = await A.c.post("/sessions", { workoutId });
    expect(s.status).toBe(200);
    const sid = s.data.id;
    // Outro usuário não registra séries na sessão de A.
    expect((await B.c.post(`/sessions/${sid}/sets`, { exerciseId: exerciseIds[0], setNumber: 1, reps: 10, loadKg: 40 })).status).toBe(404);
    for (let i = 1; i <= 2; i++) expect((await A.c.post(`/sessions/${sid}/sets`, { exerciseId: exerciseIds[0], setNumber: i, reps: 10, loadKg: 40 + i })).status).toBe(200);
    // Simula 10 minutos de treino para que a sessão seja válida.
    await db.workoutSession.update({ where: { id: sid }, data: { startedAt: new Date(Date.now() - 10 * 60_000) } });
    const f = await A.c.post(`/sessions/${sid}/finish`, { status: "COMPLETED", perceivedEffort: 7 });
    expect(f.status).toBe(200);
    expect(f.data.xp).toBeGreaterThan(0);
    expect(f.data.totalVolumeKg).toBe(41 * 10 + 42 * 10);
    expect((await A.c.post(`/sessions/${sid}/finish`, { status: "COMPLETED" })).status).toBe(400);
    const pr = await db.personalRecord.findUnique({ where: { userId_exerciseId: { userId: A.user.id, exerciseId: exerciseIds[0]! } } });
    expect(pr?.loadKg).toBe(42);
    const hist = await A.c.get("/sessions/history");
    expect(hist.data.items[0].id).toBe(sid);
    const ach = await db.userAchievement.findMany({ where: { userId: A.user.id }, include: { achievement: true } });
    expect(ach.map((a) => a.achievement.code)).toContain("FIRST_STEP");
    expect(await db.journeyMilestone.count({ where: { userId: A.user.id, kind: "FIRST_WORKOUT" } })).toBe(1);
  });

  it("sessão curta não gera XP nem conta para conquistas", async () => {
    const { c, user } = await newUser("short");
    const ex = (await c.get("/exercises?group=LEGS")).data.items[0].id;
    const s = await c.post("/sessions", {});
    await c.post(`/sessions/${s.data.id}/sets`, { exerciseId: ex, setNumber: 1, reps: 5 });
    const f = await c.post(`/sessions/${s.data.id}/finish`, { status: "COMPLETED" });
    expect(f.data.xp).toBe(0);
    expect(await db.userAchievement.count({ where: { userId: user.id, achievement: { code: "FIRST_STEP" } } })).toBe(0);
  });

  it("exclusão lógica preserva o histórico", async () => {
    expect((await A.c.del(`/workouts/${workoutId}`)).status).toBe(200);
    expect((await A.c.get(`/workouts/${workoutId}`)).status).toBe(404);
    expect(await db.workoutSession.count({ where: { workoutId } })).toBe(1);
  });
});

describe("nutrição", () => {
  it("registra alimentos, soma macros, água e remove itens", async () => {
    const date = dateKey();
    const e = await A.c.post("/nutrition/entries", { date, mealType: "LUNCH", name: "Frango", quantity: 150, unit: "g", calories: 250, proteinG: 45, carbsG: 0, fatG: 6, saveToLibrary: true });
    expect(e.status).toBe(200);
    await A.c.post("/nutrition/entries", { date, mealType: "LUNCH", name: "Arroz", quantity: 100, unit: "g", calories: 130, proteinG: 2.5, carbsG: 28, fatG: 0.3 });
    await A.c.post("/nutrition/water", { date, amountMl: 500 });
    const w = await A.c.post("/nutrition/water", { date, amountMl: -2000 });
    expect(w.data.waterMl).toBe(0);
    const day = await A.c.get(`/nutrition/day?date=${date}`);
    expect(day.data.totals.calories).toBe(380);
    expect(day.data.totals.protein).toBe(47.5);
    const foods = await A.c.get("/nutrition/foods?q=Frango");
    expect(foods.data.items.some((f: { name: string }) => f.name === "Frango")).toBe(true);
    expect((await B.c.del(`/nutrition/entries/${e.data.id}`)).status).toBe(404);
    expect((await A.c.del(`/nutrition/entries/${e.data.id}`)).status).toBe(200);
    expect((await A.c.get(`/nutrition/day?date=${date}`)).data.totals.calories).toBe(130);
  });
});

describe("metas, hábitos e gamificação", () => {
  it("meta automática de peso é concluída por nova medida", async () => {
    const g = await A.c.post("/goals", { title: "Chegar a 78 kg", metric: "weight", unit: "kg", startValue: 80, targetValue: 78 });
    expect(g.status).toBe(200);
    expect((await A.c.patch(`/goals/${g.data.id}`, { currentValue: 70 })).status).toBe(400);
    const m = await A.c.post("/measurements", { measuredAt: new Date().toISOString(), weightKg: 77.8, waistCm: 84 });
    expect(m.status).toBe(200);
    const goal = await db.userGoal.findUniqueOrThrow({ where: { id: g.data.id } });
    expect(goal.status).toBe("COMPLETED");
    expect(await db.userAchievement.count({ where: { userId: A.user.id, achievement: { code: "EVOLUTION" } } })).toBe(1);
  });

  it("XP de hábito é idempotente (desmarcar e remarcar não pontua de novo)", async () => {
    const habit = (await A.c.get("/habits")).data.items[0];
    const date = dateKey();
    const before = (await db.user.findUniqueOrThrow({ where: { id: A.user.id } })).xp;
    expect((await A.c.post(`/habits/${habit.id}/toggle`, { date })).data.done).toBe(true);
    const after1 = (await db.user.findUniqueOrThrow({ where: { id: A.user.id } })).xp;
    expect(after1).toBeGreaterThan(before);
    expect((await A.c.post(`/habits/${habit.id}/toggle`, { date })).data.done).toBe(false);
    expect((await A.c.post(`/habits/${habit.id}/toggle`, { date })).data.done).toBe(true);
    const after2 = (await db.user.findUniqueOrThrow({ where: { id: A.user.id } })).xp;
    expect(after2).toBe(after1);
    expect((await A.c.post(`/habits/${habit.id}/toggle`, { date: "2099-01-01" })).status).toBe(400);
    expect((await B.c.post(`/habits/${habit.id}/toggle`, { date })).status).toBe(404);
  });

  it("missão acompanha progresso automaticamente", async () => {
    const { missions } = (await A.c.get("/missions")).data;
    const meals = missions.find((m: { code: string }) => m.code === "MEALS_15");
    expect((await A.c.post(`/missions/${meals.id}/join`)).status).toBe(200);
    expect((await A.c.post(`/missions/${meals.id}/join`)).status).toBe(409);
    await A.c.post("/nutrition/entries", { date: dateKey(), mealType: "SNACK", name: "Banana", quantity: 1, unit: "un", calories: 90, proteinG: 1, carbsG: 23, fatG: 0.3 });
    const { progress } = (await A.c.get("/missions")).data;
    const mp = progress.find((p: { missionId: string; status: string }) => p.missionId === meals.id && p.status === "ACTIVE");
    expect(mp.progress).toBeGreaterThanOrEqual(1);
  });

  it("pulse e dashboard usam dados reais", async () => {
    const p = await A.c.get("/pulse");
    expect(p.status).toBe(200);
    expect(p.data.hasData).toBe(true);
    expect(p.data.score).toBeGreaterThan(0);
    const d = await A.c.get("/dashboard");
    expect(d.data.stats.totalWorkouts).toBeGreaterThanOrEqual(1);
    const fresh = await newUser("empty");
    const e = await fresh.c.get("/dashboard");
    expect(e.data.stats.totalWorkouts).toBe(0);
    expect(e.data.charts.weekly.every((w: { workouts: number }) => w.workouts === 0)).toBe(true);
  });
});

describe("permissões e planos", () => {
  it("usuário comum não acessa rotas administrativas", async () => {
    for (const p of ["/admin/overview", "/admin/users", "/admin/audit", "/admin/reports"]) expect((await A.c.get(p)).status).toBe(403);
    expect((await A.c.patch(`/admin/users/${A.user.id}`, { role: "ADMIN" })).status).toBe(403);
  });

  it("moderador acessa moderação mas não gestão de usuários", async () => {
    const mod = await newUser("mod");
    await db.user.update({ where: { id: mod.user.id }, data: { role: "MODERATOR" } });
    expect((await mod.c.get("/admin/reports")).status).toBe(200);
    expect((await mod.c.get("/admin/users")).status).toBe(403);
  });

  it("relatórios avançados exigem plano Pro e checkout sem Stripe não simula pagamento", async () => {
    expect((await A.c.get("/reports")).status).toBe(402);
    const co = await A.c.post("/billing/checkout", { plan: "PRO" });
    expect(co.status).toBe(503);
    expect(await db.payment.count({ where: { userId: A.user.id } })).toBe(0);
  });

  it("webhook sem assinatura válida é rejeitado", async () => {
    const res = await fetch(`${process.env.TEST_BASE_URL ?? "http://localhost:3000"}/api/v1/webhooks/stripe`, { method: "POST", body: "{}" });
    expect([400, 503]).toContain(res.status);
  });
});

describe("comunidade e Fit AI", () => {
  it("comunidade é opt-in; links e spam são filtrados; denúncias ocultam após 3", async () => {
    expect((await A.c.get("/community/posts")).status).toBe(403);
    for (const u of [A, B]) {
      await u.c.patch("/profile/preferences", { communityEnabled: true });
      await db.user.update({ where: { id: u.user.id }, data: { emailVerifiedAt: new Date() } });
    }
    const p = await A.c.post("/community/posts", { content: "Treino feito! veja https://phishing.example/x" });
    expect(p.status).toBe(200);
    expect(p.data.content).toContain("[link removido]");
    expect((await A.c.post("/community/posts", { content: "Ganhe dinheiro fácil clique aqui" })).status).toBe(400);
    expect((await B.c.post(`/community/posts/${p.data.id}/like`)).data.liked).toBe(true);
    expect((await B.c.post(`/community/posts/${p.data.id}/comments`, { content: "Boa!" })).status).toBe(200);
    for (let i = 0; i < 3; i++) {
      const r = await newUser(`rep${i}`, false);
      await r.c.patch("/profile/preferences", { communityEnabled: true });
      expect((await r.c.post("/community/reports", { postId: p.data.id, reason: "spam" })).status).toBe(200);
    }
    expect((await db.communityPost.findUniqueOrThrow({ where: { id: p.data.id } })).hiddenAt).not.toBeNull();
  });

  it("bloqueio oculta publicações", async () => {
    const post = await B.c.post("/community/posts", { content: "Post do B para teste de bloqueio" });
    await A.c.post(`/community/users/${B.user.id}/block`);
    const feed = await A.c.get("/community/posts");
    expect(feed.data.items.some((i: { id: string }) => i.id === post.data.id)).toBe(false);
  });

  it("Fit AI responde em modo demonstração identificado e respeita limite diário", async () => {
    const st = await A.c.get("/ai");
    expect(st.data.status.demo).toBe(true);
    const r = await A.c.post("/ai/chat", { message: "Estou com dor no peito ao treinar" });
    expect(r.status).toBe(200);
    expect(String(r.data)).toContain("profissional");
    await db.aiMessage.createMany({ data: Array.from({ length: 12 }, () => ({ userId: A.user.id, role: "USER" as const, content: "x", provider: "local-demo" })) });
    expect((await A.c.post("/ai/chat", { message: "Mais uma" })).status).toBe(429);
  });
});

describe("perfil público da comunidade", () => {
  it("respeita a visibilidade escolhida", async () => {
    const owner = await newUser("vis");
    const viewer = await newUser("viewer");
    for (const u of [owner, viewer]) await u.c.patch("/profile/preferences", { communityEnabled: true });
    const priv = await viewer.c.get(`/community/users/${owner.user.id}/profile`);
    expect(priv.status).toBe(200);
    expect(priv.data.canView).toBe(false);
    expect(priv.data.stats).toBeNull();
    await owner.c.patch("/profile/preferences", { profileVisibility: "FOLLOWERS" });
    expect((await viewer.c.get(`/community/users/${owner.user.id}/profile`)).data.canView).toBe(false);
    await viewer.c.post(`/community/users/${owner.user.id}/follow`);
    expect((await viewer.c.get(`/community/users/${owner.user.id}/profile`)).data.canView).toBe(true);
  });
});
