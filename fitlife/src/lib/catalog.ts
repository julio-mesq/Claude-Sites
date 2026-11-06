// Catálogos estáticos compartilhados entre seed, servidor e interface.

export const ACHIEVEMENTS = [
  { code: "FIRST_STEP", name: "Primeiro Passo", description: "Concluiu o primeiro treino.", icon: "footprints", xpReward: 50, tier: "bronze" },
  { code: "CONSISTENCY", name: "Consistência", description: "Sete dias seguidos com atividade registrada.", icon: "flame", xpReward: 120, tier: "silver" },
  { code: "EVOLUTION", name: "Evolução", description: "Atingiu a primeira meta.", icon: "trending-up", xpReward: 150, tier: "silver" },
  { code: "DISCIPLINE", name: "Disciplina", description: "Vinte treinos concluídos.", icon: "shield", xpReward: 250, tier: "gold" },
  { code: "MARATHONER", name: "Maratonista", description: "Acumulou 42,2 km em atividades aeróbicas.", icon: "route", xpReward: 300, tier: "gold" },
  { code: "PR_HUNTER", name: "Caçador de Recordes", description: "Bateu o primeiro recorde pessoal de carga.", icon: "trophy", xpReward: 80, tier: "bronze" },
  { code: "HYDRATED", name: "Hidratado", description: "Cumpriu a meta de água em 7 dias.", icon: "droplets", xpReward: 100, tier: "silver" },
  { code: "NUTRI_LOGGER", name: "Diário em Dia", description: "Registrou refeições em 7 dias diferentes.", icon: "salad", xpReward: 100, tier: "silver" },
  { code: "BODY_TRACKER", name: "Mapa do Corpo", description: "Registrou a primeira avaliação corporal.", icon: "ruler", xpReward: 40, tier: "bronze" },
  { code: "HABIT_BUILDER", name: "Hábito Formado", description: "Manteve um hábito por 21 dias seguidos.", icon: "repeat", xpReward: 200, tier: "gold" },
  { code: "MISSION_DONE", name: "Missão Cumprida", description: "Concluiu a primeira missão.", icon: "target", xpReward: 80, tier: "bronze" },
  { code: "CENTURION", name: "Centurião", description: "Cem treinos concluídos.", icon: "crown", xpReward: 1000, tier: "platinum" },
] as const;

export const MISSIONS = [
  { code: "WEEK_3X", name: "Ritmo Semanal", description: "Conclua 3 treinos em 7 dias.", metric: "WORKOUTS", targetValue: 3, durationDays: 7, xpReward: 120, icon: "dumbbell" },
  { code: "WALK_10K", name: "10 km em Movimento", description: "Acumule 10 km em atividades aeróbicas (registre a distância nas séries de cardio).", metric: "CARDIO_KM", targetValue: 10, durationDays: 14, xpReward: 150, icon: "route" },
  { code: "ROUTINE_4", name: "Rotina Completa", description: "Conclua 4 treinos da sua rotina salva em 14 dias.", metric: "ROUTINE_COMPLETIONS", targetValue: 4, durationDays: 14, xpReward: 150, icon: "list-checks" },
  { code: "MEALS_15", name: "Diário Alimentar", description: "Registre 15 alimentos no diário em 7 dias.", metric: "MEALS_LOGGED", targetValue: 15, durationDays: 7, xpReward: 100, icon: "salad" },
  { code: "WATER_5", name: "Hidratação em Dia", description: "Atinja sua meta de água em 5 dias dentro de uma semana.", metric: "WATER_DAYS", targetValue: 5, durationDays: 7, xpReward: 100, icon: "droplets" },
  { code: "MINUTES_150", name: "150 Minutos", description: "Some 150 minutos de treino em 7 dias (referência geral de atividade semanal).", metric: "WORKOUT_MINUTES", targetValue: 150, durationDays: 7, xpReward: 140, icon: "timer" },
  { code: "HABITS_30", name: "Mestre dos Hábitos", description: "Faça 30 check-ins de hábitos em 14 dias.", metric: "HABIT_CHECKINS", targetValue: 30, durationDays: 14, xpReward: 160, icon: "repeat" },
  { code: "MONTH_12", name: "Mês de Ferro", description: "Conclua 12 treinos em 30 dias.", metric: "WORKOUTS", targetValue: 12, durationDays: 30, xpReward: 400, icon: "flame" },
] as const;

export const ACHIEVEMENT_CODES = ACHIEVEMENTS.map((a) => a.code);
