import { ChevronDown } from 'lucide-react';
import { Segmented, TextField } from '../components/ui';
import { TECH_CONSIDERATIONS, TECH_QUESTIONS } from '../core/catalogs';
import type { Tri } from '../core/types';
import { Section, type StepProps } from './shared';

const LABEL = { domainName: 'Qual é o domínio?', hostingNote: 'Com qual empresa?', externalList: 'Quais sistemas?', languages: 'Quais idiomas?', a11yNote: 'Quais necessidades?', paymentsNote: 'Algum provedor em mente?' } as const;

export function TechStep({ p, set }: StepProps) {
  const setA = (id: string, v: Tri) => set((q) => ({ ...q, tech: { ...q.tech, answers: { ...q.tech.answers, [id]: v } } }));
  return (
    <div>
      <div className="stack" style={{ gap: 0 }}>
        {TECH_QUESTIONS.map((q) => {
          const a = p.tech.answers[q.id] ?? '';
          return (
            <div key={q.id} className="has-row" style={{ alignItems: 'flex-start', padding: '14px 0' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontWeight: 500 }}>{q.q}</div>
                <div className="hint">{q.help}</div>
                {q.followUp && a === 'yes' && <div className="enter" style={{ marginTop: 10, maxWidth: 380 }}>
                  <TextField label={LABEL[q.followUp]} optional value={p.tech[q.followUp]} onChange={(e) => set((s) => ({ ...s, tech: { ...s.tech, [q.followUp!]: e.target.value } }))} /></div>}
              </div>
              <Segmented label={q.q} value={a || null} onChange={(v) => setA(q.id, v)} options={[{ value: 'yes', label: 'Sim' }, { value: 'no', label: 'Não' }, { value: 'unsure', label: 'Não sei' }]} />
            </div>
          );
        })}
      </div>
      <Section title="O que vamos considerar no projeto" hint="Itens que fazem parte de um site bem feito, explicados de forma simples.">
        <div className="stack-sm">
          {TECH_CONSIDERATIONS.map((c) => (
            <details key={c.id} className="card" style={{ padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none' }}><ChevronDown size={16} aria-hidden /> {c.title}</summary>
              <p className="muted small" style={{ marginTop: 8 }}>{c.text}</p>
            </details>
          ))}
        </div>
      </Section>
    </div>
  );
}
