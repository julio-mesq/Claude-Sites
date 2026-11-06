import { Wand2 } from 'lucide-react';
import { Button, Callout, Chip, SliderField } from '../components/ui';
import { recommend } from '../core/rules';
import { StyleThumb } from '../components/Previews';
import { SLIDERS, STYLES } from '../core/catalogs';
import { toggle } from '../core/utils';
import { Section, type StepProps } from './shared';

export function StyleStep({ p, set }: StepProps) {
  const pick = (id: (typeof STYLES)[number]['id']) => set((q) => ({ ...q, style: { ...q.style, primary: id, secondary: q.style.secondary.filter((s) => s !== id) } }));
  return (
    <div>
      <div className="style-grid" role="radiogroup" aria-label="Estilo visual principal">
        {STYLES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={p.style.primary === s.id} className="type-card" onClick={() => pick(s.id)}>
            <StyleThumb spec={s} />
            <div><div className="choice-title">{s.name}</div><div className="choice-desc">{s.blurb}</div></div>
          </button>
        ))}
      </div>
      {p.style.primary && (() => {
        const apply = (q: typeof p) => { let o = q; for (const st of ['colors', 'typography'] as const) { const r = recommend(o, st); if (r) o = r.apply(o); } return o; };
        const sameColors = recommend(p, 'colors')?.apply(p).colors.paletteId === p.colors.paletteId;
        const sameFonts = recommend(p, 'typography')?.apply(p).typography.pairId === p.typography.pairId;
        return sameColors && sameFonts ? null : (
          <div style={{ marginTop: 20 }}><Callout action={<Button size="sm" onClick={() => set(apply)}><Wand2 size={14} aria-hidden /> Aplicar</Button>}>
            Quer ver este estilo com a <strong>paleta e as fontes</strong> que costumam combinar com ele? Você ainda poderá ajustar nas próximas etapas.</Callout></div>
        );
      })()}
      {p.style.primary && (
        <Section title="Características secundárias" hint="Misture até duas influências ao estilo principal.">
          <div className="chips">
            {STYLES.filter((s) => s.id !== p.style.primary).map((s) => {
              const on = p.style.secondary.includes(s.id);
              return <Chip key={s.id} selected={on} onClick={() => { if (!on && p.style.secondary.length >= 2) return; set((q) => ({ ...q, style: { ...q.style, secondary: toggle(q.style.secondary, s.id) } })); }}>{s.name}</Chip>;
            })}
          </div>
        </Section>
      )}
      <Section title="Ajuste fino" hint="Mova os controles e veja a prévia mudar.">
        <div className="card stack" style={{ gap: 22 }}>
          {SLIDERS.map((s) => (
            <SliderField key={s.id} id={`sl-${s.id}`} left={s.left} right={s.right} value={p.style.sliders[s.id]}
              onChange={(v) => set((q) => ({ ...q, style: { ...q.style, sliders: { ...q.style.sliders, [s.id]: v } } }))} />
          ))}
        </div>
      </Section>
    </div>
  );
}
