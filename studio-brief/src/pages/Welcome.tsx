import { ArrowRight, Clock, Eye, Save } from 'lucide-react';
import { Brand } from '../components/Topbar';
import { Button } from '../components/ui';
import { go, href } from '../core/router';
import type { Project } from '../core/types';
import { useStore } from '../core/store';

export function Welcome({ project }: { project: Project }) {
  const { ui, setMeeting } = useStore();
  return (
    <>
      <header className="topbar"><div className="topbar-inner"><Brand /><span className="spacer" /><a className="btn btn-ghost btn-sm" href={href.home()}>Sair para projetos</a></div></header>
      <main id="conteudo" tabIndex={-1} className="welcome">
        <div className="welcome-inner enter">
          <span className="eyebrow">Novo projeto</span>
          <h1>Vamos desenhar o seu site, juntos.</h1>
          <p className="muted" style={{ fontSize: 17, maxWidth: '46ch', margin: '0 auto' }}>Você vai fazer escolhas visuais, uma de cada vez. A prévia muda na hora, e tudo fica registrado automaticamente.</p>
          <div className="row-wrap" style={{ justifyContent: 'center', margin: '28px 0 32px', gap: 24 }}>
            <span className="small muted row" style={{ gap: 6 }}><Clock size={15} aria-hidden /> Cerca de 20 a 30 minutos</span>
            <span className="small muted row" style={{ gap: 6 }}><Save size={15} aria-hidden /> Salvamento automático</span>
            <span className="small muted row" style={{ gap: 6 }}><Eye size={15} aria-hidden /> Pode pular ou voltar quando quiser</span>
          </div>
          <Button variant="primary" size="lg" onClick={() => go(href.step(project.id, 0))}>Começar <ArrowRight size={18} aria-hidden /></Button>
          <div style={{ marginTop: 22 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMeeting(!ui.meeting)}>{ui.meeting ? 'Modo reunião ativado · alterar para edição' : 'Ativar Modo reunião para apresentar ao cliente'}</button>
          </div>
        </div>
      </main>
    </>
  );
}
