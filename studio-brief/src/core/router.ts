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
    if (parts[2] === 'step') return { name: 'step', id, step: Math.max(0, Math.min(11, Number(parts[3]) || 0)) };
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

export function go(h: string) { window.location.hash = h; }

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
