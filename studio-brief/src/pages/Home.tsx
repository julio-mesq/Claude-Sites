import { useMemo, useRef, useState } from 'react';
import { Copy, FileText, FolderOpen, MoreHorizontal, Plus, Search, Trash2, Upload, UserRound, Info, Play } from 'lucide-react';
import { useStore } from '../core/store';
import { go, href } from '../core/router';
import { progress } from '../core/rules';
import { projectDisplayName, parseImport } from '../core/validation';
import type { Project, ProjectStatus } from '../core/types';
import { relativeTime } from '../core/utils';
import { Brand } from '../components/Topbar';
import { Badge, Button, ConfirmModal, EmptyState, Menu, useToast } from '../components/ui';
import { ProfileModal } from '../components/ProfileModal';
import { DesktopPreview } from '../components/Previews';
import { newProject } from '../core/defaults';
import { applySiteType } from '../core/rules';

export const STATUS_LABEL: Record<ProjectStatus, string> = { progress: 'Em andamento', waiting: 'Aguardando informações', done: 'Briefing concluído', review: 'Em revisão' };

function demoProject(): Project {
  let d = applySiteType(newProject(), 'institutional');
  d = { ...d, client: { ...d.client, company: 'Atelier Norte' }, style: { ...d.style, primary: 'elegant' },
    colors: { paletteId: 'earth', primary: '#A5532F', secondary: '#C8A27C', accent: '#6B7A4B', background: '#FAF4EC', mode: 'light' },
    typography: { ...d.typography, heading: 'playfair', body: 'inter' } };
  return d;
}

export function Home() {
  const { projects, create, duplicate, remove, update, importProject } = useStore();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | ProjectStatus>('all');
  const [del, setDel] = useState<Project | null>(null);
  const [profile, setProfile] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const demo = useMemo(demoProject, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return projects
      .filter((p) => (status === 'all' || p.status === status) && (!t || [p.client.name, p.client.company, p.client.segment].join(' ').toLowerCase().includes(t)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, q, status]);

  const open = (p: Project) => go(p.visited.length || p.currentStep > 0 ? href.step(p.id, p.currentStep) : href.welcome(p.id));
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const res = parseImport(await f.text());
    if (!res.ok) { toast(res.error, 'err'); return; }
    const p = importProject(res.project);
    toast(`“${projectDisplayName(p)}” importado`);
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Brand /><span className="spacer" />
          <Button size="sm" variant="ghost" onClick={() => setProfile(true)}><UserRound size={15} aria-hidden /> <span className="hide-sm">Perfil do profissional</span></Button>
          <Button size="sm" onClick={() => file.current?.click()}><Upload size={15} aria-hidden /> <span className="hide-sm">Importar JSON</span></Button>
          <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Importar arquivo JSON" onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="container">
        <section className="hero">
          <div className="enter">
            <span className="eyebrow">Briefing interativo para sites</span>
            <h1 style={{ marginTop: 14 }}>Desenhe o site junto com seu cliente.</h1>
            <p className="lead">Estilos, cores, páginas e funcionalidades escolhidos na hora, com uma prévia que muda a cada decisão. No final, um documento pronto para guiar o projeto.</p>
            <div className="row-wrap" style={{ marginTop: 28 }}>
              <Button variant="primary" size="lg" onClick={() => { const p = create(); go(href.welcome(p.id)); }}><Plus size={18} aria-hidden /> Novo projeto</Button>
              <Button size="lg" onClick={() => file.current?.click()}><Upload size={16} aria-hidden /> Importar briefing</Button>
            </div>
          </div>
          <div className="hero-art enter" aria-label="Exemplo de prévia" style={{ animationDelay: '0.1s' }}>
            <DesktopPreview project={demo} maxHeight={300} />
            <p className="tiny muted" style={{ marginTop: 10, textAlign: 'center' }}>Exemplo de “Seu site tomando forma”. Simulação conceitual.</p>
          </div>
        </section>

        <section aria-labelledby="proj-h" style={{ paddingBottom: 80 }}>
          <div className="row-wrap" style={{ marginBottom: 14, gap: 12 }}>
            <h2 id="proj-h" style={{ flex: 1 }}>Projetos</h2>
            {projects.length > 0 && <>
              <div className="search" style={{ width: 260 }}>
                <Search size={16} aria-hidden />
                <input className="input" type="search" aria-label="Pesquisar por cliente" placeholder="Pesquisar por cliente" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="select" style={{ width: 210 }} aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="all">Todos os estados</option>
                {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </>}
          </div>
          {projects.length === 0 ? (
            <div className="card"><EmptyState icon={<FolderOpen />} title="Nenhum projeto ainda" text="Comece um novo briefing para conduzir a reunião com seu cliente, ou importe um arquivo exportado antes."
              action={<Button variant="primary" onClick={() => { const p = create(); go(href.welcome(p.id)); }}><Plus size={16} aria-hidden /> Novo projeto</Button>} /></div>
          ) : list.length === 0 ? (
            <div className="card"><EmptyState icon={<Search />} title="Nada encontrado" text="Nenhum projeto corresponde à pesquisa ou ao filtro." action={<Button onClick={() => { setQ(''); setStatus('all'); }}>Limpar filtros</Button>} /></div>
          ) : (
            <div className="proj-table" role="list">
              {list.map((p) => (
                <div className="proj-row" role="listitem" key={p.id}>
                  <div style={{ minWidth: 0 }}>
                    <button type="button" className="proj-name" onClick={() => open(p)}>{projectDisplayName(p)}</button>
                    <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[p.client.name, p.client.segment].filter(Boolean).join(' · ') || 'Sem detalhes do cliente'}</div>
                  </div>
                  <div className="col-hide"><div className="mini-progress" role="progressbar" aria-label="Progresso" aria-valuenow={Math.round(progress(p) * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${progress(p) * 100}%` }} /></div>
                    <div className="tiny muted" style={{ marginTop: 4 }}>Editado {relativeTime(p.updatedAt)}</div></div>
                  <div className="col-hide">
                    <label className="sr-only" htmlFor={`st-${p.id}`}>Estado de {projectDisplayName(p)}</label>
                    <select id={`st-${p.id}`} className="select" style={{ height: 32, fontSize: 13 }} value={p.status} onChange={(e) => update(p.id, (x) => ({ ...x, status: e.target.value as ProjectStatus }))}>
                      {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Button size="sm" onClick={() => open(p)}><Play size={13} aria-hidden /> Continuar</Button>
                    <Menu label={`Mais ações para ${projectDisplayName(p)}`} trigger={<MoreHorizontal size={18} />}>
                      {(close) => <>
                        <button role="menuitem" onClick={() => { close(); go(href.overview(p.id)); }}><FileText size={15} aria-hidden /> Visão geral</button>
                        <button role="menuitem" onClick={() => { close(); const c = duplicate(p.id); if (c) toast('Projeto duplicado'); }}><Copy size={15} aria-hidden /> Duplicar</button>
                        <button role="menuitem" className="danger" onClick={() => { close(); setDel(p); }}><Trash2 size={15} aria-hidden /> Excluir</button>
                      </>}
                    </Menu>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="small muted row" style={{ marginTop: 16, alignItems: 'flex-start' }}><Info size={15} style={{ flex: 'none', marginTop: 3 }} aria-hidden />
            <span>Os projetos ficam salvos apenas neste navegador e neste dispositivo. Não há sincronização na nuvem: use <strong>Exportar JSON</strong> na visão geral para guardar ou levar um briefing para outro lugar.</span></p>
          <Badge>{projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}</Badge>
        </section>
      </main>
      {del && <ConfirmModal danger title="Excluir projeto?" confirmLabel="Excluir" text={<>O briefing de <strong>{projectDisplayName(del)}</strong> será removido deste navegador. Se precisar dele depois, exporte o JSON antes. Esta ação não pode ser desfeita.</>}
        onConfirm={() => { remove(del.id); toast('Projeto excluído'); }} onClose={() => setDel(null)} />}
      {profile && <ProfileModal onClose={() => setProfile(false)} />}
    </>
  );
}
