import { SITE_TYPES, featureById, type SiteTypeDef } from '../core/catalogs';
import { applySiteType } from '../core/rules';
import type { SiteTypeId } from '../core/types';
import type { StepProps } from './shared';

const R = (x: number, y: number, w: number, h: number, fill = '#D5D9DF', rx = 2) => <rect key={`${x}-${y}-${w}-${h}-${fill}`} x={x} y={y} width={w} height={h} rx={rx} fill={fill} />;
const INK = '#20242B', MID = '#AEB5BF', LIGHT = '#E3E6EA';

function shapes(id: SiteTypeId) {
  const head = [R(8, 8, 18, 4, INK), R(100, 8, 12, 4, MID), R(118, 8, 12, 4, MID), R(136, 8, 16, 4, INK)];
  switch (id) {
    case 'landing': return [...head, R(30, 24, 100, 7, INK), R(44, 36, 72, 4, MID), R(62, 46, 36, 8, INK, 4), R(14, 64, 40, 18, LIGHT), R(60, 64, 40, 18, LIGHT), R(106, 64, 40, 18, LIGHT)];
    case 'store': return [...head, R(8, 22, 144, 14, LIGHT), ...[0, 1, 2, 3].flatMap((i) => [R(8 + i * 37, 42, 33, 26, LIGHT), R(8 + i * 37, 72, 22, 3, MID), R(8 + i * 37, 78, 12, 3, INK)])];
    case 'portfolio': return [...head, R(8, 22, 60, 6, INK), ...[0, 1, 2].map((i) => R(8 + i * 49, 36, 45, 50, i === 1 ? MID : LIGHT)), R(8, 30, 40, 3, MID)];
    case 'menu': return [...head, R(8, 22, 144, 16, LIGHT), ...[0, 1, 2, 3].flatMap((i) => [R(8, 46 + i * 11, 70, 4, INK), R(124, 46 + i * 11, 24, 4, MID), R(80, 48 + i * 11, 42, 1, LIGHT)])];
    case 'booking': return [...head, R(8, 22, 70, 6, INK), R(8, 32, 56, 3, MID), ...[0, 1, 2].map((i) => R(8 + i * 24, 42, 20, 8, i === 1 ? INK : LIGHT, 4)), ...Array.from({ length: 14 }, (_, i) => R(92 + (i % 7) * 8, 24 + Math.floor(i / 7) * 9, 6, 7, i === 9 ? INK : LIGHT))];
    case 'blog': return [...head, ...[0, 1, 2].flatMap((i) => [R(8 + i * 49, 22, 45, 28, LIGHT), R(8 + i * 49, 54, 36, 4, INK), R(8 + i * 49, 61, 45, 3, MID), R(8 + i * 49, 67, 30, 3, MID)])];
    case 'events': return [...head, R(8, 22, 144, 20, INK), R(20, 29, 70, 5, '#fff'), ...[0, 1, 2].flatMap((i) => [R(8, 48 + i * 13, 14, 10, MID), R(28, 50 + i * 13, 80, 4, INK), R(28, 56 + i * 13, 50, 3, MID)])];
    case 'education': return [...head, ...[0, 1, 2].flatMap((i) => [R(8 + i * 49, 22, 45, 26, LIGHT), R(8 + i * 49, 52, 40, 4, INK), R(8 + i * 49, 60, 45, 3, LIGHT), R(8 + i * 49, 60, 15 * (i + 1), 3, INK)]), R(8, 72, 144, 12, LIGHT)];
    case 'custom': return [...head, R(8, 22, 68, 30, LIGHT), R(84, 22, 68, 14, MID), R(84, 40, 32, 12, LIGHT), R(120, 40, 32, 12, INK), R(8, 58, 144, 24, LIGHT)];
    default: return [...head, R(8, 22, 70, 7, INK), R(8, 34, 54, 3, MID), R(8, 42, 28, 8, INK, 4), R(88, 22, 64, 34, LIGHT), R(8, 64, 44, 18, LIGHT), R(58, 64, 44, 18, LIGHT), R(108, 64, 44, 18, LIGHT)];
  }
}

export function TypeThumb({ id }: { id: SiteTypeId }) {
  return <svg viewBox="0 0 160 90" role="img" aria-label="Miniatura ilustrativa" preserveAspectRatio="xMidYMid meet">{shapes(id)}</svg>;
}

function Detail({ t }: { t: SiteTypeDef }) {
  return (
    <div className="card enter" style={{ marginTop: 20 }} aria-live="polite">
      <div className="eyebrow">Como esse tipo de site funciona</div>
      <h2 style={{ marginTop: 6 }}>{t.name}</h2>
      <p className="muted" style={{ marginTop: 4 }}>{t.blurb}</p>
      <div className="stack-sm" style={{ marginTop: 16 }}>
        <span className="label">Estrutura de exemplo</span>
        <div className="row-wrap" style={{ gap: 6 }}>{t.structure.map((s, i) => (
          <span key={s} className="row" style={{ gap: 6 }}>{i > 0 && <span className="muted" aria-hidden>→</span>}<span className="badge badge-ink">{s}</span></span>
        ))}</div>
      </div>
      <div className="stack-sm" style={{ marginTop: 16 }}>
        <span className="label">Funcionalidades normalmente associadas</span>
        <div className="row-wrap">{t.features.map((f) => <span className="badge" key={f}>{featureById(f)?.name ?? f}</span>)}</div>
      </div>
    </div>
  );
}

export function SiteTypeStep({ p, set }: StepProps) {
  const sel = SITE_TYPES.find((t) => t.id === p.siteType) ?? null;
  return (
    <div>
      <div className="type-grid" role="radiogroup" aria-label="Tipo de site">
        {SITE_TYPES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={p.siteType === t.id} className="type-card" onClick={() => set((q) => applySiteType(q, t.id))}>
            <div className="type-thumb"><TypeThumb id={t.id} /></div>
            <div><div className="choice-title">{t.name}</div><div className="choice-desc">{t.blurb}</div></div>
          </button>
        ))}
      </div>
      {sel && <Detail t={sel} />}
    </div>
  );
}
