export function normalizeHex(v: string): string | null {
  let s = v.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  return /^[0-9a-f]{6}$/i.test(s) ? `#${s.toUpperCase()}` : null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? '#000000';
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Cor de texto (clara ou escura) com melhor contraste sobre o fundo. */
export function bestOn(bg: string, dark = '#14171C', light = '#FFFFFF'): string {
  return contrastRatio(bg, dark) >= contrastRatio(bg, light) ? dark : light;
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export interface ContrastCheck { id: string; label: string; fg: string; bg: string; ratio: number; min: number; pass: boolean }

export function checkContrast(opts: { primary: string; secondary: string; background: string; ink: string; onPrimary: string }): ContrastCheck[] {
  const rows: Omit<ContrastCheck, 'ratio' | 'pass'>[] = [
    { id: 'text', label: 'Texto sobre o fundo', fg: opts.ink, bg: opts.background, min: 4.5 },
    { id: 'button', label: 'Texto dos botões (sobre a cor principal)', fg: opts.onPrimary, bg: opts.primary, min: 4.5 },
    { id: 'primary-bg', label: 'Cor principal sobre o fundo (links e ícones)', fg: opts.primary, bg: opts.background, min: 3 },
    { id: 'secondary-bg', label: 'Cor secundária sobre o fundo (detalhes)', fg: opts.secondary, bg: opts.background, min: 3 },
  ];
  return rows.map((r) => {
    const ratio = contrastRatio(r.fg, r.bg);
    return { ...r, ratio, pass: ratio >= r.min };
  });
}

/** Ajusta uma cor, preservando o matiz, até atingir o contraste mínimo sobre o fundo. */
export function fixContrast(fg: string, bg: string, min: number): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  const target = luminance(bg) > 0.4 ? '#000000' : '#FFFFFF';
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const c = mix(fg, target, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return target;
}

/** Combinações sugeridas a partir de uma cor principal (análoga, complementar, triádica). */
export function suggestCombos(hex: string): { name: string; colors: string[] }[] {
  const [r, g, b] = hexToRgb(hex);
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2;
  const d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (mx === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const hsl = (hh: number, ss: number, ll: number) => {
    const c = (1 - Math.abs(2 * ll - 1)) * ss, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = ll - c / 2;
    const [rr, gg, bb] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
    return rgbToHex((rr + m) * 255, (gg + m) * 255, (bb + m) * 255);
  };
  const sat = Math.max(0.25, Math.min(0.7, s));
  return [
    { name: 'Análoga', colors: [hex, hsl((h + 30) % 360, sat, 0.55), hsl((h + 330) % 360, sat, 0.75)] },
    { name: 'Complementar', colors: [hex, hsl((h + 180) % 360, sat, 0.5), hsl((h + 180) % 360, sat * 0.6, 0.85)] },
    { name: 'Tríade suave', colors: [hex, hsl((h + 120) % 360, sat * 0.7, 0.6), hsl((h + 240) % 360, sat * 0.7, 0.7)] },
  ];
}
