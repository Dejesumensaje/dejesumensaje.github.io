// Home page content for the F redesign. Positions are in the comp's own
// coordinates (px inside a stage/card of the given size) and are converted to
// percentages at render time, so the art direction scales with the layout.

export interface BrowserShot {
  src: string;
  alt: string;
  w: number; // natural image width
  h: number; // natural image height
  x: number; // left inside the stage
  y: number; // top inside the stage
  width: number; // rendered width inside the stage
}

export interface PhoneShot {
  src: string;
  alt: string;
  x: number;
  y: number;
  width: number;
  screenH: number;
  radius: number;
  island?: boolean;
  rot?: [number, number, number]; // rotateY, rotateX, rotateZ (deg)
  tilt?: boolean; // follows the cursor (featured only)
  depth?: number; // thickness in comp px (default ~11)
}

export interface CardBrowser extends BrowserShot {
  rot?: [number, number, number];
}

export interface CaseCard {
  title: string;
  summary: string;
  meta: string;
  href?: string;
  locked?: boolean;
  confidential?: boolean; // softens the capture: client data stays unreadable
  span: 5 | 7 | 12;
  stage: { w: number; h: number };
  browser?: BrowserShot;
  phone?: PhoneShot;
}

export const featured: CaseCard = {
  title: 'A design system for humans and AI agents',
  summary: 'From a Figma library that AI demos were bypassing to a code package and governance agents can follow.',
  meta: 'Deloitte · Design systems · 2024–now',
  href: '/design-system-ai-agents',
  span: 12,
  stage: { w: 1296, h: 560 },
  browser: {
    src: '/assets/f/ds-colors.webp',
    alt: 'Design system documentation: the color page with brand, neutral and text swatches.',
    w: 1440, h: 810, x: 148, y: 64, width: 1000,
  },
};

export const cases: CaseCard[] = [
  {
    title: 'Prototyping store pricing with AI',
    summary:
      'Working prototypes, built with AI, to test experience directions in days instead of weeks: desktop for the office, mobile for the store floor.',
    meta: 'Deloitte · US grocery retail · In progress',
    href: '/store-pricing-ai',
    span: 7,
    stage: { w: 746, h: 480 },
    browser: {
      src: '/assets/f/store-pricing-desktop.webp',
      alt: 'Store pricing prototype on desktop: a table of items with base and retail prices, promotions, HQ recommendations and status.',
      w: 1440, h: 810, x: 190, y: 48, width: 620,
    },
    phone: {
      src: '/assets/f/store-pricing-phone.webp',
      alt: 'The same prototype on a phone, editing the price of a single item on the store floor.',
      x: 48, y: 40, width: 172, screenH: 350, radius: 30, island: true, rot: [3, 0, 0],
    },
  },
  {
    title: 'Bringing learning to rural classrooms without internet',
    summary: 'An offline-first product for teachers where connectivity is a barrier, not an assumption.',
    meta: 'Ministry of Education · 2019–2021',
    href: '/aprender-digital',
    span: 5,
    stage: { w: 526, h: 480 },
    browser: {
      src: '/assets/f/aprender-digital.webp',
      alt: 'Aprender Digital, light version: landing page explaining the offline platform.',
      w: 1400, h: 700, x: 48, y: 119, width: 430,
    },
  },
  {
    title: 'Simplifying Colombia Aprende for inclusion and equity',
    summary: 'A 17-year-old national platform, rebuilt so teachers and students could actually find what they need.',
    meta: 'Ministry of Education · 2019–2021',
    href: '/colombia-aprende',
    span: 12,
    stage: { w: 1296, h: 560 },
    browser: {
      src: '/assets/f/colombia-aprende.webp',
      alt: 'The redesigned Colombia Aprende home page with featured content and news.',
      w: 1400, h: 700, x: 148, y: 64, width: 1000,
    },
  },
];

// Reading order of the case studies (home order); NextStory follows it.
export const caseOrder = [featured, ...cases].map((c) => ({ title: c.title, meta: c.meta, href: c.href! }));

export interface SideProject {
  title: string;
  summary: string;
  href: string;
  color: string; // CSS var
  dark: boolean; // light text on the card
  phones: PhoneShot[];
  browser?: CardBrowser; // a desktop window instead of (or with) phones
}

const shot = (src: string, alt: string) => ({ src, alt });

export const sideProjects: SideProject[] = [
  {
    title: 'El Oráculo',
    summary: "Alucine's oracle reads your cards and recommends what to watch each night.",
    href: 'https://alucine.co/oraculo',
    color: 'var(--project-oraculo)',
    dark: true,
    phones: [
      { ...shot('/assets/f/oraculo.webp', "Alucine's oracle: tarot-style cards that recommend a film."), x: 73, y: -57, width: 270, screenH: 554, radius: 46, rot: [0.5, 51, 0], depth: 13 },
    ],
  },
  {
    title: 'Sortícula',
    summary: "A jewelry workshop's store that feels one of a kind on every visit.",
    href: 'https://sorticula.com/',
    color: 'var(--project-sorticula)',
    dark: true,
    phones: [
      { ...shot('/assets/f/sorticula-b.webp', 'Sortícula home in its cobalt palette.'), x: 2, y: 33, width: 236, screenH: 480, radius: 40, island: true, rot: [23.5, 5.5, -12.6], depth: 11 },
      { ...shot('/assets/f/sorticula-a.webp', 'Sortícula home in its warm palette.'), x: 222, y: 66, width: 196, screenH: 394, radius: 33, island: true, rot: [-26.5, 7, 1.8], depth: 9 },
    ],
  },
  {
    title: 'Hostal Santa Ana',
    summary: 'A hostel site that is really a hub for exploring the Tenza valley in Boyacá.',
    href: 'https://tenzasantaana.netlify.app/',
    color: 'var(--project-hostal)',
    dark: false,
    phones: [],
    browser: {
      src: '/assets/f/hostal-desktop.webp',
      alt: 'Hostal Santa Ana on desktop: a poster of the Tenza valley and a booking bar.',
      w: 1200, h: 750, x: 28, y: 44, width: 556, rot: [36.5, 0, 0],
    },
  },
  {
    title: 'Pare o siga',
    summary: 'The game my dad used to teach me how to add.',
    href: 'https://catedra.dejesumensaje.com/demos/pare-o-siga/',
    color: 'var(--project-pare)',
    dark: true,
    phones: [
      { ...shot('/assets/f/pare-o-siga.webp', 'Pare o siga start screen with dice and the game logo.'), x: 92, y: 2, width: 234, screenH: 478, radius: 39, island: true, rot: [-12, 16, 12], depth: 14 },
    ],
  },
  {
    title: 'Sísifo',
    summary: 'Four rules for one rock: a gesture game about Sisyphus for my sensory thinking class.',
    href: 'https://catedra.dejesumensaje.com/demos/sisifo/',
    color: 'var(--project-sisifo)',
    dark: true,
    phones: [],
    browser: {
      src: '/assets/f/sisifo-desktop.webp',
      alt: 'Sísifo on desktop: four rules on the left, a figure pushing a rock up a hill on the right.',
      w: 1200, h: 750, x: 23, y: 35, width: 607, rot: [0, 0, 0],
    },
  },
  {
    title: 'El cruce',
    summary: 'One rainy intersection seen from five points of view. Tap what looks alive.',
    href: 'https://catedra.dejesumensaje.com/demos/cruce/',
    color: 'var(--project-cruce)',
    dark: true,
    phones: [],
    browser: {
      src: '/assets/f/cruce-desktop.webp',
      alt: 'El cruce on desktop: a 3D city intersection at night in the rain.',
      w: 1200, h: 750, x: 21, y: 27, width: 432, rot: [-33, 33, 7.5],
    },
  },
];

export const principles = [
  { n: '01', title: 'I write before I draw.', body: "Writing forces clarity. If I can't explain a decision in a paragraph, the screen isn't ready yet." },
  { n: '02', title: 'System first, surface last.', body: 'I design from the system outward: content models, navigation and flows. Then the pixels.' },
  { n: '03', title: 'AI sharpens the question.', body: 'A thinking partner for synthesis and edge cases, never an answer machine. The decisions stay mine.' },
];

export const clients = [
  'MinTIC', 'Mineducación', 'PNUD', 'Universidad Nacional', 'Universidad de Antioquia',
  'Globant', 'Blackboard', 'Deloitte', 'Taco Bell', 'Pizza Hut',
];

// ---------- Localized view ----------
// Layout data (positions, images, colors) is shared; only words change.
// Spanish strings live in work.es.ts, in the same order as the arrays above.
import type { Lang } from '../i18n/ui';
import { localize } from '../i18n/ui';
import { es } from './work.es';

type CardText = { title: string; summary: string; meta: string; alt?: string; phoneAlt?: string };

function localizeCard(c: CaseCard, tr: CardText | undefined, lang: Lang): CaseCard {
  const out: CaseCard = { ...c, href: c.href ? localize(lang, c.href) : c.href };
  if (!tr) return out;
  out.title = tr.title; out.summary = tr.summary; out.meta = tr.meta;
  if (out.browser && tr.alt) out.browser = { ...out.browser, alt: tr.alt };
  if (out.phone && tr.phoneAlt) out.phone = { ...out.phone, alt: tr.phoneAlt };
  return out;
}

export function getWork(lang: Lang) {
  const L = lang === 'es';
  const f = localizeCard(featured, L ? es.featured : undefined, lang);
  const cs = cases.map((c, i) => localizeCard(c, L ? es.cases[i] : undefined, lang));
  const sp = sideProjects.map((p, i) => {
    const tr = L ? es.sideProjects[i] : undefined;
    if (!tr) return p;
    return {
      ...p,
      summary: tr.summary,
      phones: p.phones.map((ph, j) => ({ ...ph, alt: tr.alts?.[j] ?? ph.alt })),
      browser: p.browser ? { ...p.browser, alt: tr.browserAlt ?? p.browser.alt } : p.browser,
    };
  });
  return {
    featured: f,
    cases: cs,
    sideProjects: sp,
    principles: L ? es.principles : principles,
    caseOrder: [f, ...cs].map((c) => ({ title: c.title, meta: c.meta, href: c.href! })),
  };
}
