import { ChoiceCard, Chip, TextArea, TextField } from '../components/ui';
import { GOALS, VISITOR_ACTIONS } from '../core/catalogs';
import { toggle } from '../core/utils';
import { Section, type StepProps } from './shared';

export function GoalsStep({ p, set }: StepProps) {
  const g = p.goals;
  const up = <K extends keyof typeof g>(k: K, v: (typeof g)[K]) => set((q) => ({ ...q, goals: { ...q.goals, [k]: v } }));
  return (
    <div>
      <p className="muted small" style={{ marginBottom: 12 }}>Você pode escolher mais de uma opção.</p>
      <div className="grid-2" style={{ gap: 10 }}>
        {GOALS.map((o) => (
          <ChoiceCard key={o.id} multi selected={g.selected.includes(o.id)} onClick={() => up('selected', toggle(g.selected, o.id))} title={o.label} desc={o.hint} />
        ))}
      </div>
      {g.selected.includes('other') && (
        <div className="enter" style={{ marginTop: 16 }}><TextField label="Qual é o outro objetivo?" value={g.other} onChange={(e) => up('other', e.target.value)} /></div>
      )}
      {g.selected.length > 0 && (
        <Section title="Para afinar a direção" hint="Respostas curtas já ajudam bastante.">
          <TextArea label="Quem é o seu público-alvo?" value={g.audience} onChange={(e) => up('audience', e.target.value)} placeholder="Idade, perfil, o que procuram…" />
          <TextArea label="Quem são seus principais concorrentes?" optional value={g.competitors} onChange={(e) => up('competitors', e.target.value)} />
          <TextArea label="O que diferencia você dos demais?" value={g.differentials} onChange={(e) => up('differentials', e.target.value)} />
          <div className="stack-sm">
            <span className="label">O que o visitante deve fazer ao chegar?</span>
            <div className="chips">{VISITOR_ACTIONS.map((a) => <Chip key={a} selected={g.actions.includes(a)} onClick={() => up('actions', toggle(g.actions, a))}>{a}</Chip>)}</div>
          </div>
          <TextField label="Outra ação" optional value={g.actionsOther} onChange={(e) => up('actionsOther', e.target.value)} />
        </Section>
      )}
    </div>
  );
}
