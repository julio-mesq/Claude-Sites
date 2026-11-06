export const SCHEMA_VERSION = 1;

export type ProjectStatus = 'progress' | 'waiting' | 'done' | 'review';
export type StepId =
  | 'client' | 'goals' | 'siteType' | 'style' | 'colors' | 'typography'
  | 'pages' | 'features' | 'behavior' | 'content' | 'tech' | 'timeline';
export type StepFlag = 'skipped' | 'unknown' | 'recommend';
export type Tri = 'yes' | 'no' | 'unsure' | '';
export type Priority = 'must' | 'nice' | 'later';

export type SiteTypeId =
  | 'institutional' | 'landing' | 'store' | 'portfolio' | 'menu'
  | 'booking' | 'blog' | 'events' | 'education' | 'custom';
export type StyleId =
  | 'minimal' | 'elegant' | 'corporate' | 'modern' | 'creative' | 'warm' | 'editorial' | 'tech';
export type SliderId = 'detail' | 'tone' | 'presence' | 'innovation' | 'motion';

export interface PageItem {
  id: string;
  key: string; // chave do catálogo ou "custom"
  name: string;
  sections: string[]; // chaves de SECTIONS
}

export interface Reference {
  id: string;
  url: string;
  likes: string[];
  note: string;
}

export interface Behavior {
  header: 'fixed' | 'normal' | null;
  menu: 'classic' | 'centered' | 'minimal' | null;
  buttons: 'rounded' | 'square' | null;
  cards: 'subtle' | 'elevated' | null;
  spacing: 'compact' | 'comfortable' | 'airy' | null;
  layout: 'centered' | 'wide' | null;
  imagery: 'photos' | 'illustrations' | null;
  icons: 'line' | 'filled' | null;
  motion: 'none' | 'subtle' | 'rich' | null;
  hover: 'none' | 'lift' | 'highlight' | null;
  transitions: 'none' | 'fade' | 'slide' | null;
  mobileMenu: 'drawer' | 'fullscreen' | 'bottom' | null;
}

export interface Project {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  currentStep: number;
  visited: StepId[];
  flags: Partial<Record<StepId, StepFlag>>;
  devNotes: string;
  client: {
    name: string; company: string; segment: string; city: string; whatsapp: string;
    email: string; instagram: string; otherSocial: string; address: string;
    description: string; hasSite: '' | 'yes' | 'no'; currentUrl: string;
  };
  goals: {
    selected: string[]; other: string; audience: string; competitors: string;
    differentials: string; actions: string[]; actionsOther: string;
  };
  siteType: SiteTypeId | null;
  style: { primary: StyleId | null; secondary: StyleId[]; sliders: Record<SliderId, number> };
  colors: {
    paletteId: string; primary: string; secondary: string; accent: string;
    background: string; mode: 'light' | 'dark';
  };
  typography: {
    pairId: string; heading: string; body: string; feel: 'any' | 'traditional' | 'modern';
    weight: 'light' | 'regular' | 'strong'; scale: 'compact' | 'medium' | 'large';
  };
  pages: PageItem[];
  homeId: string;
  features: string[];
  priorities: Record<string, Priority>;
  behavior: Behavior;
  content: {
    has: Record<string, 'yes' | 'partial' | 'no'>;
    refs: Reference[];
    toProduce: string;
    materialsLink: string;
  };
  tech: {
    answers: Record<string, Tri>;
    domainName: string; hostingNote: string; externalList: string;
    languages: string; a11yNote: string; paymentsNote: string;
  };
  timeline: {
    launchDate: string; event: string; budget: string; budgetLater: boolean;
    contentOwner: '' | 'client' | 'developer' | 'shared';
    support: '' | 'none' | 'occasional' | 'monthly' | 'undecided';
    scopeNotes: string;
  };
}

export interface Profile {
  name: string;
  tagline: string;
  logo: string; // data URL (opcional)
}

export const STEP_ORDER: StepId[] = [
  'client', 'goals', 'siteType', 'style', 'colors', 'typography',
  'pages', 'features', 'behavior', 'content', 'tech', 'timeline',
];
