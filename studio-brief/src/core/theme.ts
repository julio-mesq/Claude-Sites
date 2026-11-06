import { bestOn, mix } from './contrast';
import { fontById, styleById, STYLES, siteTypeById, type StyleSpec } from './catalogs';
import type { Project } from './types';
import { clamp } from './utils';

export interface Theme {
  bg: string; surface: string; ink: string; muted: string; line: string;
  primary: string; onPrimary: string; secondary: string; accent: string;
  headingFont: string; bodyFont: string; headingWeight: number; scale: number; upper: boolean; mono: boolean;
  radius: number; btnRadius: number; spacing: number; maxW: number; card: 'subtle' | 'elevated';
  hero: 'centered' | 'split' | 'editorial' | 'bold' | 'minimal';
  headerFixed: boolean; menu: 'classic' | 'centered' | 'minimal';
  imagery: 'photos' | 'illustrations'; icons: 'line' | 'filled';
  motion: 'none' | 'subtle' | 'rich'; hover: 'none' | 'lift' | 'highlight';
  transitions: 'none' | 'fade' | 'slide'; mobileMenu: 'drawer' | 'fullscreen' | 'bottom';
  maxSections: number; dark: boolean;
}

const SPACING = { compact: 44, comfortable: 64, airy: 92 } as const;

function colorsFrom(bg: string, primary: string, secondary: string, accent: string) {
  const ink = bestOn(bg, '#20242B', '#F3F5F8');
  return {
    bg, ink, primary, secondary, accent,
    surface: mix(bg, ink, 0.05), muted: mix(ink, bg, 0.42), line: mix(bg, ink, 0.14), onPrimary: bestOn(primary, '#14171C', '#FFFFFF'),
  };
}

export function themeFromStyle(s: StyleSpec): Theme {
  const c = colorsFrom(s.bg, s.primary, s.secondary, s.secondary);
  return {
    ...c,
    headingFont: fontById(s.heading).css, bodyFont: fontById(s.body).css, headingWeight: s.weight, scale: 1,
    upper: s.upper, mono: s.mono, radius: s.radius, btnRadius: s.btnRadius, spacing: s.spacing, maxW: 1040, card: s.card,
    hero: s.hero, headerFixed: false, menu: 'classic', imagery: s.imagery, icons: s.icons,
    motion: s.motion, hover: 'lift', transitions: 'fade', mobileMenu: 'drawer', maxSections: 4,
    dark: s.id === 'tech',
  };
}

/** Tema efetivo do projeto: estilo + cores + tipografia + sliders + comportamento explícito. */
export function buildTheme(p: Project): Theme {
  const primaryStyle = styleById(p.style.primary) ?? STYLES[0];
  const secondary = p.style.secondary.map(styleById).filter((s): s is StyleSpec => !!s);
  const base = themeFromStyle(primaryStyle);
  const { sliders } = p.style;
  const col = colorsFrom(p.colors.background, p.colors.primary, p.colors.secondary, p.colors.accent);
  const bh = p.behavior;

  const secRadius = secondary.length ? secondary.reduce((a, s) => a + s.radius, 0) / secondary.length : primaryStyle.radius;
  let radius = secondary.length ? primaryStyle.radius * 0.7 + secRadius * 0.3 : primaryStyle.radius;
  radius = clamp(radius + (sliders.tone - 50) * 0.16, 0, 32);

  let hero = base.hero;
  if (hero === 'centered' && sliders.innovation > 72) hero = 'split';
  if (hero === 'split' && sliders.innovation < 28) hero = 'centered';
  if (sliders.presence > 78 && hero !== 'editorial') hero = 'bold';
  if (sliders.presence < 22 && hero === 'bold') hero = 'centered';

  const weightMap = { light: 400, regular: 600, strong: 800 } as const;
  const scaleMap = { compact: 0.9, medium: 1, large: 1.14 } as const;
  const rounded = bh.buttons ? bh.buttons === 'rounded' : primaryStyle.btnRadius > 6;
  const btnRadius = bh.buttons ? (rounded ? 999 : 0) : primaryStyle.btnRadius;
  const motion = bh.motion ?? (sliders.motion > 66 ? 'rich' : sliders.motion < 30 ? 'none' : base.motion);

  return {
    ...col,
    headingFont: fontById(p.typography.heading).css, bodyFont: fontById(p.typography.body).css,
    headingWeight: weightMap[p.typography.weight], scale: scaleMap[p.typography.scale],
    upper: primaryStyle.upper, mono: primaryStyle.mono,
    radius: Math.round(radius),
    btnRadius: Math.round(btnRadius),
    spacing: bh.spacing ? SPACING[bh.spacing] : Math.round(base.spacing * (0.8 + sliders.detail / 250)),
    maxW: (bh.layout ?? 'centered') === 'wide' ? 1160 : 960,
    card: bh.cards ?? base.card,
    hero, headerFixed: (bh.header ?? 'normal') === 'fixed', menu: bh.menu ?? 'classic',
    imagery: bh.imagery ?? base.imagery, icons: bh.icons ?? base.icons,
    motion, hover: bh.hover ?? 'lift', transitions: bh.transitions ?? 'fade', mobileMenu: bh.mobileMenu ?? 'drawer',
    maxSections: 3 + Math.round(sliders.detail / 25),
    dark: p.colors.mode === 'dark',
  };
}

export function previewCopy(p: Project) {
  const t = siteTypeById(p.siteType) ?? siteTypeById('institutional')!;
  return { brand: p.client.company.trim() || 'Sua marca', ...t.hero };
}
