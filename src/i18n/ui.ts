// Two languages: English at the root, Spanish under /es/.
// Pages keep the same slug in both (/about.html ↔ /es/about.html);
// the home is / ↔ /es.html (Astro's file format).

export type Lang = 'en' | 'es';

export function getLang(url: URL): Lang {
  const p = url.pathname;
  return p === '/es' || p === '/es.html' || p.startsWith('/es/') ? 'es' : 'en';
}

/** Path of the same page in a language. Accepts '/', '/about.html', '/#work', '/es/about.html'… */
export function localize(lang: Lang, href: string): string {
  if (/^(https?:|mailto:|tel:)/.test(href)) return href;
  const [pathPart, hash = ''] = href.split('#');
  let path = pathPart || '/';
  // strip any existing language prefix
  if (path === '/es.html' || path === '/es' || path === '/es/') path = '/';
  else if (path.startsWith('/es/')) path = path.slice(3);
  const h = hash ? `#${hash}` : '';
  if (lang === 'en') return `${path}${h}`;
  return path === '/' ? `/es.html${h}` : `/es${path}${h}`;
}

/** The current page in the other language (for the switcher and hreflang). */
export function alternate(url: URL, to: Lang): string {
  return localize(to, url.pathname === '/index.html' ? '/' : url.pathname);
}

const ui = {
  en: {
    'skip': 'Skip to main content',
    'nav.work': 'Work',
    'nav.about': 'About',
    'nav.resume': 'Résumé',
    'nav.primary': 'Primary',
    'nav.home': 'William Montoya, home',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.menu': 'Menu',
    'nav.here': 'You are here',
    'nav.available': 'Open to senior and staff roles',
    'nav.switch': 'Español',
    'nav.switchLabel': 'Leer en español',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
    'hola': 'Say <span lang="es">¡Hola!</span>',
    'hola.subject': '¡Hola, William!',

    'footer.contact': 'Contact',
    'footer.title': "Let's connect.",
    'footer.resume': 'Résumé',
    'footer.download': 'Download PDF',
    'footer.writing': 'Writing',
    'footer.game': 'Alborada, a small game I made in PICO-8',
    'footer.silence': 'silence',
    'footer.start': 'start',
    'footer.tap': 'Tap the screen to start',
    'footer.play': 'Play Alborada, a small game. Arrow keys to silence fireworks, X to start, Escape to leave the game.',
    'footer.sound': 'Sound',
    'footer.playing': 'PLAYING · ESC',
    'footer.started': 'Alborada started. Press Escape to leave the game.',
    'footer.left': 'Left the game. Press Enter to keep playing.',
    'footer.frame': 'Alborada, a small game',

    'logos.title': "Teams and clients I've designed with",
    'side.title': 'Side projects',
    'side.intro': 'What I build when nobody asks: small sites and games where I try out interface ideas.',
    'side.prev': 'Previous project',
    'side.next': 'Next project',
    'side.newTab': '(opens in a new tab)',
    'work.title': 'Selected work',
    'work.blurred': 'Client data blurred',

    'depth.label': 'Reading depth',
    'depth.full': 'Full story',
    'depth.tldr': 'TL;DR',
    'next.title': 'Next story',
    'next.label': 'Next case study',

    'cv.pdf': '/assets/cv-william-montoya-2026-en.pdf',
  },
  es: {
    'skip': 'Saltar al contenido',
    'nav.work': 'Trabajo',
    'nav.about': 'Sobre mí',
    'nav.resume': 'Hoja de vida',
    'nav.primary': 'Principal',
    'nav.home': 'William Montoya, inicio',
    'nav.openMenu': 'Abrir menú',
    'nav.closeMenu': 'Cerrar menú',
    'nav.menu': 'Menú',
    'nav.here': 'Estás aquí',
    'nav.available': 'Disponible para roles senior y staff',
    'nav.switch': 'English',
    'nav.switchLabel': 'Read in English',
    'theme.toDark': 'Cambiar a modo oscuro',
    'theme.toLight': 'Cambiar a modo claro',
    'hola': 'Escríbeme',
    'hola.subject': '¡Hola, William!',

    'footer.contact': 'Contacto',
    'footer.title': 'Hablemos.',
    'footer.resume': 'Hoja de vida',
    'footer.download': 'Descargar PDF',
    'footer.writing': 'Escritos',
    'footer.game': 'Alborada, un jueguito que hice en PICO-8',
    'footer.silence': 'silenciar',
    'footer.start': 'empezar',
    'footer.tap': 'Toca la pantalla para empezar',
    'footer.play': 'Jugar Alborada, un jueguito. Flechas para silenciar los fuegos artificiales, X para empezar, Escape para salir del juego.',
    'footer.sound': 'Sonido',
    'footer.playing': 'JUGANDO · ESC',
    'footer.started': 'Alborada empezó. Presiona Escape para salir del juego.',
    'footer.left': 'Saliste del juego. Presiona Enter para seguir jugando.',
    'footer.frame': 'Alborada, un jueguito',

    'logos.title': 'Equipos y clientes con los que he diseñado',
    'side.title': 'Proyectos personales',
    'side.intro': 'Lo que hago por cuenta propia: sitios pequeños y juegos para probar ideas de interfaz.',
    'side.prev': 'Proyecto anterior',
    'side.next': 'Proyecto siguiente',
    'side.newTab': '(se abre en otra pestaña)',
    'work.title': 'Trabajo seleccionado',
    'work.blurred': 'Datos del cliente difuminados',

    'depth.label': 'Profundidad de lectura',
    'depth.full': 'Historia completa',
    'depth.tldr': 'Resumen',
    'next.title': 'Siguiente historia',
    'next.label': 'Siguiente caso de estudio',

    'cv.pdf': '/assets/cv-william-montoya-2026-es.pdf',
  },
} as const;

export type UiKey = keyof typeof ui.en;
export const t = (lang: Lang, key: UiKey): string => ui[lang][key] ?? ui.en[key];
