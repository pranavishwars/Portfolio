const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const portfolioSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const hireSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  service: { type: String, default: '' },
  description: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
const HireInquiry = mongoose.model('HireInquiry', hireSchema);
const ContactMessage = mongoose.model('ContactMessage', contactSchema);

const DEFAULT_DATA = {
  personal: {
    firstName: 'Pranav',
    lastName: 'Ishwar',
    greeting: 'Welcome to',
    heroSubtitle: 'A software engineer focused on building scalable backend systems, interactive 3D experiences, and performant web applications.',
    aboutTitle: 'About Me',
    aboutParagraphs: [
      'I am a software engineer focused on building clean, performant, and interactive digital experiences. I balance solid architectural design with attention to runtime performance.',
      'My development focus spans across optimized data systems, real-time 3D graphics, and immersive web applications.',
      'Every project is built with modular discipline, clean code practices, and engineered for high performance.'
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
        icon: '⚙️',
        items: [
          { name: 'JavaScript (ES6+) / WebGL', stars: 5 },
          { name: 'Three.js / 3D Graphics', stars: 5 },
          { name: 'Node.js / WebSockets', stars: 4 }
        ]
      },
      {
        name: 'Engineering',
        icon: '📐',
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

let _dbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env file');
  }
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });
  const count = await Portfolio.countDocuments({ key: 'main' });
  if (count === 0) {
    await Portfolio.create({ key: 'main', data: DEFAULT_DATA });
  }
}

async function ensureDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!_dbPromise) {
    _dbPromise = connectDB().catch(function (err) {
      _dbPromise = null;
      throw err;
    });
  }
  await _dbPromise;
}

async function getPortfolioData() {
  await ensureDB();
  const doc = await Portfolio.findOne({ key: 'main' });
  return doc ? doc.data : DEFAULT_DATA;
}

async function savePortfolioData(data) {
  await ensureDB();
  await Portfolio.updateOne(
    { key: 'main' },
    { $set: { data } },
    { upsert: true }
  );
}

async function addContactMessage(name, email, message) {
  await ensureDB();
  await ContactMessage.create({ name, email, message });
}

async function getContactMessages() {
  await ensureDB();
  return ContactMessage.find().sort({ createdAt: -1 }).lean();
}

async function addHireInquiry(name, email, phone, service, description) {
  await ensureDB();
  await HireInquiry.create({ name, email, phone, service, description });
}

async function getHireInquiries() {
  await ensureDB();
  return HireInquiry.find().sort({ createdAt: -1 }).lean();
}

async function markHireInquiryRead(id) {
  await ensureDB();
  await HireInquiry.findByIdAndUpdate(id, { read: true });
}

module.exports = { connectDB, getPortfolioData, savePortfolioData, addContactMessage, getContactMessages, addHireInquiry, getHireInquiries, markHireInquiryRead };
