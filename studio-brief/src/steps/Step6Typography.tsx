import { Segmented, SelectField } from '../components/ui';
import { FONTS, FONT_PAIRS, fontById } from '../core/catalogs';
import { buildTheme } from '../core/theme';
import { Section, type StepProps } from './shared';

export function TypographyStep({ p, set }: StepProps) {
  const ty = p.typography;
  const th = buildTheme(p);
  const pairs = FONT_PAIRS.filter((x) => ty.feel === 'any' || x.feel === ty.feel);
  const up = <K extends keyof typeof ty>(k: K, v: (typeof ty)[K]) => set((q) => ({ ...q, typography: { ...q.typography, [k]: v } }));
  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <span className="label">Aparência</span>
        <Segmented label="Aparência das combinações" value={ty.feel} onChange={(v) => up('feel', v)} options={[{ value: 'any', label: 'Todas' }, { value: 'traditional', label: 'Tradicional' }, { value: 'modern', label: 'Moderna' }]} />
      </div>
      <div className="stack-sm" role="radiogroup" aria-label="Combinações de fontes">
        {pairs.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={ty.pairId === x.id} className="pair-card"
            onClick={() => set((q) => ({ ...q, typography: { ...q.typography, pairId: x.id, heading: x.heading, body: x.body } }))}>
            <div className="row"><span className="choice-title">{x.name}</span><span className="spacer" /><span className="small muted">{fontById(x.heading).name} + {fontById(x.body).name}</span></div>
            <div style={{ fontFamily: fontById(x.heading).css, fontSize: 24, fontWeight: th.headingWeight, marginTop: 8, letterSpacing: '-0.01em' }}>Design com propósito</div>
            <div style={{ fontFamily: fontById(x.body).css, fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>Textos claros e confortáveis de ler em qualquer tela.</div>
          </button>
        ))}
      </div>
      <Section title="Ajustes" hint="Opcional. Mudar uma fonte cria uma combinação personalizada.">
        <div className="grid-2">
          <SelectField label="Fonte dos títulos" value={ty.heading} onChange={(e) => set((q) => ({ ...q, typography: { ...q.typography, heading: e.target.value, pairId: 'custom' } }))}>{FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</SelectField>
          <SelectField label="Fonte dos textos" value={ty.body} onChange={(e) => set((q) => ({ ...q, typography: { ...q.typography, body: e.target.value, pairId: 'custom' } }))}>{FONTS.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</SelectField>
        </div>
        <div className="row-wrap" style={{ gap: 24 }}>
          <div className="stack-sm"><span className="label">Peso visual dos títulos</span><Segmented label="Peso" value={ty.weight} onChange={(v) => up('weight', v)} options={[{ value: 'light', label: 'Leve' }, { value: 'regular', label: 'Médio' }, { value: 'strong', label: 'Forte' }]} /></div>
          <div className="stack-sm"><span className="label">Tamanho relativo dos títulos</span><Segmented label="Tamanho" value={ty.scale} onChange={(v) => up('scale', v)} options={[{ value: 'compact', label: 'Compacto' }, { value: 'medium', label: 'Médio' }, { value: 'large', label: 'Grande' }]} /></div>
        </div>
      </Section>
      <Section title="Aplicado a exemplos reais">
        <div className="type-specimen" style={{ background: th.bg, color: th.ink, borderColor: th.line }}>
          <div style={{ fontFamily: th.headingFont, fontWeight: th.headingWeight, fontSize: 38 * th.scale, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{p.client.company || 'Sua marca'} em destaque</div>
          <div style={{ fontFamily: th.headingFont, fontWeight: Math.max(th.headingWeight - 200, 400), fontSize: 20 * th.scale, color: th.muted, marginTop: 10 }}>Um subtítulo que complementa a ideia</div>
          <p style={{ fontFamily: th.bodyFont, lineHeight: 1.65, marginTop: 14, maxWidth: '52ch' }}>Este é um parágrafo de exemplo. Ele mostra como o texto corrido se comporta, com espaçamento e tamanho pensados para leitura confortável em computadores e celulares.</p>
          <span style={{ display: 'inline-block', marginTop: 16, fontFamily: th.bodyFont, fontWeight: 600, fontSize: 14, background: th.primary, color: th.onPrimary, padding: '10px 20px', borderRadius: th.btnRadius }}>Botão de exemplo</span>
        </div>
      </Section>
    </div>
  );
}
