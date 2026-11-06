import { Button, Callout } from '../components/ui';
import { buildTheme, type Theme } from '../core/theme';
import { isLanding } from '../core/rules';
import type { Behavior } from '../core/types';
import type { StepProps } from './shared';

type Key = keyof Behavior;
interface Group { key: Key; title: string; opts: { v: string; label: string; art?: React.ReactNode }[] }

const box = (style: React.CSSProperties) => <span style={{ display: 'block', background: 'var(--ink)', ...style }} />;
const GROUPS: Group[] = [
  { key: 'header', title: 'Cabeçalho', opts: [{ v: 'fixed', label: 'Fixo ao rolar', art: <div style={{ width: 70 }}>{box({ height: 8, borderRadius: 2 })}<div style={{ marginTop: 4, display: 'grid', gap: 3 }}>{box({ height: 4, background: 'var(--line-strong)' })}{box({ height: 4, background: 'var(--line-strong)', width: '70%' })}</div></div> }, { v: 'normal', label: 'Normal', art: <div style={{ width: 70, display: 'grid', gap: 3 }}>{box({ height: 8, borderRadius: 2, background: 'var(--line-strong)' })}{box({ height: 4, background: 'var(--line-strong)' })}</div> }] },
  { key: 'menu', title: 'Menu', opts: [{ v: 'classic', label: 'Tradicional' }, { v: 'centered', label: 'Centralizado' }, { v: 'minimal', label: 'Minimalista' }] },
  { key: 'buttons', title: 'Botões', opts: [{ v: 'rounded', label: 'Arredondados', art: box({ width: 54, height: 20, borderRadius: 999 }) }, { v: 'square', label: 'Retos', art: box({ width: 54, height: 20, borderRadius: 0 }) }] },
  { key: 'cards', title: 'Cartões', opts: [{ v: 'subtle', label: 'Discretos', art: <span style={{ width: 54, height: 28, border: '1px solid var(--line-strong)', borderRadius: 6, background: '#fff' }} /> }, { v: 'elevated', label: 'Destacados', art: <span style={{ width: 54, height: 28, borderRadius: 6, background: '#fff', boxShadow: '0 8px 14px -6px rgba(32,36,43,.35)' }} /> }] },
  { key: 'spacing', title: 'Espaçamento', opts: [{ v: 'compact', label: 'Compacto' }, { v: 'comfortable', label: 'Confortável' }, { v: 'airy', label: 'Amplo' }] },
  { key: 'layout', title: 'Largura do layout', opts: [{ v: 'centered', label: 'Centralizado' }, { v: 'wide', label: 'Mais expansivo' }] },
  { key: 'imagery', title: 'Imagens', opts: [{ v: 'photos', label: 'Fotografias' }, { v: 'illustrations', label: 'Ilustrações' }] },
  { key: 'icons', title: 'Ícones', opts: [{ v: 'line', label: 'Lineares' }, { v: 'filled', label: 'Preenchidos' }] },
  { key: 'motion', title: 'Animações', opts: [{ v: 'none', label: 'Nenhuma' }, { v: 'subtle', label: 'Discretas' }, { v: 'rich', label: 'Mais elaboradas' }] },
  { key: 'hover', title: 'Efeito ao passar o mouse', opts: [{ v: 'none', label: 'Nenhum' }, { v: 'lift', label: 'Elevar' }, { v: 'highlight', label: 'Realçar borda' }] },
  { key: 'transitions', title: 'Transição entre páginas', opts: [{ v: 'none', label: 'Instantânea' }, { v: 'fade', label: 'Suave' }, { v: 'slide', label: 'Deslizar' }] },
  { key: 'mobileMenu', title: 'Menu no celular', opts: [{ v: 'drawer', label: 'Lateral' }, { v: 'fullscreen', label: 'Tela cheia' }, { v: 'bottom', label: 'Painel inferior' }] },
];

export function effective(t: Theme, key: Key): string {
  switch (key) {
    case 'header': return t.headerFixed ? 'fixed' : 'normal';
    case 'menu': return t.menu;
    case 'buttons': return t.btnRadius > 8 ? 'rounded' : 'square';
    case 'cards': return t.card;
    case 'spacing': return t.spacing <= 56 ? 'compact' : t.spacing <= 78 ? 'comfortable' : 'airy';
    case 'layout': return t.maxW > 1000 ? 'wide' : 'centered';
    case 'imagery': return t.imagery;
    case 'icons': return t.icons;
    case 'motion': return t.motion;
    case 'hover': return t.hover;
    case 'transitions': return t.transitions;
    case 'mobileMenu': return t.mobileMenu;
  }
}

export function BehaviorStep({ p, set }: StepProps) {
  const th = buildTheme(p);
  const landing = isLanding(p);
  const groups = GROUPS.filter((g) => !(landing && (g.key === 'transitions')));
  return (
    <div className="stack-lg">
      <Callout>Cada grupo começa seguindo o estilo escolhido. Clique para definir uma preferência própria. As animações respeitam a preferência de movimento reduzido de quem visita o site.</Callout>
      {landing && <p className="muted small">Como é uma página única, a transição entre páginas não se aplica.</p>}
      {groups.map((g) => {
        const eff = effective(th, g.key);
        const explicit = p.behavior[g.key] !== null;
        return (
          <section key={g.key} className="stack-sm">
            <div className="row"><h3 id={`bh-${g.key}`}>{g.title}</h3>{explicit ? <Button variant="ghost" size="sm" onClick={() => set((q) => ({ ...q, behavior: { ...q.behavior, [g.key]: null } }))}>Voltar ao sugerido</Button> : <span className="follow-tag">Sugerido pelo estilo</span>}</div>
            <div className="opt-grid" role="radiogroup" aria-labelledby={`bh-${g.key}`}>
              {g.opts.map((o) => (
                <button key={o.v} type="button" role="radio" aria-checked={eff === o.v} className="opt" onClick={() => set((q) => ({ ...q, behavior: { ...q.behavior, [g.key]: o.v } }))}>
                  {o.art && <span className="opt-art" aria-hidden>{o.art}</span>}
                  <span className="choice-title">{o.label}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
