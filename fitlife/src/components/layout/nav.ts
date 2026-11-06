import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Map,
  Medal,
  Moon,
  Salad,
  Settings,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/workouts", label: "Treinos", icon: Dumbbell },
      { href: "/app/coach", label: "Fit AI", icon: Bot },
      { href: "/app/nutrition", label: "Nutrição", icon: Salad },
      { href: "/app/progress", label: "Evolução", icon: Activity },
    ],
  },
  {
    title: "Rotina",
    items: [
      { href: "/app/calendar", label: "Calendário", icon: CalendarDays },
      { href: "/app/habits", label: "Hábitos", icon: ListChecks },
      { href: "/app/recovery", label: "Smart Recovery", icon: Moon },
    ],
  },
  {
    title: "Evolução gamificada",
    items: [
      { href: "/app/pulse", label: "FitLife Pulse", icon: HeartPulse },
      { href: "/app/missions", label: "Mission Mode", icon: Target },
      { href: "/app/achievements", label: "Conquistas", icon: Medal },
      { href: "/app/journey", label: "Body Journey", icon: Map },
    ],
  },
  {
    title: "Mais",
    items: [
      { href: "/app/reports", label: "Relatórios", icon: BarChart3 },
      { href: "/app/tools", label: "Ferramentas", icon: Wrench },
      { href: "/app/community", label: "Comunidade", icon: Users },
      { href: "/app/settings", label: "Configurações", icon: Settings },
    ],
  },
];

export const MOBILE_TABS: NavItem[] = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/workouts", label: "Treinos", icon: Dumbbell },
  { href: "/app/coach", label: "Fit AI", icon: Bot },
  { href: "/app/nutrition", label: "Nutrição", icon: Salad },
];

export function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}
