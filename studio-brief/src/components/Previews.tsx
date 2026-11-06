import { useMemo, useState } from 'react';
import { Maximize2, Monitor, Smartphone, Info } from 'lucide-react';
import type { Project } from '../core/types';
import { buildTheme, previewCopy, themeFromStyle } from '../core/theme';
import { homePage } from '../core/rules';
import { SiteCanvas, ScaledFrame } from './SiteCanvas';
import { Modal, Segmented } from './ui';
import { SITE_TYPES, siteTypeById, type StyleSpec } from '../core/catalogs';

function useCanvasProps(p: Project) {
  return useMemo(() => {
    const theme = buildTheme(p);
    const type = siteTypeById(p.siteType) ?? SITE_TYPES[0];
    const home = homePage(p);
    const sections = home?.sections.length ? home.sections : type.homeSections;
    const landing = p.siteType === 'landing';
    const nav = landing
      ? sections.filter((s) => s !== 'hero' && s !== 'cta').slice(0, 5).map((s) => ({ about: 'Sobre', services: 'Benefícios', steps: 'Como funciona', testimonials: 'Depoimentos', faq: 'Dúvidas', contact: 'Contato' } as Record<string, string>)[s] ?? 'Seção')
      : p.pages.length ? p.pages.map((x) => x.name) : type.structure;
    const has = (...ids: string[]) => ids.some((i) => p.features.includes(i));
    const extras = { whatsapp: has('whatsapp', 'whatsapp-orders'), cart: has('cart'), search: has('search'), login: has('login', 'client-panel') };
    return { theme, copy: previewCopy(p), nav, sections, extras };
  }, [p]);
}

export function DesktopPreview({ project, maxHeight = 520 }: { project: Project; maxHeight?: number }) {
  const c = useCanvasProps(project);
  return (
    <div className="device-frame" aria-label="Prévia em computador">
      <div className="browser-bar"><i /><i /><i /><span className="url">{(project.client.company || 'suamarca').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'suamarca'}.com.br</span></div>
      <ScaledFrame width={1200} maxHeight={maxHeight}><SiteCanvas {...c} device="desktop" /></ScaledFrame>
    </div>
  );
}

export function MobilePreview({ project, maxHeight = 560 }: { project: Project; maxHeight?: number }) {
  const c = useCanvasProps(project);
  const [open, setOpen] = useState(false);
  return (
    <div className="phone-frame" aria-label="Prévia em celular" style={{ position: 'relative' }}>
      <ScaledFrame width={375} maxHeight={maxHeight}><SiteCanvas {...c} device="mobile" menuOpen={open} onMenuToggle={() => setOpen((o) => !o)} /></ScaledFrame>
    </div>
  );
}

export function SimNote() {
  return <p className="sim-note"><Info size={14} style={{ flex: 'none', marginTop: 2 }} aria-hidden />Simulação conceitual com conteúdo genérico. Mostra a direção visual, não o site final.</p>;
}

/** Painel “Seu site tomando forma”. */
export function PreviewPanel({ project }: { project: Project }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [full, setFull] = useState(false);
  return (
    <section className="preview-panel" aria-label="Seu site tomando forma">
      <div className="preview-head">
        <div style={{ flex: 1 }}><div className="eyebrow">Seu site tomando forma</div><div className="preview-live"><i aria-hidden /> Atualiza a cada escolha</div></div>
        <Segmented label="Dispositivo" value={device} onChange={setDevice} options={[{ value: 'desktop', label: 'Computador' }, { value: 'mobile', label: 'Celular' }]} />
        <button type="button" className="btn btn-ghost icon-btn" aria-label="Ver prévia em tela cheia" title="Tela cheia" onClick={() => setFull(true)}><Maximize2 size={16} /></button>
      </div>
      {device === 'desktop' ? <DesktopPreview project={project} /> : <MobilePreview project={project} />}
      <SimNote />
      {full && <PreviewModal project={project} onClose={() => setFull(false)} />}
    </section>
  );
}

export function PreviewModal({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <Modal title="Seu site tomando forma" onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 190px', gap: 20, alignItems: 'start' }} className="preview-full">
        <div><div className="row small muted" style={{ marginBottom: 8 }}><Monitor size={14} aria-hidden /> Computador</div><DesktopPreview project={project} maxHeight={460} /></div>
        <div><div className="row small muted" style={{ marginBottom: 8 }}><Smartphone size={14} aria-hidden /> Celular</div><MobilePreview project={project} maxHeight={460} /></div>
      </div>
      <SimNote />
    </Modal>
  );
}

/** Miniatura real de um estilo (renderiza o mesmo componente da prévia). */
export function StyleThumb({ spec }: { spec: StyleSpec }) {
  const theme = useMemo(() => ({ ...themeFromStyle(spec), maxSections: 1, motion: 'none' as const }), [spec]);
  const type = SITE_TYPES[0];
  return (
    <div className="style-thumb-wrap" aria-hidden style={{ background: theme.bg }}>
      <ScaledFrame width={1200}>
        <SiteCanvas theme={theme} device="desktop" copy={{ brand: 'Marca', title: 'Título de exemplo', sub: 'Uma linha de apoio que mostra o tom visual.', cta: 'Ação' }}
          nav={['Início', 'Sobre', 'Contato']} sections={['hero', ...type.homeSections.slice(1, 2)]} />
      </ScaledFrame>
    </div>
  );
}
