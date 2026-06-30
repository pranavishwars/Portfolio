const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, service, description } = req.body;
    if (!name || !email || !description) {
      return res.status(400).json({ success: false, error: 'Name, email, and description are required' });
    }
    await db.addHireInquiry(name.trim(), email.trim(), (phone || '').trim(), (service || '').trim(), description.trim());
    res.json({ success: true, message: 'Inquiry submitted successfully' });
  } catch (err) {
    console.error('Hire form error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit inquiry' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const inquiries = await db.getHireInquiries();
    res.json({ success: true, data: inquiries });
  } catch (err) {
    console.error('Get hire inquiries error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve inquiries' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.markHireInquiryRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

module.exports = router;
