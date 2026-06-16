export interface ProjectSnapshot {
  label: string;
  body: string;
}

export interface Project {
  slug: string;
  index: string;
  tags: string[];
  confidential: boolean;
  context: string;
  title: string;
  href: string;
  description: string;
  image: string;
  imageAlt: string;
  accent: string;
  snapshot: ProjectSnapshot[];
}

export const projects: Project[] = [
  {
    slug: 'key-metrics-over-time',
    index: '01',
    tags: ['UX', 'Data Visualization', 'Enterprise'],
    confidential: true,
    context: 'Deloitte · Converge for Restaurants · KFC',
    title: 'Turning pricing data into a self-service experience',
    href: '/key-metrics-over-time.html',
    description:
      'How to replace a manual Excel reporting process with an interactive feature that puts KFC franchisees in control of their own performance data.',
    image: '/assets/key-metrics-over-time.png',
    imageAlt: 'Key Metrics Over Time dashboard',
    accent: 'var(--steel)',
    snapshot: [
      {
        label: 'Challenge',
        body: 'Replace a slow, manual Excel process with something operators can use themselves, on their own terms.',
      },
      {
        label: 'Contribution',
        body: 'Independent UX/UI design, animation specification, and full-state prototyping with Figma Make.',
      },
      {
        label: 'Status',
        body: 'Launched. Currently collecting user feedback. Approved quickly due to complete prototype coverage.',
      },
    ],
  },
  {
    slug: 'crust-upcharge-configurator',
    index: '02',
    tags: ['UX', 'UI', 'Enterprise'],
    confidential: true,
    context: 'Deloitte · Converge for Restaurants · Pizza Hut',
    title: 'Designing pricing clarity for franchise operators',
    href: '/crust-upcharge-configurator.html',
    description:
      'How to give Pizza Hut franchisees granular control over complex pricing recommendations without eroding their trust in the data.',
    image: '/assets/crust-upcharge-configurator.png',
    imageAlt: 'Crust Upcharge Configurator interface',
    accent: 'var(--blush)',
    snapshot: [
      {
        label: 'Challenge',
        body: 'Make complex pizza pricing recommendations transparent and adjustable without overwhelming the operator.',
      },
      {
        label: 'Contribution',
        body: 'Independent UX/UI design and high-fidelity prototyping using Figma Make and Claude.',
      },
      {
        label: 'Status',
        body: 'Upcoming launch. Interest already confirmed from other franchise brands in the Converge platform.',
      },
    ],
  },
  {
    slug: 'colombia-aprende',
    index: '03',
    tags: ['UX', 'Research', 'Product Design'],
    confidential: false,
    context: 'Ministry of Education · Public Sector · Colombia',
    title: 'Simplifying Colombia Aprende for inclusion and equity',
    href: '/colombia-aprende.html',
    description:
      'How to transform a 17-year-old national platform with millions of users so teachers and students could actually find what they need.',
    image: '/assets/colombia-aprende-imagen.png',
    imageAlt: 'Colombia Aprende platform redesign',
    accent: 'var(--lime)',
    snapshot: [
      {
        label: 'Challenge',
        body: 'Reorganize a sprawling national platform so teachers can find, understand, and use content more easily.',
      },
      {
        label: 'Contribution',
        body: 'User research, information architecture, prototyping, testing, and product coordination.',
      },
      {
        label: 'Scale',
        body: '81,000 resources, 70+ microsites, and a content ecosystem serving millions of users.',
      },
    ],
  },
  {
    slug: 'aprender-digital',
    index: '04',
    tags: ['UX', 'Product Design'],
    confidential: false,
    context: 'Ministry of Education · Rural Education · Colombia',
    title: 'Bringing learning to rural classrooms without internet',
    href: '/aprender-digital.html',
    description:
      "How to enable capabilities in Colombia's rural areas where connectivity is a barrier, not an assumption.",
    image: '/assets/aprender-digital-versoin-ligera.png',
    imageAlt: 'Aprender Digital Versión Ligera interface',
    accent: 'var(--lime)',
    snapshot: [
      {
        label: 'Challenge',
        body: 'Design a product model that still creates value when internet access is not guaranteed.',
      },
      {
        label: 'Contribution',
        body: 'UX, IA, value-proposition work, and prototyping for a fast-moving MVP definition process.',
      },
      {
        label: 'Research inputs',
        body: 'Interviews with 10 teachers and 5 ICT leaders in low-connectivity rural contexts.',
      },
    ],
  },
];
