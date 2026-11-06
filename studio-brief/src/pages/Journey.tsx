import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, FileText, Lightbulb, ListChecks, NotebookPen, Presentation, SkipForward, HelpCircle, Check } from 'lucide-react';
import type { Project, StepId } from '../core/types';
import { STEP_META, SCREENS, recommend, progress } from '../core/rules';
import { useStore } from '../core/store';
import { go, href } from '../core/router';
import { projectDisplayName } from '../core/validation';
import { Brand, SaveIndicator } from '../components/Topbar';
import { Button, Callout, Drawer, Segmented, TextArea } from '../components/ui';
import { PreviewPanel } from '../components/Previews';
import { QuickSummary } from '../components/QuickSummary';
import type { StepProps } from '../steps/shared';
import { ClientStep } from '../steps/Step1Client';
import { GoalsStep } from '../steps/Step2Goals';
import { SiteTypeStep } from '../steps/Step3SiteType';
import { StyleStep } from '../steps/Step4Style';
import { ColorsStep } from '../steps/Step5Colors';
import { TypographyStep } from '../steps/Step6Typography';
import { PagesStep } from '../steps/Step7Pages';
import { FeaturesStep } from '../steps/Step8Features';
import { BehaviorStep } from '../steps/Step9Behavior';
import { ContentStep } from '../steps/Step10Content';
import { TechStep } from '../steps/Step11Tech';
import { TimelineStep } from '../steps/Step12Timeline';

const COMPONENTS: Record<StepId, (p: StepProps) => React.ReactNode> = {
  client: ClientStep, goals: GoalsStep, siteType: SiteTypeStep, style: StyleStep, colors: ColorsStep, typography: TypographyStep,
  pages: PagesStep, features: FeaturesStep, behavior: BehaviorStep, content: ContentStep, tech: TechStep, timeline: TimelineStep,
};

export function Journey({ project, step }: { project: Project; step: number }) {
  const { update, ui, setMeeting } = useStore();
  const [summary, setSummary] = useState(false);
  const [notes, setNotes] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const screen = SCREENS[step];
  const ids = screen.steps;
  const meeting = ui.meeting;
  const set = (fn: (p: Project) => Project) => update(project.id, fn);

  useEffect(() => {
    set((q) => {
      const missing = ids.filter((i) => !q.visited.includes(i));
      return missing.length === 0 && q.currentStep === step ? q : { ...q, currentStep: step, visited: [...q.visited, ...missing] };
    });
    setRecOpen(false); setPreviewOpen(false);
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    document.title = `${screen.title} · ${projectDisplayName(project)} · Studio Brief`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, project.id]);

  const goStep = (n: number) => go(href.step(project.id, n));
  const last = step >= SCREENS.length - 1;
  const clearFlags = () => set((q) => { if (!ids.some((i) => q.flags[i])) return q; const flags = { ...q.flags }; ids.forEach((i) => delete flags[i]); return { ...q, flags }; });
  const next = () => { clearFlags(); if (last) go(href.overview(project.id)); else goStep(step + 1); };
  const prev = () => { if (step > 0) goStep(step - 1); };
  const mark = (flag: 'skipped' | 'unknown') => { set((q) => { const flags = { ...q.flags }; ids.forEach((i) => { flags[i] = flag; }); return { ...q, flags }; }); if (last) go(href.overview(project.id)); else goStep(step + 1); };
  const recs = ids.map((i) => ({ id: i, r: recommend(project, i) })).filter((x) => x.r !== null);
  const pct = Math.round(((step + 1) / SCREENS.length) * 100);
  const done = progress(project);
  const showSkip = !ids.includes('client');

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <Brand />
          <span className="muted hide-sm" aria-hidden>/</span>
          <span className="hide-sm" style={{ fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectDisplayName(project)}</span>
          <span className="spacer" />
          <span className="hide-sm"><SaveIndicator /></span>
          <Segmented label="Modo de uso" value={meeting ? 'meeting' : 'edit'} onChange={(v) => setMeeting(v === 'meeting')} options={[{ value: 'edit', label: 'Edição' }, { value: 'meeting', label: 'Reunião' }]} />
          <Button size="sm" onClick={() => setSummary(true)}><ListChecks size={15} aria-hidden /> <span className="hide-sm">Resumo</span></Button>
          <a className="btn btn-sm btn-primary hide-sm" href={href.overview(project.id)}><FileText size={15} aria-hidden /> Visão geral</a>
        </div>
        <div className="stepper" role="progressbar" aria-label="Progresso do briefing" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ width: `${pct}%` }} /></div>
      </header>

      <div className={`shell with-preview${meeting ? ' meeting' : ''}`}>
        {!meeting && (
          <nav className="rail no-print" aria-label="Etapas do briefing">
            <div className="eyebrow" style={{ padding: '0 10px 10px' }}>Etapas</div>
            {SCREENS.map((sc, i) => {
              const state = sc.steps.some((x) => project.flags[x]) ? 'flag' : sc.steps.every((x) => project.visited.includes(x)) && i !== step ? 'done' : '';
              return (
                <button key={sc.title} type="button" className={`rail-item ${state}`} aria-current={i === step ? 'step' : undefined} onClick={() => goStep(i)}>
                  <span className="rail-dot" aria-hidden>{state === 'done' ? <Check size={11} /> : state === 'flag' ? '?' : i + 1}</span>
                  <span>{sc.title}</span>
                </button>
              );
            })}
            <p className="tiny muted" style={{ padding: '14px 10px 0' }}>{Math.round(done * 100)}% das etapas percorridas</p>
          </nav>
        )}

        <main className="main" id="conteudo" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
          <div className="main-inner" key={step}>
            {ids.map((id, idx) => {
              const Comp = COMPONENTS[id];
              return (
                <section key={id} aria-labelledby={`h-${id}`} className={idx > 0 ? 'screen-part' : undefined}>
                  <div className="step-head enter">
                    <div className="eyebrow">{idx === 0 ? `Tela ${step + 1} de ${SCREENS.length} · ` : ''}{STEP_META[id].title}</div>
                    {idx === 0 ? <h1 id={`h-${id}`}>{STEP_META[id].question}</h1> : <h2 id={`h-${id}`} className="part-title">{STEP_META[id].question}</h2>}
                    {project.flags[id] === 'unknown' && <div style={{ marginTop: 10 }}><span className="badge badge-warn"><HelpCircle size={12} aria-hidden /> Marcado como “ainda não sei”</span></div>}
                    {project.flags[id] === 'skipped' && <div style={{ marginTop: 10 }}><span className="badge badge-warn"><SkipForward size={12} aria-hidden /> Pulado por enquanto</span></div>}
                  </div>
                  <div className="enter"><Comp p={project} set={set} meeting={meeting} goToStep={goStep} /></div>
                </section>
              );
            })}

            {showSkip && (
              <div className="skip-bar no-print">
                <Button variant="ghost" size="sm" onClick={() => mark('skipped')}><SkipForward size={14} aria-hidden /> Pular esta tela</Button>
                <Button variant="ghost" size="sm" onClick={() => mark('unknown')}><HelpCircle size={14} aria-hidden /> Ainda não sei</Button>
                {recs.length > 0 && <Button variant="ghost" size="sm" onClick={() => { set((q) => { const flags = { ...q.flags }; ids.forEach((i) => { flags[i] = 'recommend'; }); return { ...q, flags }; }); setRecOpen(true); }}><Lightbulb size={14} aria-hidden /> Quero uma recomendação</Button>}
              </div>
            )}
            {recs.length > 0 && recOpen && (
              <div className="rec-box" role="region" aria-label="Recomendação">
                <div className="eyebrow">Recomendação</div>
                {recs.map(({ id, r }) => (<div key={id} style={{ marginTop: 8 }}><h3>{STEP_META[id].short}: {r!.title}</h3><ul>{r!.lines.map((l) => <li key={l}>{l}</li>)}</ul></div>))}
                <p className="tiny muted" style={{ marginBottom: 12 }}>Nada muda até você confirmar.</p>
                <div className="row-wrap">
                  <Button variant="primary" size="sm" onClick={() => { set((q) => { let out = q; for (const i of ids) { const r = recommend(out, i); if (r) out = r.apply(out); } const flags = { ...out.flags }; ids.forEach((i) => delete flags[i]); return { ...out, flags }; }); setRecOpen(false); }}>Aplicar recomendação</Button>
                  <Button size="sm" onClick={() => setRecOpen(false)}>Agora não</Button>
                </div>
              </div>
            )}
          </div>
        </main>

        {(
          <aside className={`preview-col no-print${previewOpen ? ' open' : ''}`} aria-label="Prévia do site">
            <div className="hide-desktop-only" style={{ display: previewOpen ? 'block' : undefined, marginBottom: 8 }}>
              <Button size="sm" className="preview-toggle-fab" onClick={() => setPreviewOpen(false)}>Fechar prévia</Button>
            </div>
            <PreviewPanel project={project} />
          </aside>
        )}
      </div>

      <nav className="footer-nav no-print" aria-label="Navegação entre etapas">
        <div className="footer-nav-inner">
          <Button onClick={prev} disabled={step === 0}><ArrowLeft size={16} aria-hidden /> <span className="btn-label">Voltar</span></Button>
          <span className="dots" aria-hidden>{SCREENS.map((sc, i) => <i key={sc.title} className={i <= step ? 'on' : ''} />)}</span>
          <span className="small muted hide-sm">{screen.title} · {step + 1}/{SCREENS.length}</span>
          <span className="spacer" />
          {!meeting && <Button variant="ghost" onClick={() => setNotes(true)}><NotebookPen size={16} aria-hidden /> <span className="btn-label">Anotações</span></Button>}
          <Button className="preview-toggle-fab" onClick={() => setPreviewOpen(true)}><Eye size={16} aria-hidden /> <span className="btn-label">Prévia</span></Button>
          <Button variant="primary" onClick={next}>{last ? <><Presentation size={16} aria-hidden /> <span>Ver visão geral</span></> : <><span>Avançar</span> <ArrowRight size={16} aria-hidden /></>}</Button>
        </div>
      </nav>

      {summary && <Drawer title="Resumo até agora" onClose={() => setSummary(false)}><QuickSummary p={project} onEdit={(n) => { setSummary(false); goStep(n); }} /></Drawer>}
      {notes && !meeting && (
        <Drawer title="Anotações privadas" onClose={() => setNotes(false)}>
          <Callout>Visíveis apenas no modo de edição. Não aparecem no Modo reunião, no PDF nem no JSON, a menos que você inclua de propósito.</Callout>
          <div style={{ marginTop: 16 }}><TextArea label="Anotações do desenvolvedor" value={project.devNotes} onChange={(e) => set((q) => ({ ...q, devNotes: e.target.value }))} style={{ minHeight: 260 }} /></div>
        </Drawer>
      )}
    </>
  );
}
