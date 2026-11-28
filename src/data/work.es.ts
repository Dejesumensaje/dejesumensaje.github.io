// Spanish text for the home (work.ts). SAME ORDER as the arrays in work.ts.

type CardText = { title: string; summary: string; meta: string; alt?: string; phoneAlt?: string };
type SideText = { summary: string; alts?: string[]; browserAlt?: string };
type Principle = { n: string; title: string; body: string };

const featured: CardText = {
  title: 'Un sistema de diseño para personas y agentes de IA',
  summary: 'De una librería en Figma que los demos con IA ignoraban a un paquete de código con reglas estrictas que cualquier agente puede seguir.',
  meta: 'Deloitte · Sistemas de diseño · 2024–hoy',
  alt: 'Documentación del sistema de diseño: la página de color con muestras de marca, neutros y texto.',
};

const cases: CardText[] = [
  {
    title: 'Prototipar los precios de una tienda con IA',
    summary:
      'Prototipos funcionales, hechos con IA, para probar flujos en días y no en semanas: escritorio para la oficina, celular para los pasillos.',
    meta: 'Deloitte · Supermercados en EE. UU. · En curso',
    alt: 'Prototipo de precios de tienda en escritorio: una tabla de artículos con precio base y de venta, promociones, recomendaciones de la sede central y estado.',
    phoneAlt: 'El mismo prototipo en un celular, editando el precio de un producto en los pasillos.',
  },
  {
    title: 'Llevar el aprendizaje a aulas rurales sin internet',
    summary: 'Un producto para docentes que funciona sin conexión, pensado para escuelas donde el internet no llega.',
    meta: 'Ministerio de Educación · 2019–2021',
    alt: 'Aprender Digital, versión liviana: página de inicio que explica la plataforma sin conexión.',
  },
  {
    title: 'Simplificar Colombia Aprende para la inclusión y la equidad',
    summary: 'Una plataforma nacional de 17 años, reconstruida para que docentes y estudiantes encuentren por fin lo que necesitan.',
    meta: 'Ministerio de Educación · 2019–2021',
    alt: 'La página de inicio rediseñada de Colombia Aprende, con contenidos destacados y noticias.',
  },
];

const sideProjects: SideText[] = [
  {
    summary: 'La tienda de un taller de joyería que cambia de luz entre cinco paletas de color.',
    alts: ['Inicio de Sortícula en su paleta cobalto.', 'Inicio de Sortícula en su paleta cálida.'],
  },
  {
    summary: 'El sitio de un hostal en Tenza, Boyacá: siete habitaciones y planes por el valle.',
    browserAlt: 'Hostal Santa Ana en escritorio: un afiche del valle de Tenza y una barra de reservas.',
  },
  {
    summary: 'Un juego de dados para lanzar con la mano, inspirado en mi papá.',
    alts: ['Pantalla de inicio de Pare o siga, con dados y el logo del juego.'],
  },
  {
    summary: 'Cuatro reglas para una roca: un juego de gestos sobre Sísifo para mi clase de pensamiento sensorial.',
    browserAlt: 'Sísifo en escritorio: cuatro reglas a la izquierda y, a la derecha, una figura que empuja una roca cuesta arriba.',
  },
  {
    summary: 'Un cruce de calles bajo la lluvia, desde cinco puntos de vista. Toca lo que parezca vivo.',
    browserAlt: 'El cruce en escritorio: un cruce de calles en 3D, de noche y bajo la lluvia.',
  },
  {
    summary: 'El oráculo de Alucine lee tus cartas y te recomienda qué ver esta noche.',
    alts: ['El oráculo de Alucine: cartas al estilo del tarot que recomiendan una película.'],
  },
];

const principles: Principle[] = [
  { n: '01', title: 'Escribo antes de dibujar.', body: 'Escribir obliga a pensar con claridad. Si no puedo explicar una decisión en un párrafo, la pantalla todavía no está lista.' },
  { n: '02', title: 'Primero el sistema, al final la superficie.', body: 'Diseño de adentro hacia afuera: modelos de contenido, navegación y flujos. Después vienen los píxeles.' },
  { n: '03', title: 'La IA afina la pregunta.', body: 'La uso para sintetizar información y detectar casos límite, no para que decida por mí. El criterio sigue siendo mío.' },
];

export const es = { featured, cases, sideProjects, principles };
