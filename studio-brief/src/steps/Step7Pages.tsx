import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, GripVertical, Home, Plus, Trash2 } from 'lucide-react';
import { Button, Callout, EmptyState, IconButton, TextField } from '../components/ui';
import { SECTIONS } from '../core/catalogs';
import { availablePages, consistency, isLanding, makePage } from '../core/rules';
import type { PageItem, Project } from '../core/types';
import { move } from '../core/utils';
import { FileText } from 'lucide-react';
import { Section, type StepProps } from './shared';

export function SectionEditor({ sections, onChange, label }: { sections: string[]; onChange: (s: string[]) => void; label: string }) {
  const free = Object.keys(SECTIONS).filter((k) => !sections.includes(k));
  return (
    <div className="stack-sm">
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }} aria-label={label}>
        {sections.map((s, i) => (
          <li key={s} className="row" style={{ padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 8, gap: 6 }}>
            <span className="tiny muted" style={{ width: 18 }}>{i + 1}</span><span style={{ flex: 1, fontSize: 14 }}>{SECTIONS[s] ?? s}</span>
            <IconButton label={`Subir ${SECTIONS[s]}`} disabled={i === 0} onClick={() => onChange(move(sections, i, i - 1))}><ArrowUp size={15} /></IconButton>
            <IconButton label={`Descer ${SECTIONS[s]}`} disabled={i === sections.length - 1} onClick={() => onChange(move(sections, i, i + 1))}><ArrowDown size={15} /></IconButton>
            <IconButton label={`Remover ${SECTIONS[s]}`} onClick={() => onChange(sections.filter((x) => x !== s))}><Trash2 size={15} /></IconButton>
          </li>
        ))}
      </ol>
      {free.length > 0 && (
        <div className="chips">{free.map((k) => <button key={k} type="button" className="chip" style={{ minHeight: 32, padding: '4px 12px', fontSize: 13 }} onClick={() => onChange([...sections, k])}><Plus size={13} aria-hidden />{SECTIONS[k]}</button>)}</div>
      )}
    </div>
  );
}

function SiteMap({ p }: { p: Project }) {
  const home = p.pages.find((x) => x.id === p.homeId) ?? p.pages[0];
  if (!home) return null;
  const rest = p.pages.filter((x) => x.id !== home.id);
  return (
    <div className="sitemap card" role="img" aria-label={`Mapa de navegação: ${home.name} com ${rest.length} páginas`}>
      <div className="sitemap-root">{home.name}</div>
      {rest.length > 0 && <div className="sitemap-children">{rest.map((x) => <div className="sitemap-node" key={x.id}>{x.name}<small>{x.sections.length} seções</small></div>)}</div>}
    </div>
  );
}

function Landing({ p, set }: StepProps) {
  const page = p.pages[0];
  if (!page) return null;
  return (
    <div className="stack-lg">
      <Callout>Uma landing page é uma página única. Aqui você escolhe e ordena as <strong>seções</strong> em vez de várias páginas.</Callout>
      <SectionEditor label="Seções da página" sections={page.sections} onChange={(s) => set((q) => ({ ...q, pages: q.pages.map((x, i) => (i === 0 ? { ...x, sections: s } : x)) }))} />
    </div>
  );
}

export function PagesStep(props: StepProps) {
  const { p, set } = props;
  const [open, setOpen] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);
  const [custom, setCustom] = useState('');
  if (!p.siteType) return <EmptyState icon={<FileText />} title="Escolha o tipo de site primeiro" text="As páginas sugeridas dependem do tipo de site." action={<Button onClick={() => props.goToStep(1)}>Ir para o tipo de site</Button>} />;
  if (isLanding(p)) return <Landing {...props} />;
  const avail = availablePages(p);
  const sug = consistency(p);
  const updPage = (id: string, fn: (x: PageItem) => PageItem) => set((q) => ({ ...q, pages: q.pages.map((x) => (x.id === id ? fn(x) : x)) }));
  const reorder = (from: number, to: number) => set((q) => ({ ...q, pages: move(q.pages, from, to) }));
  const add = (key: string, name?: string) => set((q) => { const pg = makePage(key, name); return { ...q, pages: [...q.pages, pg], homeId: q.homeId || pg.id }; });
  const remove = (id: string) => set((q) => { const pages = q.pages.filter((x) => x.id !== id); return { ...q, pages, homeId: q.homeId === id ? (pages[0]?.id ?? '') : q.homeId }; });
  return (
    <div className="stack-lg">
      {sug.map((s) => <Callout key={s.id} kind="warn" action={<Button size="sm" onClick={() => set(s.apply)}>{s.action}</Button>}>{s.text}</Callout>)}
      <div className="stack-sm">
        {p.pages.length === 0 && <EmptyState icon={<FileText />} title="Nenhuma página ainda" text="Escolha abaixo as páginas que o site deve ter." />}
        {p.pages.map((pg, i) => (
          <div key={pg.id}>
            <div className={`page-item${drag?.from === i ? ' dragging' : ''}${drag && drag.over === i && drag.from !== i ? ' over' : ''}`} draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDrag({ from: i, over: i }); }}
              onDragOver={(e) => { e.preventDefault(); if (drag && drag.over !== i) setDrag({ ...drag, over: i }); }}
              onDrop={(e) => { e.preventDefault(); if (drag) reorder(drag.from, i); setDrag(null); }} onDragEnd={() => setDrag(null)}>
              <span className="grip" aria-hidden><GripVertical size={16} /></span>
              <input className="input" aria-label={`Nome da página ${i + 1}`} value={pg.name} maxLength={60} onChange={(e) => updPage(pg.id, (x) => ({ ...x, name: e.target.value }))} onBlur={(e) => { if (!e.target.value.trim()) updPage(pg.id, (x) => ({ ...x, name: 'Página sem nome' })); }} style={{ flex: 1 }} />
              <button type="button" className={`chip${p.homeId === pg.id ? '' : ''}`} style={{ minHeight: 30, padding: '2px 10px', fontSize: 12.5 }} aria-pressed={p.homeId === pg.id} onClick={() => set((q) => ({ ...q, homeId: pg.id }))}><Home size={12} aria-hidden /> Principal</button>
              <IconButton label={`Subir ${pg.name}`} disabled={i === 0} onClick={() => reorder(i, i - 1)}><ArrowUp size={15} /></IconButton>
              <IconButton label={`Descer ${pg.name}`} disabled={i === p.pages.length - 1} onClick={() => reorder(i, i + 1)}><ArrowDown size={15} /></IconButton>
              <IconButton label={open === pg.id ? `Ocultar seções de ${pg.name}` : `Definir seções de ${pg.name}`} onClick={() => setOpen(open === pg.id ? null : pg.id)}>{open === pg.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</IconButton>
              <IconButton label={`Remover ${pg.name}`} onClick={() => remove(pg.id)}><Trash2 size={15} /></IconButton>
            </div>
            {open === pg.id && <div className="enter" style={{ padding: '12px 0 4px 34px' }}><div className="label" style={{ marginBottom: 8 }}>Seções de “{pg.name}”</div><SectionEditor label={`Seções de ${pg.name}`} sections={pg.sections} onChange={(s) => updPage(pg.id, (x) => ({ ...x, sections: s }))} /></div>}
          </div>
        ))}
      </div>
      <Section title="Adicionar páginas">
        <div className="chips">
          {avail.filter((d) => !p.pages.some((x) => x.key === d.key)).map((d) => <button key={d.key} type="button" className="chip" title={d.hint} onClick={() => add(d.key)}><Plus size={14} aria-hidden />{d.name}</button>)}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { add('custom', custom.trim()); setCustom(''); } }}>
          <TextField label="Página personalizada" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ex.: Nossa equipe" style={{ minWidth: 0 }} />
          <Button type="submit" disabled={!custom.trim()} style={{ alignSelf: 'flex-end' }}><Plus size={14} aria-hidden /> Adicionar</Button>
        </form>
      </Section>
      {p.pages.length > 0 && <Section title="Mapa de navegação"><SiteMap p={p} /></Section>}
    </div>
  );
}
