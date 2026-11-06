import { Fragment, useState } from 'react';
import { Check, ClipboardCopy, Download, FileDown, Pencil, Printer, RotateCcw, Upload, UserRound, Monitor, Smartphone } from 'lucide-react';
import type { Project, ProjectStatus } from '../core/types';
import { CONTENT_ITEMS, FEATURES, FEATURE_GROUPS, PRIORITY_LABEL, SLIDERS, TECH_QUESTIONS, fontById, paletteById, siteTypeById, styleById } from '../core/catalogs';
import { exportJson, goalLabels, summaryText } from '../core/export';
import { effective } from '../steps/Step9Behavior';
import { buildTheme } from '../core/theme';
import { checkContrast } from '../core/contrast';
import { pendencies, screenOf, STEP_META } from '../core/rules';
import { parseImport, projectDisplayName } from '../core/validation';
import { formatDate, formatDateTime } from '../core/utils';
import { useStore } from '../core/store';
import { go, href } from '../core/router';
import { Brand, SaveIndicator } from '../components/Topbar';
import { Badge, Button, Callout, Modal, Switch, useToast } from '../components/ui';
import { DesktopPreview, MobilePreview, SimNote } from '../components/Previews';
import { ProfileModal } from '../components/ProfileModal';
import { STATUS_LABEL } from './Home';

const TRI = { yes: 'Sim', no: 'Não', unsure: 'Não sei' } as const;
const HAS = { yes: 'Já possui', partial: 'Em parte', no: 'Ainda não possui' } as const;
const MOTION = { none: 'Sem animações', subtle: 'Animações discretas', rich: 'Animações mais elaboradas' } as const;
const SUPPORT = { none: 'Não precisa', occasional: 'Quando necessário', monthly: 'Acompanhamento mensal', undecided: 'Ainda não decidiu' } as const;
const OWNER = { client: 'O cliente', developer: 'O desenvolvedor', shared: 'Os dois, em conjunto' } as const;

type Row = [string, React.ReactNode | null | undefined | false];
function Dl({ rows }: { rows: Row[] }) {
  return (
    <dl className="dl">
      {rows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v || <span className="muted">Não informado</span>}</dd></Fragment>))}
    </dl>
  );
}
function Sec({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return <section className="ov-section" aria-labelledby={`ov-${n}`}><h2 id={`ov-${n}`}><span className="ov-num" aria-hidden>{n}</span>{title}</h2>{children}</section>;
}
const Colors = ({ items }: { items: [string, string][] }) => <div className="row-wrap" style={{ gap: 10 }}>{items.map(([l, c]) => <span className="color-chip" key={l}><i style={{ background: c }} />{l} {c}</span>)}</div>;

export function Overview({ project: p }: { project: Project }) {
  const { update, profile, importProject } = useStore();
  const toast = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [exp, setExp] = useState(false);
  const [prof, setProf] = useState(false);
  const [jsonNotes, setJsonNotes] = useState(false);
  const th = buildTheme(p);
  const pend = pendencies(p);
  const type = siteTypeById(p.siteType);
  const style = styleById(p.style.primary);
  const checks = checkContrast({ primary: th.primary, secondary: th.secondary, background: th.bg, ink: th.ink, onPrimary: th.onPrimary });
  const name = projectDisplayName(p);
  const setStatus = (s: ProjectStatus) => update(p.id, (q) => ({ ...q, status: s }));
  const copy = async () => {
    try { await navigator.clipboard.writeText(summaryText(p, profile, showNotes)); toast('Resumo copiado'); }
    catch { toast('Não foi possível copiar. Use a exportação em JSON.', 'err'); }
  };
  const feats = (g: string) => p.features.map((id) => FEATURES.find((f) => f.id === id)).filter((f) => f && f.group === g);
  const byPrio = (k: 'must' | 'nice' | 'later') => p.features.filter((id) => p.priorities[id] === k).map((id) => FEATURES.find((f) => f.id === id)?.name).filter(Boolean).join(', ');
  const integrations = p.features.map((id) => FEATURES.find((f) => f.id === id)).filter((f) => f?.integration);
  const toProduce = CONTENT_ITEMS.filter((c) => p.content.has[c.id] === 'no' || p.content.has[c.id] === 'partial');

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <Brand /><span className="muted hide-sm" aria-hidden>/</span><span className="hide-sm" style={{ fontWeight: 500 }}>Visão geral</span>
          <span className="spacer" /><span className="hide-sm"><SaveIndicator /></span>
          <a className="btn btn-sm" href={href.step(p.id, p.currentStep)}><Pencil size={14} aria-hidden /> Voltar e editar</a>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="ov">
        <div className="print-cover">
          <div className="row" style={{ gap: 14 }}>
            {profile.logo ? <img src={profile.logo} alt={profile.name || 'Logotipo do profissional'} style={{ height: 44, maxWidth: 160, objectFit: 'contain' }} /> : null}
            <div><div style={{ fontWeight: 650, fontSize: 16 }}>{profile.name || 'Nome do profissional responsável'}</div><div className="small muted">{profile.tagline}</div></div>
          </div>
          <div style={{ textAlign: 'right' }}><div className="eyebrow">Briefing de site</div><div className="small muted">{formatDate(new Date().toISOString())}</div></div>
        </div>

        <div className="stack-lg">
          <div className="row-wrap no-print" style={{ alignItems: 'flex-end', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span className="eyebrow">Visão geral do projeto</span>
              <h1 style={{ marginTop: 6 }}>{name}</h1>
              <p className="muted small" style={{ marginTop: 4 }}>Atualizado em {formatDateTime(p.updatedAt)}</p>
            </div>
            <div className="field" style={{ minWidth: 220 }}>
              <label htmlFor="status">Estado do projeto</label>
              <select id="status" className="select" value={p.status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>{(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
            </div>
          </div>
          <div className="ov-title-print" style={{ display: 'none' }}><h1>{name}</h1></div>

          <div className="ov-actions no-print">
            {p.status === 'done'
              ? <Button onClick={() => { setStatus('review'); toast('Briefing reaberto para revisão'); }}><RotateCcw size={15} aria-hidden /> Reabrir para revisão</Button>
              : <Button variant="primary" onClick={() => { setStatus('done'); toast('Briefing marcado como concluído'); }}><Check size={15} aria-hidden /> Marcar como concluído</Button>}
            <Button onClick={() => setExp(true)}><FileDown size={15} aria-hidden /> Exportar PDF</Button>
            <Button onClick={() => window.print()}><Printer size={15} aria-hidden /> Imprimir</Button>
            <Button onClick={() => exportJson(p, jsonNotes)}><Download size={15} aria-hidden /> Exportar JSON</Button>
            <label className="btn" style={{ cursor: 'pointer' }}><Upload size={15} aria-hidden /> Importar JSON
              <input type="file" accept="application/json,.json" className="sr-only" aria-label="Importar arquivo JSON" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
                const r = parseImport(await f.text());
                if (!r.ok) { toast(r.error, 'err'); return; }
                const np = importProject(r.project); toast('Importado como novo projeto'); go(href.overview(np.id));
              }} /></label>
            <Button onClick={copy}><ClipboardCopy size={15} aria-hidden /> Copiar resumo</Button>
            <Button variant="ghost" onClick={() => setProf(true)}><UserRound size={15} aria-hidden /> Perfil do profissional</Button>
          </div>
          {p.status === 'done' && <Callout kind="ok">Briefing concluído. Você ainda pode editar as respostas ou reabrir para revisão.</Callout>}
          <div className="no-print"><Switch checked={showNotes} onChange={setShowNotes} label={<span>Mostrar anotações privadas <span className="muted small">(aparecem na tela, no PDF e no resumo copiado)</span></span>} /></div>

          <Sec n={1} title="Dados do cliente"><Dl rows={[
            ['Nome', p.client.name], ['Empresa ou marca', p.client.company], ['Segmento', p.client.segment], ['Cidade e região', p.client.city],
            ['WhatsApp', p.client.whatsapp], ['E-mail', p.client.email], ['Instagram', p.client.instagram], ['Outras redes', p.client.otherSocial],
            ['Endereço', p.client.address], ['Descrição', p.client.description],
            ['Site atual', p.client.hasSite === 'yes' ? (p.client.currentUrl || 'Possui (endereço não informado)') : p.client.hasSite === 'no' ? 'Ainda não possui' : null],
          ]} /></Sec>
          <Sec n={2} title="Objetivos do site"><Dl rows={[['Objetivos', goalLabels(p).join(' · ')], ['Ações do visitante', [...p.goals.actions, p.goals.actionsOther].filter(Boolean).join(' · ')], ['Diferenciais', p.goals.differentials], ['Concorrentes', p.goals.competitors]]} /></Sec>
          <Sec n={3} title="Tipo de projeto"><Dl rows={[['Tipo de site', type?.name], ['Estrutura típica', type?.structure.join(' → ')]]} /></Sec>
          <Sec n={4} title="Público-alvo"><Dl rows={[['Público', p.goals.audience]]} /></Sec>

          <Sec n={5} title="Direção visual escolhida">
            <Dl rows={[['Estilo principal', style ? `${style.name} — ${style.blurb}` : null], ['Características secundárias', p.style.secondary.map((s) => styleById(s)?.name).join(' · ') || null],
              ['Tendências', SLIDERS.map((s) => { const v = p.style.sliders[s.id]; return `${v < 45 ? s.left : v > 55 ? s.right : 'Equilibrado'}`; }).join(' · ')]]} />
            <div className="grid-2" style={{ marginTop: 22, alignItems: 'start' }} aria-label="Composição da prévia visual">
              <div><div className="row small muted" style={{ marginBottom: 8 }}><Monitor size={14} aria-hidden /> Computador</div><DesktopPreview project={p} maxHeight={360} /></div>
              <div><div className="row small muted" style={{ marginBottom: 8 }}><Smartphone size={14} aria-hidden /> Celular</div><MobilePreview project={p} maxHeight={360} /></div>
            </div>
            <div style={{ marginTop: 12 }}><SimNote /></div>
          </Sec>
          <Sec n={6} title="Paleta de cores">
            <Colors items={[['Principal', p.colors.primary], ['Secundária', p.colors.secondary], ['Destaque', p.colors.accent], ['Fundo', p.colors.background]]} />
            <p className="small muted" style={{ marginTop: 10 }}>{paletteById(p.colors.paletteId).name} · tema {p.colors.mode === 'dark' ? 'escuro' : 'claro'} · contraste: {checks.every((c) => c.pass) ? 'todas as combinações aprovadas' : `${checks.filter((c) => !c.pass).length} combinação(ões) abaixo do recomendado`}</p>
          </Sec>
          <Sec n={7} title="Tipografia">
            <div style={{ background: th.bg, border: '1px solid var(--line)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontFamily: th.headingFont, fontWeight: th.headingWeight, fontSize: 28, color: th.ink }}>{fontById(p.typography.heading).name}</div>
              <div style={{ fontFamily: th.bodyFont, color: th.muted, marginTop: 4 }}>{fontById(p.typography.body).name} — Texto corrido de exemplo para leitura confortável.</div>
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>Peso dos títulos: {{ light: 'leve', regular: 'médio', strong: 'forte' }[p.typography.weight]} · Tamanho: {{ compact: 'compacto', medium: 'médio', large: 'grande' }[p.typography.scale]}</p>
          </Sec>
          <Sec n={8} title="Mapa de páginas">
            {p.pages.length === 0 ? <p className="muted">Nenhuma página definida.</p> : (
              <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>{p.pages.map((pg) => <li key={pg.id}><strong>{pg.name}</strong>{pg.id === p.homeId && <> <Badge kind="ink">Principal</Badge></>}<span className="muted small"> — {pg.sections.map((s) => s).length} seções</span></li>)}</ol>
            )}
          </Sec>
          <Sec n={9} title="Funcionalidades selecionadas">
            {p.features.length === 0 ? <p className="muted">Nenhuma funcionalidade selecionada.</p> : FEATURE_GROUPS.map((g) => feats(g).length > 0 && (
              <div key={g} style={{ marginBottom: 10 }}><div className="small muted">{g}</div><div className="row-wrap" style={{ marginTop: 4 }}>{feats(g).map((f) => <Badge key={f!.id}>{f!.name}</Badge>)}</div></div>
            ))}
          </Sec>
          <Sec n={10} title="Interface e animações"><Dl rows={[
            ['Cabeçalho', effective(th, 'header') === 'fixed' ? 'Fixo' : 'Normal'], ['Menu', { classic: 'Tradicional', centered: 'Centralizado', minimal: 'Minimalista' }[th.menu]],
            ['Botões', effective(th, 'buttons') === 'rounded' ? 'Arredondados' : 'Retos'], ['Cartões', th.card === 'elevated' ? 'Destacados' : 'Discretos'],
            ['Espaçamento', { compact: 'Compacto', comfortable: 'Confortável', airy: 'Amplo' }[effective(th, 'spacing') as 'compact']], ['Imagens', th.imagery === 'photos' ? 'Fotografias' : 'Ilustrações'],
            ['Ícones', th.icons === 'line' ? 'Lineares' : 'Preenchidos'], ['Animações', MOTION[th.motion]], ['Menu no celular', { drawer: 'Lateral', fullscreen: 'Tela cheia', bottom: 'Painel inferior' }[th.mobileMenu]],
          ]} /></Sec>
          <Sec n={11} title="Conteúdo disponível">
            {CONTENT_ITEMS.some((c) => p.content.has[c.id]) ? <div className="row-wrap">{CONTENT_ITEMS.filter((c) => p.content.has[c.id]).map((c) => <Badge key={c.id} kind={p.content.has[c.id] === 'yes' ? 'ok' : undefined}>{c.label}: {HAS[p.content.has[c.id]]}</Badge>)}</div> : <p className="muted">Não informado.</p>}
          </Sec>
          <Sec n={12} title="Materiais pendentes">
            {toProduce.length || p.content.toProduce ? <Dl rows={[['Itens', toProduce.map((c) => `${c.label} (${p.content.has[c.id] === 'no' ? 'não possui' : 'em parte'})`).join(' · ') || null], ['A produzir', p.content.toProduce], ['Link de materiais', p.content.materialsLink]]} /> : <p className="muted">Nenhum material pendente registrado.</p>}
          </Sec>
          <Sec n={13} title="Integrações necessárias">
            {integrations.length ? <ul style={{ margin: 0, paddingLeft: 20 }}>{integrations.map((f) => <li key={f!.id}>{f!.name} <span className="muted small">— pendente de configuração{f!.needs ? `: ${f!.needs}` : ''}</span></li>)}</ul> : <p className="muted">Nenhuma integração externa selecionada.</p>}
            {p.tech.externalList && <p className="small" style={{ marginTop: 8 }}>Sistemas citados: {p.tech.externalList}</p>}
          </Sec>
          <Sec n={14} title="Requisitos técnicos">
            <Dl rows={[...TECH_QUESTIONS.filter((q) => p.tech.answers[q.id]).map((q): Row => [q.q, TRI[p.tech.answers[q.id] as 'yes']]),
              ...(p.tech.domainName ? [['Domínio', p.tech.domainName] as Row] : []), ...(p.tech.languages ? [['Idiomas', p.tech.languages] as Row] : []), ...(p.tech.a11yNote ? [['Acessibilidade', p.tech.a11yNote] as Row] : [])]} />
            {!Object.keys(p.tech.answers).length && <p className="muted">Não respondido.</p>}
          </Sec>
          <Sec n={15} title="Prazo desejado"><Dl rows={[['Lançamento', formatDate(p.timeline.launchDate)], ['Evento ou prazo importante', p.timeline.event], ['Conteúdo fornecido por', p.timeline.contentOwner && OWNER[p.timeline.contentOwner]], ['Suporte depois do lançamento', p.timeline.support && SUPPORT[p.timeline.support]]]} /></Sec>
          <Sec n={16} title="Faixa de investimento"><Dl rows={[['Informada pelo cliente', p.timeline.budgetLater ? 'Prefere conversar sobre valores depois' : p.timeline.budget], ['Observações comerciais', p.timeline.scopeNotes]]} /></Sec>
          <Sec n={17} title="Prioridades"><Dl rows={(Object.keys(PRIORITY_LABEL) as (keyof typeof PRIORITY_LABEL)[]).map((k): Row => [PRIORITY_LABEL[k], byPrio(k)])} /></Sec>
          <Sec n={18} title="Referências">
            {p.content.refs.filter((r) => r.url).length ? <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 6 }}>{p.content.refs.filter((r) => r.url).map((r) => <li key={r.id}>{r.url}{r.likes.length > 0 && <span className="muted small"> — gostou de: {r.likes.join(', ').toLowerCase()}</span>}{r.note && <span className="muted small"> · {r.note}</span>}</li>)}</ul> : <p className="muted">Nenhuma referência informada.</p>}
          </Sec>
          {showNotes && <Sec n={19} title="Observações do desenvolvedor"><p style={{ whiteSpace: 'pre-wrap' }}>{p.devNotes.trim() || <span className="muted">Sem anotações.</span>}</p></Sec>}
          {!showNotes && <Callout>As observações privadas do desenvolvedor estão ocultas. Ative “Mostrar anotações privadas” acima para incluí-las.</Callout>}
          <Sec n={20} title="Pendências e decisões em aberto">
            {pend.length === 0 ? <p className="muted">Nada em aberto. O briefing está completo.</p> : (
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 8 }}>{pend.map((x) => (
                <li key={x.id} className="row" style={{ gap: 10 }}><span style={{ flex: 1 }}>{x.text}</span>
                  <a className="btn btn-ghost btn-sm no-print" href={href.step(p.id, screenOf(x.step))}>Resolver · {STEP_META[x.step].short}</a></li>))}</ul>
            )}
          </Sec>
          <p className="tiny muted" style={{ textAlign: 'center' }}>Gerado com Studio Brief · {profile.name || 'responsável não informado'} · {formatDate(new Date().toISOString())}</p>
        </div>
      </main>
      {exp && (
        <Modal title="Exportar e imprimir" onClose={() => setExp(false)} footer={<><Button onClick={() => setExp(false)}>Fechar</Button><Button variant="primary" onClick={() => { setExp(false); setTimeout(() => window.print(), 150); }}><Printer size={15} aria-hidden /> Abrir impressão / PDF</Button></>}>
          <p className="muted small">O PDF é gerado pelo diálogo de impressão do navegador: escolha <strong>Salvar como PDF</strong> como destino. O documento tem capa com o seu nome ou logotipo e começa por esta visão geral.</p>
          <Switch checked={showNotes} onChange={setShowNotes} label="Incluir anotações privadas do desenvolvedor" />
          <Callout kind={showNotes ? 'warn' : 'info'}>{showNotes ? 'Atenção: as anotações privadas serão impressas e aparecerão no PDF.' : 'As anotações privadas ficam fora do PDF.'}</Callout>
          <div className="row"><span className="small">{profile.name ? <>Responsável: <strong>{profile.name}</strong></> : 'Nenhum nome de profissional definido'}</span><Button size="sm" variant="ghost" onClick={() => { setExp(false); setProf(true); }}>Editar perfil</Button></div>
          <hr className="divider" />
          <Switch checked={jsonNotes} onChange={setJsonNotes} label="Incluir anotações privadas no JSON exportado" />
          <div className="row-wrap"><Button onClick={() => exportJson(p, jsonNotes)}><Download size={15} aria-hidden /> Baixar JSON</Button><Button onClick={copy}><ClipboardCopy size={15} aria-hidden /> Copiar resumo</Button></div>
        </Modal>
      )}
      {prof && <ProfileModal onClose={() => setProf(false)} />}
    </>
  );
}
