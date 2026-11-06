import { useEffect } from 'react';
import { SearchX } from 'lucide-react';
import { StoreProvider, useStore } from './core/store';
import { href, useRoute } from './core/router';
import { ToastProvider, EmptyState } from './components/ui';
import { Home } from './pages/Home';
import { Welcome } from './pages/Welcome';
import { Journey } from './pages/Journey';
import { Overview } from './pages/Overview';
import { Brand } from './components/Topbar';
import { projectDisplayName } from './core/validation';

function Router() {
  const route = useRoute();
  const { projects } = useStore();
  const project = route.name === 'home' ? null : projects.find((p) => p.id === route.id) ?? null;
  useEffect(() => {
    if (route.name === 'home') document.title = 'Studio Brief';
    else if (route.name === 'overview' && project) document.title = `Visão geral · ${projectDisplayName(project)} · Studio Brief`;
    else if (route.name === 'welcome') document.title = 'Novo projeto · Studio Brief';
  }, [route, project]);
  if (route.name === 'home') return <Home />;
  if (!project) {
    return (
      <>
        <header className="topbar"><div className="topbar-inner"><Brand /></div></header>
        <main id="conteudo" tabIndex={-1} className="container"><EmptyState icon={<SearchX />} title="Projeto não encontrado" text="Ele pode ter sido excluído, ou foi criado em outro navegador ou dispositivo." action={<a className="btn btn-primary" href={href.home()}>Voltar aos projetos</a>} /></main>
      </>
    );
  }
  if (route.name === 'welcome') return <Welcome project={project} />;
  if (route.name === 'overview') return <Overview project={project} />;
  return <Journey project={project} step={route.step} />;
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }}>Ir para o conteúdo</a>
        <Router />
      </ToastProvider>
    </StoreProvider>
  );
}
