import { useEffect, useState } from 'react';
import { Check, X, Wand2 } from 'lucide-react';
import { Button, Callout, Segmented } from '../components/ui';
import { PALETTES, paletteById } from '../core/catalogs';
import { bestOn, checkContrast, fixContrast, normalizeHex, suggestCombos } from '../core/contrast';
import { buildTheme } from '../core/theme';
import type { Project } from '../core/types';
import { Section, type StepProps } from './shared';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const bad = text !== value && !normalizeHex(text);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="color-input">
        <input type="color" aria-label={`Seletor de cor: ${label}`} value={normalizeHex(value) ?? '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} />
        <input className="input" style={{ fontFamily: 'ui-monospace, monospace' }} aria-label={`Código HEX: ${label}`} aria-invalid={bad} value={text} maxLength={7}
          onChange={(e) => { setText(e.target.value); const h = normalizeHex(e.target.value); if (h) onChange(h); }}
          onBlur={() => setText(value)} />
      </div>
      {bad && <span className="field-error" role="alert">Use o formato #RRGGBB.</span>}
    </div>
  );
}

function withMode(p: Project, mode: 'light' | 'dark'): Project {
  const pal = paletteById(p.colors.paletteId);
  const known = [pal.light.toUpperCase(), pal.dark.toUpperCase()];
  const bg = known.includes(p.colors.background.toUpperCase()) ? (mode === 'dark' ? pal.dark : pal.light) : p.colors.background;
  return { ...p, colors: { ...p.colors, mode, background: bg } };
}

export function ColorsStep({ p, set }: StepProps) {
  const th = buildTheme(p);
  const checks = checkContrast({ primary: th.primary, secondary: th.secondary, background: th.bg, ink: th.ink, onPrimary: th.onPrimary });
  const failing = checks.some((c) => !c.pass);
  const edit = (k: 'primary' | 'secondary' | 'accent' | 'background', hex: string) => set((q) => ({ ...q, colors: { ...q.colors, [k]: hex, paletteId: 'custom' } }));
  const combos = suggestCombos(p.colors.primary);
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="label">Tema</span>
        <Segmented label="Tema claro ou escuro" value={p.colors.mode} onChange={(m) => set((q) => withMode(q, m))} options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }]} />
      </div>
      <div className="palette-grid" role="radiogroup" aria-label="Paletas prontas">
        {PALETTES.filter((x) => x.id !== 'custom').map((pal) => (
          <button key={pal.id} type="button" role="radio" aria-checked={p.colors.paletteId === pal.id} className="choice" style={{ flexDirection: 'column', gap: 10 }}
            onClick={() => set((q) => ({ ...q, colors: { paletteId: pal.id, primary: pal.primary, secondary: pal.secondary, accent: pal.accent, background: q.colors.mode === 'dark' ? pal.dark : pal.light, mode: q.colors.mode } }))}>
            <span className="swatches" style={{ width: '100%' }}>{[pal.primary, pal.secondary, pal.accent, p.colors.mode === 'dark' ? pal.dark : pal.light].map((c, i) => <i key={i} style={{ background: c }} />)}</span>
            <span className="choice-title">{pal.name}</span>
          </button>
        ))}
      </div>
      <Section title="Afinar as cores" hint={p.colors.paletteId === 'custom' ? 'Paleta personalizada em uso.' : 'Mexer em qualquer cor cria uma paleta personalizada.'}>
        <div className="grid-2">
          <ColorField label="Cor principal" value={p.colors.primary} onChange={(h) => edit('primary', h)} />
          <ColorField label="Cor secundária" value={p.colors.secondary} onChange={(h) => edit('secondary', h)} />
          <ColorField label="Cor de destaque" value={p.colors.accent} onChange={(h) => edit('accent', h)} />
          <ColorField label="Cor de fundo" value={p.colors.background} onChange={(h) => edit('background', h)} />
        </div>
      </Section>
      <Section title="Combinações sugeridas" hint="Partem da cor principal. Clique para aplicar.">
        <div className="palette-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {combos.map((c) => (
            <button key={c.name} type="button" className="choice" style={{ flexDirection: 'column', gap: 8, padding: 10 }} aria-label={`Aplicar combinação ${c.name}`}
              onClick={() => set((q) => ({ ...q, colors: { ...q.colors, primary: c.colors[0], secondary: c.colors[1], accent: c.colors[2], paletteId: 'custom' } }))}>
              <span className="swatches" style={{ width: '100%', height: 26 }}>{c.colors.map((x, i) => <i key={i} style={{ background: x }} />)}</span>
              <span className="small">{c.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Cores em elementos reais">
        <div className="card" style={{ background: th.bg, borderColor: th.line, color: th.ink }}>
          <div style={{ fontFamily: th.headingFont, fontWeight: th.headingWeight, fontSize: 22 }}>Título de exemplo</div>
          <p style={{ color: th.muted, margin: '6px 0 14px' }}>Texto corrido sobre o fundo escolhido, com <span style={{ color: th.primary, fontWeight: 600, textDecoration: 'underline' }}>um link de exemplo</span>.</p>
          <div className="row-wrap">
            <span style={{ background: th.primary, color: th.onPrimary, padding: '9px 18px', borderRadius: th.btnRadius, fontWeight: 600, fontSize: 14 }}>Botão principal</span>
            <span style={{ border: `1px solid ${th.secondary}`, color: th.ink, padding: '9px 18px', borderRadius: th.btnRadius, fontSize: 14 }}>Botão secundário</span>
            <span style={{ background: th.accent, color: bestOn(th.accent), padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>Destaque</span>
          </div>
        </div>
      </Section>
      <Section title="Verificação de contraste" hint="Segue as recomendações WCAG: 4,5:1 para textos e 3:1 para detalhes.">
        <div className="card" style={{ padding: '6px 18px' }}>
          {checks.map((c) => (
            <div key={c.id} className="contrast-row">
              <span className="contrast-sample" style={{ background: c.bg, color: c.fg }} aria-hidden>Aa</span>
              <span style={{ flex: 1 }}>{c.label}</span>
              <span className="small muted">{c.ratio.toFixed(1)}:1</span>
              {c.pass ? <span className="badge badge-ok"><Check size={12} aria-hidden /> Aprovado</span> : <span className="badge badge-warn"><X size={12} aria-hidden /> Abaixo de {c.min}:1</span>}
            </div>
          ))}
        </div>
        {failing && (
          <Callout kind="warn" action={<Button size="sm" onClick={() => set((q) => {
            const t = buildTheme(q);
            return { ...q, colors: { ...q.colors, primary: fixContrast(q.colors.primary, t.bg, 3), secondary: fixContrast(q.colors.secondary, t.bg, 3), paletteId: 'custom' } };
          })}><Wand2 size={14} aria-hidden /> Ajustar cores</Button>}>
            Algumas combinações podem ser difíceis de ler. Posso escurecer ou clarear levemente as cores principal e secundária, mantendo o tom. Você confirma ao clicar.
          </Callout>
        )}
      </Section>
    </div>
  );
}

