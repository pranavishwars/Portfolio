const DEFAULT_DATA = {
  personal: {
    firstName: 'Pranav',
    lastName: 'Ishwar',
    greeting: "Welcome to",
    heroSubtitle: 'A software engineer focused on building scalable backend systems, interactive 3D experiences, and performant web applications.',
    aboutTitle: "About Me",
    aboutParagraphs: [
      "I am a software engineer focused on building clean, performant, and interactive digital experiences. I balance solid architectural design with attention to runtime performance.",
      "My development focus spans across optimized data systems, real-time 3D graphics, and immersive web applications.",
      "Every project is built with modular discipline, clean code practices, and engineered for high performance."
    ],
    stats: [
      { number: '4+', label: 'Years Experience' },
      { number: '25+', label: 'Projects Built' },
      { number: '15+', label: 'Repositories' }
    ],
    email: 'pranav@example.com',
    location: 'United States',
    availability: 'Open for new opportunities',
    social: { github: '#', linkedin: '#', twitter: '#', devto: '#' }
  },
  skills: {
    categories: [
      {
        name: 'Core Technologies',
        icon: '⚙️',
        items: [
          { name: 'JavaScript (ES6+) / WebGL', level: 95 },
          { name: 'Three.js / 3D Graphics', level: 90 },
          { name: 'Node.js / WebSockets', level: 88 }
        ]
      },
      {
        name: 'Engineering',
        icon: '📐',
        items: [
          { name: 'Computational Geometry', level: 85 },
          { name: 'State Management', level: 92 },
          { name: 'Responsive Design', level: 80 }
        ]
      }
    ]
  },
  projects: [
    {
      id: 1,
      title: '3D Viewport Engine',
      category: 'webgl',
      tags: ['Three.js', 'GSAP', 'WebGL'],
      description: 'An interactive 3D viewport engine with room navigation, dynamic lighting, and real-time canvas rendering.',
      liveUrl: '#',
      sourceUrl: '#'
    },
    {
      id: 2,
      title: 'Multiplayer Presence App',
      category: 'networks',
      tags: ['WebSockets', 'Node.js', 'Async'],
      description: 'A real-time collaborative cursor tracking system syncing multiple users across shared web environments over secure websockets.',
      liveUrl: '#',
      sourceUrl: '#'
    }
  ],
  experience: [
    {
      id: 1,
      title: 'Lead Frontend Engineer',
      company: 'Tech Studio',
      date: '2024 — Present',
      description: 'Engineered complex UI systems, implemented custom data visualization components, and optimized rendering for 60fps performance.'
    },
    {
      id: 2,
      title: 'Software Engineer',
      company: 'Web Development Agency',
      date: '2022 — 2024',
      description: 'Built local-first data validation systems, maintained client-side application architecture, and deployed serverless backend solutions.'
    }
  ],
  contact: {
    email: 'pranav@example.com',
    location: 'United States',
    availability: 'Open for collaboration',
    social: { github: '#', linkedin: '#', twitter: '#', devto: '#' }
  }
};

const STORAGE_KEY = 'portfolio_data';

function getData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return deepMerge(clone(DEFAULT_DATA), parsed);
    }
  } catch (e) {
    console.warn('Failed to load data from localStorage, using defaults.');
  }
  return clone(DEFAULT_DATA);
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save data:', e);
    return false;
  }
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  return clone(DEFAULT_DATA);
}

function getDefaultData() {
  return clone(DEFAULT_DATA);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target, source) {
  const result = clone(target);
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) result[key] = clone(source[key]);
      else result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}