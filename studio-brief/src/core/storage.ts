import { emptyProfile } from './defaults';
import { normalizeProject } from './validation';
import type { Profile, Project } from './types';

const KEY = 'studiobrief:v1:projects';
const PROFILE_KEY = 'studiobrief:v1:profile';
const UI_KEY = 'studiobrief:v1:ui';

export interface UiPrefs { meeting: boolean }

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function loadProjects(): Project[] {
  const raw = read(KEY);
  if (!Array.isArray(raw)) return [];
  const out: Project[] = [];
  for (const item of raw) {
    try { out.push(normalizeProject(item)); } catch { /* ignora item corrompido */ }
  }
  return out;
}

/** Retorna null em caso de sucesso, ou uma mensagem de erro. */
export function saveProjects(projects: Project[]): string | null {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(projects));
    return null;
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
    return quota ? 'Armazenamento do navegador cheio.' : 'Este navegador não permite salvar dados locais.';
  }
}

export function loadProfile(): Profile {
  const raw = read(PROFILE_KEY) as Partial<Profile> | null;
  const d = emptyProfile();
  if (!raw || typeof raw !== 'object') return d;
  return {
    name: typeof raw.name === 'string' ? raw.name.slice(0, 120) : '',
    tagline: typeof raw.tagline === 'string' ? raw.tagline.slice(0, 160) : '',
    logo: typeof raw.logo === 'string' && raw.logo.startsWith('data:image/') && raw.logo.length < 400_000 ? raw.logo : '',
  };
}

export function saveProfile(p: Profile): string | null {
  try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); return null; } catch { return 'Não foi possível salvar o perfil.'; }
}

export function loadUi(): UiPrefs {
  const raw = read(UI_KEY) as Partial<UiPrefs> | null;
  return { meeting: !!raw?.meeting };
}
export function saveUi(u: UiPrefs) { try { window.localStorage.setItem(UI_KEY, JSON.stringify(u)); } catch { /* opcional */ } }
