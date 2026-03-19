const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, is_online FROM users WHERE id != $1 ORDER BY username ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/conversations', async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user.id;

  try {
    const existing = await pool.query(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2`,
      [senderId, recipientId]
    );

    if (existing.rows.length > 0) {
      return res.json({ conversationId: existing.rows[0].id });
    }

    const convo = await pool.query(
      'INSERT INTO conversations DEFAULT VALUES RETURNING id'
    );
    const conversationId = convo.rows[0].id;

    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [conversationId, senderId, recipientId]
    );

    res.status(201).json({ conversationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         c.id,
         u.id AS other_user_id,
         u.username AS other_username,
         u.is_online,
         m.content AS last_message,
         m.created_at AS last_message_at
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != $1
       JOIN users u ON u.id = cp2.user_id
       LEFT JOIN LATERAL (
         SELECT content, created_at FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) m ON true
       ORDER BY m.created_at DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const result = await pool.query(
      `SELECT m.id, m.content, m.created_at, u.id AS sender_id, u.username AS sender_username
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;