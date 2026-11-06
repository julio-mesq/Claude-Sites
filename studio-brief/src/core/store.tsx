import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadProfile, loadProjects, loadUi, saveProfile, saveProjects, saveUi, type UiPrefs } from './storage';
import { newProject } from './defaults';
import { nowIso, uid } from './utils';
import type { Profile, Project } from './types';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Store {
  projects: Project[];
  profile: Profile;
  ui: UiPrefs;
  saveState: SaveState;
  saveError: string | null;
  create: () => Project;
  update: (id: string, fn: (p: Project) => Project) => void;
  duplicate: (id: string) => Project | null;
  remove: (id: string) => void;
  importProject: (p: Project) => Project;
  setProfile: (p: Profile) => string | null;
  setMeeting: (v: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [profile, setProfileState] = useState<Profile>(() => loadProfile());
  const [ui, setUi] = useState<UiPrefs>(() => loadUi());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const ref = useRef(projects);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const err = saveProjects(ref.current);
    setSaveError(err);
    setSaveState(err ? 'error' : 'saved');
  }, []);

  const commit = useCallback((next: Project[]) => {
    ref.current = next;
    setProjects(next);
    dirty.current = true;
    setSaveState('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 350);
  }, [flush]);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('beforeunload', onHide);
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onHide);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  const value = useMemo<Store>(() => ({
    projects, profile, ui, saveState, saveError,
    create: () => { const p = newProject(); commit([p, ...ref.current]); return p; },
    update: (id, fn) => commit(ref.current.map((p) => (p.id === id ? { ...fn(p), updatedAt: nowIso() } : p))),
    duplicate: (id) => {
      const src = ref.current.find((p) => p.id === id);
      if (!src) return null;
      const copy: Project = structuredClone(src);
      copy.id = uid(); copy.createdAt = copy.updatedAt = nowIso();
      copy.client.company = copy.client.company ? `${copy.client.company} (cópia)` : copy.client.company;
      if (!copy.client.company) copy.client.name = copy.client.name ? `${copy.client.name} (cópia)` : '';
      commit([copy, ...ref.current]);
      return copy;
    },
    remove: (id) => commit(ref.current.filter((p) => p.id !== id)),
    importProject: (p) => {
      const exists = ref.current.some((x) => x.id === p.id);
      const next = { ...p, id: exists ? uid() : p.id, updatedAt: nowIso() };
      commit([next, ...ref.current]);
      return next;
    },
    setProfile: (pr) => { const err = saveProfile(pr); if (!err) setProfileState(pr); return err; },
    setMeeting: (v) => { const u = { meeting: v }; setUi(u); saveUi(u); },
  }), [projects, profile, ui, saveState, saveError, commit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider ausente');
  return s;
}
