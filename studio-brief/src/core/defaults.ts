import { SCHEMA_VERSION, type Behavior, type Profile, type Project } from './types';
import { nowIso, uid } from './utils';

export const emptyBehavior = (): Behavior => ({
  header: null, menu: null, buttons: null, cards: null, spacing: null, layout: null,
  imagery: null, icons: null, motion: null, hover: null, transitions: null, mobileMenu: null,
});

export function newProject(): Project {
  const t = nowIso();
  return {
    id: uid(), schemaVersion: SCHEMA_VERSION, createdAt: t, updatedAt: t,
    status: 'progress', currentStep: 0, visited: [], flags: {}, devNotes: '',
    client: {
      name: '', company: '', segment: '', city: '', whatsapp: '', email: '', instagram: '',
      otherSocial: '', address: '', description: '', hasSite: '', currentUrl: '',
    },
    goals: { selected: [], other: '', audience: '', competitors: '', differentials: '', actions: [], actionsOther: '' },
    siteType: null,
    style: { primary: null, secondary: [], sliders: { detail: 50, tone: 40, presence: 40, innovation: 50, motion: 40 } },
    colors: { paletteId: 'neutral', primary: '#4B5563', secondary: '#A8A29E', accent: '#B08D57', background: '#F8F9FA', mode: 'light' },
    typography: { pairId: 'clean', heading: 'inter', body: 'inter', feel: 'any', weight: 'regular', scale: 'medium' },
    pages: [], homeId: '',
    features: [], priorities: {},
    behavior: emptyBehavior(),
    content: { has: {}, refs: [], toProduce: '', materialsLink: '' },
    tech: { answers: {}, domainName: '', hostingNote: '', externalList: '', languages: '', a11yNote: '', paymentsNote: '' },
    timeline: { launchDate: '', event: '', budget: '', budgetLater: false, contentOwner: '', support: '', scopeNotes: '' },
  };
}

export const emptyProfile = (): Profile => ({ name: '', tagline: '', logo: '' });
