import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { EXERCISES } from "./data/exercises";
import { ACHIEVEMENTS, MISSIONS } from "../src/lib/catalog";

const db = new PrismaClient();

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Receitas informativas: sem valores nutricionais inventados (macros nulos; o usuário pode registrar os seus).
const RECIPES = [
  { title: "Omelete de espinafre", description: "Café da manhã rápido e rico em proteínas.", ingredients: ["3 ovos", "1 xícara de espinafre", "Sal e pimenta a gosto", "1 colher de chá de azeite"], steps: ["Bata os ovos com sal e pimenta.", "Refogue o espinafre no azeite por 1 minuto.", "Adicione os ovos e cozinhe em fogo baixo até firmar.", "Dobre e sirva."], servings: 1, tags: ["café da manhã", "vegetariano"] },
  { title: "Frango grelhado com legumes", description: "Prato prático para o almoço da semana.", ingredients: ["2 filés de peito de frango", "1 abobrinha", "1 cenoura", "1 pimentão", "Limão, alho e ervas"], steps: ["Tempere o frango com limão, alho e ervas.", "Grelhe o frango por 5–6 minutos de cada lado.", "Corte os legumes e salteie até ficarem al dente.", "Sirva juntos."], servings: 2, tags: ["almoço", "meal prep"] },
  { title: "Bowl de grão-de-bico", description: "Opção vegetal completa e saborosa.", ingredients: ["1 xícara de grão-de-bico cozido", "1/2 xícara de arroz integral cozido", "Tomate, pepino e cebola roxa", "Molho de iogurte ou tahine"], steps: ["Monte o arroz na base do bowl.", "Adicione o grão-de-bico e os vegetais picados.", "Finalize com o molho."], servings: 1, tags: ["vegano", "almoço"] },
  { title: "Overnight oats", description: "Prepare à noite e tenha o café da manhã pronto.", ingredients: ["1/2 xícara de aveia", "1/2 xícara de leite ou bebida vegetal", "1 colher de sopa de chia", "Frutas a gosto"], steps: ["Misture aveia, leite e chia em um pote.", "Leve à geladeira por pelo menos 6 horas.", "Sirva com frutas por cima."], servings: 1, tags: ["café da manhã", "prático"] },
  { title: "Salmão assado com batata-doce", description: "Refeição pós-treino equilibrada.", ingredients: ["1 posta de salmão", "1 batata-doce média", "Azeite, sal e alecrim", "Brócolis"], steps: ["Corte a batata-doce em cubos e asse por 25 minutos a 200 °C.", "Tempere o salmão e asse por 12–15 minutos.", "Cozinhe o brócolis no vapor.", "Sirva tudo junto."], servings: 1, tags: ["jantar", "pós-treino"] },
  { title: "Vitamina de banana e pasta de amendoim", description: "Lanche rápido e energético.", ingredients: ["1 banana", "1 colher de sopa de pasta de amendoim", "200 ml de leite ou bebida vegetal", "Gelo"], steps: ["Bata todos os ingredientes no liquidificador.", "Sirva imediatamente."], servings: 1, tags: ["lanche", "pré-treino"] },
];

async function main() {
  for (const e of EXERCISES) {
    const slug = slugify(e.name);
    const data = {
      name: e.name,
      muscleGroup: e.g as never,
      secondaryMuscles: (e.sec ?? []) as never,
      equipment: e.eq,
      difficulty: e.d,
      description: e.desc,
      instructions: e.ins,
      cautions: e.cau,
      defaultSets: e.sets ?? 3,
      defaultReps: e.reps ?? "10-12",
      defaultRestSec: e.rest ?? 60,
      isCardio: e.cardio ?? false,
    };
    await db.exercise.upsert({ where: { slug }, create: { slug, ...data }, update: data });
  }
  for (const a of ACHIEVEMENTS) await db.achievement.upsert({ where: { code: a.code }, create: { ...a }, update: { ...a } });
  for (const m of MISSIONS) await db.mission.upsert({ where: { code: m.code }, create: { ...m, metric: m.metric as never }, update: { ...m, metric: m.metric as never } });
  if ((await db.recipe.count({ where: { userId: null } })) === 0) await db.recipe.createMany({ data: RECIPES });

  const email = (process.env.SEED_ADMIN_EMAIL ?? "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  // Em produção, nunca cria administrador com a senha de exemplo publicada no repositório.
  const insecure = password === "Admin@FitLife2026" && (process.env.NODE_ENV === "production" || !!process.env.VERCEL);
  if (insecure) console.warn("SEED_ADMIN_PASSWORD é a senha de exemplo; administrador não criado. Defina uma senha forte.");
  if (email && password && !insecure) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.user.create({
        data: {
          email,
          name: "Administrador FitLife",
          passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 }),
          role: "ADMIN",
          emailVerifiedAt: new Date(),
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
          preferences: { create: {} },
          profile: { create: {} },
          subscription: { create: {} },
        },
      });
      console.log(`Administrador criado: ${email} (altere a senha após o primeiro login).`);
    }
  }
  console.log(`Seed concluído: ${EXERCISES.length} exercícios, ${ACHIEVEMENTS.length} conquistas, ${MISSIONS.length} missões.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
