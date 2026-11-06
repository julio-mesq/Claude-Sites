import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'welcome'; id: string }
  | { name: 'step'; id: string; step: number }
  | { name: 'overview'; id: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'p' && parts[1]) {
    const id = decodeURIComponent(parts[1]);
    if (parts[2] === 'overview') return { name: 'overview', id };
    if (parts[2] === 'step') return { name: 'step', id, step: Math.max(0, Math.min(5, Number(parts[3]) || 0)) };
    return { name: 'welcome', id };
  }
  return { name: 'home' };
}

export const href = {
  home: () => '#/',
  welcome: (id: string) => `#/p/${id}`,
  step: (id: string, step: number) => `#/p/${id}/step/${step}`,
  overview: (id: string) => `#/p/${id}/overview`,
};

// Na versão publicada como artefato o endereço da página não aceita rotas “#/…”,
// então a navegação é mantida em memória (VITE_MEMORY_ROUTER=1 no build).
const MEMORY = import.meta.env.VITE_MEMORY_ROUTER === '1';
let memHash = '#/';
const listeners = new Set<() => void>();
const currentHash = () => (MEMORY ? memHash : window.location.hash);

export function go(h: string) {
  if (!MEMORY) { window.location.hash = h; return; }
  memHash = h;
  listeners.forEach((f) => f());
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(currentHash()));
  useEffect(() => {
    const on = () => setRoute(parseHash(currentHash()));
    if (!MEMORY) {
      window.addEventListener('hashchange', on);
      return () => window.removeEventListener('hashchange', on);
    }
    listeners.add(on);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#/"]');
      if (!a || e.defaultPrevented) return;
      e.preventDefault();
      go(a.getAttribute('href')!);
    };
    document.addEventListener('click', onClick);
    return () => { listeners.delete(on); document.removeEventListener('click', onClick); };
  }, []);
  return route;
}
