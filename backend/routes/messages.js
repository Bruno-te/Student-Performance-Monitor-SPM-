const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDB } = require('../config/database');

// @route   GET /api/messages
// @desc    Get all messages for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = getDB();
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE sender_id = ? OR recipient_id = ?
      ORDER BY createdAt DESC
    `).all(req.user.id, req.user.id);

    // Populate sender and recipient
    const messagesWithData = messages.map(msg => {
      const sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.sender_id);
      const recipient = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.recipient_id);
      return {
        ...msg,
        sender,
        recipient
      };
    });

    res.json({ success: true, count: messagesWithData.length, data: messagesWithData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/messages/inbox
// @desc    Get inbox messages
// @access  Private
router.get('/inbox', protect, async (req, res) => {
  try {
    const db = getDB();
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE recipient_id = ?
      ORDER BY createdAt DESC
    `).all(req.user.id);

    const messagesWithData = messages.map(msg => {
      const sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.sender_id);
      return {
        ...msg,
        sender
      };
    });

    res.json({ success: true, count: messagesWithData.length, data: messagesWithData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/messages/sent
// @desc    Get sent messages
// @access  Private
router.get('/sent', protect, async (req, res) => {
  try {
    const db = getDB();
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE sender_id = ?
      ORDER BY createdAt DESC
    `).all(req.user.id);

    const messagesWithData = messages.map(msg => {
      const recipient = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(msg.recipient_id);
      return {
        ...msg,
        recipient
      };
    });

    res.json({ success: true, count: messagesWithData.length, data: messagesWithData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/messages/:id
// @desc    Get single message
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const db = getDB();
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check authorization
    if (message.sender_id !== req.user.id && message.recipient_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.sender_id);
    const recipient = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.recipient_id);

    // Mark as read if recipient
    if (message.recipient_id === req.user.id && !message.isRead) {
      db.prepare('UPDATE messages SET isRead = 1, readAt = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
      message.isRead = 1;
      message.readAt = new Date().toISOString();
    }

    res.json({
      success: true,
      data: {
        ...message,
        sender,
        recipient
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages
// @desc    Create new message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const db = getDB();
    const { recipient, subject, content } = req.body;

    const result = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, subject, content)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, recipient, subject, content);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    const sender = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.sender_id);
    const recipientData = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(message.recipient_id);

    res.status(201).json({
      success: true,
      data: {
        ...message,
        sender,
        recipient: recipientData
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const db = getDB();
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipient_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    db.prepare('UPDATE messages SET isRead = 1, readAt = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
    message.isRead = 1;
    message.readAt = new Date().toISOString();

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
