import { newProject } from './defaults';
import { SCHEMA_VERSION, SCREEN_COUNT, STEP_ORDER, type Project, type ProjectStatus, type StepFlag } from './types';
import { SITE_TYPES, STYLES } from './catalogs';
import { nowIso } from './utils';

/** Copia `raw` sobre a forma de `def`, descartando tipos incompatíveis. */
function coerce<T>(def: T, raw: unknown): T {
  if (def === null) return (typeof raw === 'string' ? raw : null) as T;
  if (typeof def === 'string') return (typeof raw === 'string' ? raw.slice(0, 20000) : def) as T;
  if (typeof def === 'number') return (typeof raw === 'number' && Number.isFinite(raw) ? raw : def) as T;
  if (typeof def === 'boolean') return (typeof raw === 'boolean' ? raw : def) as T;
  if (Array.isArray(def)) return (Array.isArray(raw) ? raw : def) as T;
  if (typeof def === 'object') {
    const src = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
    const keys = Object.keys(def as object);
    const out: Record<string, unknown> = {};
    if (keys.length === 0) {
      for (const [k, v] of Object.entries(src)) if (typeof v === 'string') out[k] = v.slice(0, 200);
      return out as T;
    }
    for (const k of keys) out[k] = coerce((def as Record<string, unknown>)[k], src[k]);
    return out as T;
  }
  return def;
}

const STATUSES: ProjectStatus[] = ['progress', 'waiting', 'done', 'review'];
const str = (v: unknown, max = 5000) => (typeof v === 'string' ? v.slice(0, max) : '');
const strArray = (v: unknown, max = 100) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map((s) => s.slice(0, 200)) : []);

export function normalizeProject(raw: unknown): Project {
  const base = newProject();
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo sem dados de projeto.');
  const r = raw as Record<string, unknown>;
  const p = coerce(base, r) as Project;

  p.id = str(r.id, 64) || base.id;
  p.schemaVersion = SCHEMA_VERSION;
  p.createdAt = Number.isNaN(Date.parse(str(r.createdAt))) ? nowIso() : str(r.createdAt);
  p.updatedAt = Number.isNaN(Date.parse(str(r.updatedAt))) ? nowIso() : str(r.updatedAt);
  if (!STATUSES.includes(p.status)) p.status = 'progress';
  p.currentStep = Math.min(Math.max(Math.trunc(p.currentStep) || 0, 0), SCREEN_COUNT - 1);
  p.visited = strArray(r.visited).filter((s): s is Project['visited'][number] => (STEP_ORDER as string[]).includes(s));
  p.flags = Object.fromEntries(Object.entries(p.flags).filter(([k, v]) => (STEP_ORDER as string[]).includes(k) && ['skipped', 'unknown', 'recommend'].includes(v))) as Partial<Record<Project['visited'][number], StepFlag>>;
  if (p.siteType && !SITE_TYPES.some((t) => t.id === p.siteType)) p.siteType = null;
  if (p.style.primary && !STYLES.some((s) => s.id === p.style.primary)) p.style.primary = null;
  p.style.secondary = strArray(p.style.secondary, 4).filter((s): s is Project['style']['secondary'][number] => STYLES.some((x) => x.id === s));
  for (const k of Object.keys(p.style.sliders) as (keyof Project['style']['sliders'])[]) {
    p.style.sliders[k] = Math.min(100, Math.max(0, p.style.sliders[k]));
  }
  if (!['light', 'dark'].includes(p.colors.mode)) p.colors.mode = 'light';
  for (const k of ['primary', 'secondary', 'accent', 'background'] as const) {
    if (!/^#[0-9a-f]{6}$/i.test(p.colors[k])) p.colors[k] = base.colors[k];
  }
  p.goals.selected = strArray(p.goals.selected);
  p.goals.actions = strArray(p.goals.actions);
  p.features = strArray(p.features, 200);
  p.priorities = Object.fromEntries(Object.entries(p.priorities).filter(([, v]) => ['must', 'nice', 'later'].includes(v))) as Project['priorities'];
  p.pages = (Array.isArray(r.pages) ? r.pages : []).slice(0, 60).flatMap((x) => {
    if (!x || typeof x !== 'object') return [];
    const o = x as Record<string, unknown>;
    return [{ id: str(o.id, 40) || Math.random().toString(36).slice(2, 12), key: str(o.key, 40) || 'custom', name: str(o.name, 80) || 'Página', sections: strArray(o.sections, 40) }];
  });
  p.homeId = p.pages.some((x) => x.id === p.homeId) ? p.homeId : (p.pages[0]?.id ?? '');
  p.content.has = Object.fromEntries(Object.entries(p.content.has).filter(([, v]) => ['yes', 'partial', 'no'].includes(v))) as Project['content']['has'];
  p.content.refs = (Array.isArray((r.content as Record<string, unknown> | undefined)?.refs) ? ((r.content as Record<string, unknown>).refs as unknown[]) : []).slice(0, 30).flatMap((x) => {
    if (!x || typeof x !== 'object') return [];
    const o = x as Record<string, unknown>;
    return [{ id: str(o.id, 40) || Math.random().toString(36).slice(2, 12), url: str(o.url, 500), likes: strArray(o.likes, 10), note: str(o.note, 1000) }];
  });
  p.tech.answers = Object.fromEntries(Object.entries(p.tech.answers).filter(([, v]) => ['yes', 'no', 'unsure'].includes(v))) as Project['tech']['answers'];
  if (!['', 'client', 'developer', 'shared'].includes(p.timeline.contentOwner)) p.timeline.contentOwner = '';
  if (!['', 'none', 'occasional', 'monthly', 'undecided'].includes(p.timeline.support)) p.timeline.support = '';
  return p;
}

export type ImportResult = { ok: true; project: Project; hasNotes: boolean } | { ok: false; error: string };

export function parseImport(text: string): ImportResult {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'O arquivo não é um JSON válido.' }; }
  if (!data || typeof data !== 'object') return { ok: false, error: 'O arquivo está vazio ou em formato inesperado.' };
  const env = data as Record<string, unknown>;
  if (env.app !== 'studio-brief' || typeof env.project !== 'object' || env.project === null) {
    return { ok: false, error: 'Este arquivo não parece ter sido exportado pelo Studio Brief.' };
  }
  if (typeof env.schemaVersion === 'number' && env.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'O arquivo foi gerado por uma versão mais nova do Studio Brief.' };
  }
  try {
    const project = normalizeProject(env.project);
    return { ok: true, project, hasNotes: project.devNotes.trim().length > 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Não foi possível ler o projeto.' };
  }
}

export const projectDisplayName = (p: Project) => p.client.company.trim() || p.client.name.trim() || 'Projeto sem nome';
