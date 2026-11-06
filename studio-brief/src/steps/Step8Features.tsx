import { useState } from 'react';
import { Calendar, Check, Lock, MessageCircle, Plus, Search, ShoppingBag, Wand2 } from 'lucide-react';
import { Badge, Button, Callout, EmptyState } from '../components/ui';
import { FEATURES, FEATURE_GROUPS, LEVEL_LABEL, siteTypeById, type FeatureDef } from '../core/catalogs';
import { consistency } from '../core/rules';
import { toggle } from '../core/utils';
import { Sparkles } from 'lucide-react';
import type { StepProps } from './shared';

function Demo({ kind }: { kind: NonNullable<FeatureDef['demo']> }) {
  const bar = (w: string) => <div style={{ height: 6, width: w, borderRadius: 3, background: 'var(--line-strong)' }} />;
  switch (kind) {
    case 'whatsapp': return <div className="row"><span style={{ background: '#1F7A4D', color: '#fff', padding: '6px 12px', borderRadius: 999, display: 'inline-flex', gap: 6, alignItems: 'center' }}><MessageCircle size={13} aria-hidden /> Fale conosco</span><span className="muted">botão fixo no canto da tela</span></div>;
    case 'form': return <div className="stack-sm" style={{ gap: 5 }}>{bar('60%')}<div style={{ height: 16, border: '1px solid var(--line-strong)', borderRadius: 4 }} /><div style={{ height: 16, border: '1px solid var(--line-strong)', borderRadius: 4 }} /><span style={{ background: 'var(--ink)', color: '#fff', padding: '3px 10px', borderRadius: 4, justifySelf: 'start', width: 'fit-content' }}>Enviar</span></div>;
    case 'cart': return <div className="row"><ShoppingBag size={16} aria-hidden /><div className="stack-sm" style={{ gap: 4, flex: 1 }}>{bar('70%')}{bar('45%')}</div><span style={{ background: 'var(--ink)', color: '#fff', padding: '3px 10px', borderRadius: 4 }}>Finalizar</span></div>;
    case 'calendar': return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ aspectRatio: '1', borderRadius: 3, background: i === 9 ? 'var(--ink)' : 'var(--line)' }} />)}</div>;
    case 'search': return <div className="row" style={{ border: '1px solid var(--line-strong)', borderRadius: 6, padding: '4px 8px' }}><Search size={13} aria-hidden /><span className="muted">Buscar no site…</span></div>;
    case 'gallery': return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>{Array.from({ length: 4 }, (_, i) => <i key={i} style={{ aspectRatio: '1', borderRadius: 4, background: 'var(--line)' }} />)}</div>;
    case 'login': return <div className="stack-sm" style={{ gap: 5 }}><div style={{ height: 16, border: '1px solid var(--line-strong)', borderRadius: 4 }} /><div style={{ height: 16, border: '1px solid var(--line-strong)', borderRadius: 4 }} /><span style={{ background: 'var(--ink)', color: '#fff', padding: '3px 10px', borderRadius: 4, width: 'fit-content' }}>Entrar</span></div>;
    case 'chat': return <div className="stack-sm" style={{ gap: 5 }}><span style={{ background: 'var(--line)', padding: '4px 8px', borderRadius: '8px 8px 8px 2px', width: 'fit-content' }}>Olá! Como posso ajudar?</span><span style={{ background: 'var(--ink)', color: '#fff', padding: '4px 8px', borderRadius: '8px 8px 2px 8px', width: 'fit-content', alignSelf: 'flex-end' }}>Quero um orçamento</span></div>;
    case 'newsletter': return <div className="row"><div style={{ flex: 1, height: 20, border: '1px solid var(--line-strong)', borderRadius: 4 }} /><span style={{ background: 'var(--ink)', color: '#fff', padding: '3px 10px', borderRadius: 4 }}>Assinar</span></div>;
  }
}

function Item({ f, on, onToggle }: { f: FeatureDef; on: boolean; onToggle: () => void }) {
  return (
    <div>
      <button type="button" className="feature" aria-pressed={on} onClick={onToggle}>
        <span className="box" aria-hidden><Check size={13} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="row-wrap" style={{ gap: 8 }}><span className="choice-title">{f.name}</span>
            <Badge kind={f.level === 'essential' ? 'ink' : undefined}>{LEVEL_LABEL[f.level]}</Badge></span>
          <span className="choice-desc" style={{ display: 'block' }}>{f.desc}</span>
          {f.needs && <span className="tiny" style={{ display: 'flex', gap: 5, marginTop: 6, color: 'var(--warn)' }}><Lock size={12} style={{ marginTop: 2 }} aria-hidden /> Pendente de configuração: {f.needs}</span>}
        </span>
      </button>
      {on && f.demo && <div className="feature-demo" aria-hidden><Demo kind={f.demo} /></div>}
    </div>
  );
}

export function FeaturesStep({ p, set, goToStep }: StepProps) {
  const [more, setMore] = useState<Record<string, boolean>>({});
  const t = siteTypeById(p.siteType);
  const sug = consistency(p);
  const tog = (id: string) => set((q) => ({ ...q, features: toggle(q.features, id) }));
  if (!p.siteType) return <EmptyState icon={<Sparkles />} title="Escolha o tipo de site primeiro" text="Os recursos sugeridos dependem do tipo de site." action={<Button onClick={() => goToStep(2)}>Ir para o tipo de site</Button>} />;
  const missing = t ? t.features.filter((id) => !p.features.includes(id)) : [];
  return (
    <div className="stack-lg">
      {missing.length > 0 && (
        <Callout action={<Button size="sm" onClick={() => set((q) => ({ ...q, features: Array.from(new Set([...q.features, ...missing])) }))}><Wand2 size={14} aria-hidden /> Aplicar</Button>}>
          Para <strong>{t?.name.toLowerCase()}</strong>, costumam fazer sentido {missing.length} {missing.length === 1 ? 'recurso' : 'recursos'}. Nada é marcado sem a sua confirmação.
        </Callout>
      )}
      {sug.map((s) => <Callout key={s.id} kind="warn" action={<Button size="sm" onClick={() => set(s.apply)}><Plus size={14} aria-hidden /> {s.action.replace('Adicionar ', '')}</Button>}>{s.text}</Callout>)}
      {FEATURE_GROUPS.map((g) => {
        const all = FEATURES.filter((f) => f.group === g);
        const rel = all.filter((f) => f.types.includes(p.siteType!));
        const other = all.filter((f) => !f.types.includes(p.siteType!));
        const shownOther = more[g] ? other : other.filter((f) => p.features.includes(f.id));
        const list = [...rel, ...shownOther];
        if (!list.length && !other.length) return null;
        return (
          <section key={g} className="stack-sm">
            <h2 style={{ fontSize: 17, display: 'flex', gap: 8, alignItems: 'center' }}>{g === 'Serviços' ? <Calendar size={16} aria-hidden /> : null}{g}</h2>
            <div className="grid-2" style={{ gap: 10, alignItems: 'start' }}>{list.map((f) => <Item key={f.id} f={f} on={p.features.includes(f.id)} onToggle={() => tog(f.id)} />)}</div>
            {other.length > shownOther.length && <div><Button variant="ghost" size="sm" onClick={() => setMore((m) => ({ ...m, [g]: true }))}>Ver outros recursos de {g.toLowerCase()} ({other.length - shownOther.length})</Button></div>}
          </section>
        );
      })}
      <p className="muted small">Os níveis indicam complexidade típica: <strong>essencial</strong> (quase sempre presente), <strong>opcional</strong> e <strong>avançado</strong> (exige servidor, contas externas ou mais tempo). Valores e prazos são definidos por você, fora desta ferramenta.</p>
    </div>
  );
}
