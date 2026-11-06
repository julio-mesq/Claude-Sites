import { ChoiceCard, EmptyState, Segmented, Switch, TextArea, TextField } from '../components/ui';
import { FEATURES, PRIORITY_LABEL } from '../core/catalogs';
import type { Priority, Project } from '../core/types';
import { ListChecks } from 'lucide-react';
import { Section, type StepProps } from './shared';

export function TimelineStep({ p, set }: StepProps) {
  const t = p.timeline;
  const up = <K extends keyof Project['timeline']>(k: K, v: Project['timeline'][K]) => set((q) => ({ ...q, timeline: { ...q.timeline, [k]: v } }));
  const feats = p.features.map((id) => FEATURES.find((f) => f.id === id)).filter((f) => !!f);
  return (
    <div>
      <div className="grid-2">
        <TextField label="Data desejada de lançamento" type="date" value={t.launchDate} onChange={(e) => up('launchDate', e.target.value)} hint="É uma preferência. Prazos reais são combinados depois." />
        <TextField label="Evento ou prazo importante" optional value={t.event} onChange={(e) => up('event', e.target.value)} placeholder="Ex.: inauguração, campanha" />
      </div>
      <div className="stack" style={{ marginTop: 20 }}>
        <TextField label="Faixa de orçamento" optional value={t.budget} disabled={t.budgetLater} onChange={(e) => up('budget', e.target.value)} placeholder="Informe com suas palavras, se quiser" />
        <Switch checked={t.budgetLater} onChange={(v) => up('budgetLater', v)} label="Prefiro conversar sobre valores depois" />
      </div>
      <Section title="Prioridades das funcionalidades" hint="O que é indispensável, o que seria bom ter e o que pode ficar para uma segunda versão.">
        {feats.length === 0 ? <EmptyState icon={<ListChecks />} title="Sem funcionalidades selecionadas" text="Escolha funcionalidades na etapa anterior para definir prioridades." /> : (
          <div className="card" style={{ padding: '6px 18px' }}>
            {feats.map((f) => f && (
              <div className="has-row" key={f.id}>
                <span>{f.name}</span>
                <Segmented label={`Prioridade de ${f.name}`} value={p.priorities[f.id] ?? null} onChange={(v: Priority) => set((q) => ({ ...q, priorities: { ...q.priorities, [f.id]: v } }))}
                  options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((k) => ({ value: k, label: PRIORITY_LABEL[k] }))} />
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Responsabilidades">
        <div className="stack-sm"><span className="label">Quem fornece o conteúdo (textos e imagens)?</span>
          <div className="grid-3" role="radiogroup" aria-label="Responsável pelo conteúdo">
            {([['client', 'O cliente'], ['developer', 'O desenvolvedor'], ['shared', 'Os dois, em conjunto']] as const).map(([v, l]) => <ChoiceCard key={v} selected={t.contentOwner === v} onClick={() => up('contentOwner', v)} title={l} />)}
          </div></div>
        <div className="stack-sm"><span className="label">Manutenção e suporte depois do lançamento</span>
          <div className="grid-2" role="radiogroup" aria-label="Suporte">
            {([['none', 'Não preciso'], ['occasional', 'Quando necessário'], ['monthly', 'Acompanhamento mensal'], ['undecided', 'Ainda não sei']] as const).map(([v, l]) => <ChoiceCard key={v} selected={t.support === v} onClick={() => up('support', v)} title={l} />)}
          </div></div>
        <TextArea label="Observações sobre escopo e condições comerciais" optional value={t.scopeNotes} onChange={(e) => up('scopeNotes', e.target.value)} />
      </Section>
    </div>
  );
}
