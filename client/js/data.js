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
    education: [
      { degree: 'B.Tech, Computer Science', school: 'VIT', date: '2021 — 2025' }
    ],
    hobbies: ['Photography', 'Chess', 'Hiking', 'Gaming'],
    email: 'pranav@example.com',
    location: 'United States',
    availability: 'Open for new opportunities',
    social: { github: '#', linkedin: '#', twitter: '#', devto: '#' }
  },
  skills: {
    categories: [
      {
        name: 'Core Technologies',
        icon: '<i class="fa-solid fa-gear"></i>',
        items: [
          { name: 'JavaScript (ES6+) / WebGL', stars: 5 },
          { name: 'Three.js / 3D Graphics', stars: 5 },
          { name: 'Node.js / WebSockets', stars: 4 }
        ]
      },
      {
        name: 'Engineering',
        icon: '<i class="fa-solid fa-ruler-combined"></i>',
        items: [
          { name: 'Computational Geometry', stars: 4 },
          { name: 'State Management', stars: 5 },
          { name: 'Responsive Design', stars: 4 }
        ]
      }
    ]
  },
  services: [
    { id: 1, name: 'Web Development', description: 'Full-stack web apps built with modern frameworks, from prototype to production.', hourlyRate: 45 },
    { id: 2, name: '3D / WebGL Experiences', description: 'Interactive 3D websites and visualizations using Three.js and WebGL.', hourlyRate: 60 },
    { id: 3, name: 'Backend & APIs', description: 'Scalable backend systems, REST/WebSocket APIs, and database design.', hourlyRate: 50 }
  ],
  projects: [
    {
      id: 1,
      title: '3D Viewport Engine',
      subtitle: 'Interactive 3D Portfolio Engine',
      category: 'webgl',
      tags: ['Three.js', 'GSAP', 'WebGL'],
      year: '2026',
      stack: 'THREE.JS',
      type: 'FULL STACK',
      featured: true,
      image: 'assets/project_1.jpg',
      description: 'An interactive 3D viewport engine with room navigation, dynamic lighting, and real-time canvas rendering.',
      liveUrl: '#',
      sourceUrl: '#'
    },
    {
      id: 2,
      title: 'Multiplayer Presence App',
      subtitle: 'Real-Time Cursor Sync',
      category: 'networks',
      tags: ['WebSockets', 'Node.js', 'Async'],
      year: '2026',
      stack: 'NODE.JS',
      type: 'FULL STACK',
      featured: false,
      image: 'assets/project_2.jpg',
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
const API_BASE = '/api';

let cachedData = null;
let dataPromise = null;

function getData() {
  if (cachedData) {
    console.log('[data] getData returning cached');
    return cachedData;
  }

  if (!dataPromise) {
    console.log('[data] getData: starting fetch to ' + API_BASE + '/data');
    dataPromise = fetch(API_BASE + '/data', {
      headers: {
        'Authorization': 'Bearer ' + (getAdminToken() || '')
      }
    })
      .then(res => {
        console.log('[data] fetch response status:', res.status);
        if (!res.ok) throw new Error('API unavailable (status ' + res.status + ')');
        return res.json();
      })
      .then(json => {
        console.log('[data] fetch response json success:', json.success, 'has data:', !!json.data);
        if (json.success && json.data) {
          cachedData = deepMerge(clone(DEFAULT_DATA), json.data);
          console.log('[data] cachedData set from API, keys:', Object.keys(cachedData));
          return cachedData;
        }
        throw new Error('Invalid response');
      })
      .catch(err => {
        console.log('[data] getData fetch failed:', err.message);
        cachedData = getLocalFallback();
        console.log('[data] fallback data keys:', Object.keys(cachedData));
        return cachedData;
      });
  }

  console.log('[data] getData returning local fallback');
  return getLocalFallback();
}

function getLocalFallback() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return deepMerge(clone(DEFAULT_DATA), parsed);
    }
  } catch (e) {}
  return clone(DEFAULT_DATA);
}

function getAdminToken() {
  return sessionStorage.getItem('portfolio_admin_token');
}

function saveData(data) {
  cachedData = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}

  const token = getAdminToken();
  if (!token) return false;

  fetch(API_BASE + '/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ data })
  }).catch(function () {});

  return true;
}

function resetData() {
  cachedData = null;
  dataPromise = null;
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
    if (Array.isArray(source[key])) {
      result[key] = clone(source[key]);
    } else if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) result[key] = clone(source[key]);
      else result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

window.__portfolioDataCache = { getData: getData, saveData: saveData, resetData: resetData, getDefaultData: getDefaultData };
