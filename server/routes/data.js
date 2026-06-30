const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const data = await db.getPortfolioData();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Get data error:', err.message);
    // Return DEFAULT_DATA if DB unavailable so the site still works
    res.json({ success: true, data: db.DEFAULT_DATA });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }
    await db.savePortfolioData(data);
    res.json({ success: true, message: 'Portfolio data saved successfully' });
  } catch (err) {
    console.error('Save data error:', err);
    res.status(500).json({ success: false, error: 'Failed to save portfolio data' });
  }
});

module.exports = router;
