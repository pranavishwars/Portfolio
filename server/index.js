const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { connectDB } = require('./db');
const dataRoutes = require('./routes/data');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const hireRoutes = require('./routes/hire');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_ORIGIN
    : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/data', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/hire', hireRoutes);

// Detect client directory: works locally and on Vercel
let clientDir = path.join(__dirname, '..', 'client');
if (!fs.existsSync(clientDir)) {
  clientDir = path.join(process.cwd(), 'client');
}
console.log('[server] clientDir:', clientDir);
console.log('[server] __dirname:', __dirname);
console.log('[server] cwd:', process.cwd());
console.log('[server] clientDir exists:', fs.existsSync(clientDir));

app.use(express.static(clientDir));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(clientDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found at ' + indexPath);
  }
});

connectDB().then(() => {
  const isVercel = !!process.env.VERCEL;
  if (!isVercel) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err.message);
  if (!process.env.VERCEL) process.exit(1);
});

module.exports = app;
