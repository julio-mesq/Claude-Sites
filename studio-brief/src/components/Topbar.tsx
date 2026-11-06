import { Check, ChevronLeft, CircleAlert, Layers, Loader2 } from 'lucide-react';
import { useStore } from '../core/store';
import { href } from '../core/router';

export function Brand() {
  return (
    <a className="brand" href={href.home()} aria-label="Studio Brief — projetos">
      <span className="brand-mark" aria-hidden><Layers size={16} /></span>
      <span>Studio Brief</span>
    </a>
  );
}

export function SaveIndicator() {
  const { saveState, saveError } = useStore();
  if (saveState === 'error') return <span className="save-state err" role="alert"><CircleAlert size={14} aria-hidden /> Não foi possível salvar: {saveError}</span>;
  if (saveState === 'saving') return <span className="save-state" aria-live="polite"><Loader2 size={14} className="spinner-icon" aria-hidden /> Salvando…</span>;
  return <span className="save-state" aria-live="polite" title="Os dados ficam salvos somente neste navegador e dispositivo."><Check size={14} aria-hidden /> Salvo neste navegador</span>;
}

export function BackToProjects() {
  return <a className="btn btn-ghost btn-sm" href={href.home()}><ChevronLeft size={15} aria-hidden /> Projetos</a>;
}
