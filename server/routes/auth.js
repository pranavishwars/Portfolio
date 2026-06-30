const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_TTL = parseInt(process.env.ADMIN_SESSION_TTL) || 7200000;

router.post('/', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (hash !== ADMIN_PASSWORD_HASH) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { role: 'admin', exp: Date.now() + SESSION_TTL },
      JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.json({ success: true, token, expiresIn: SESSION_TTL });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
});

router.all('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, valid: false });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    if (decoded.exp && Date.now() > decoded.exp) {
      return res.status(401).json({ success: false, valid: false, error: 'Token expired' });
    }

    res.json({ success: true, valid: true });
  } catch (err) {
    res.status(401).json({ success: false, valid: false, error: 'Invalid token' });
  }
});

module.exports = router;
