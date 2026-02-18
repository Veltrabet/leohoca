/**
 * LeoGPT - API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./auth');
const settings = require('./settings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'client', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + (file.originalname || 'img').replace(/[^a-zA-Z0-9.-]/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// --- Auth ---
router.post('/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};
  const result = auth.register(email, password, name);
  if (result.ok) res.json(result);
  else res.status(400).json(result);
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const result = auth.login(email, password);
  if (result.ok) res.json(result);
  else res.status(401).json(result);
});

router.get('/auth/me', auth.requireAuth, (req, res) => {
  if (req.user) res.json({ ok: true, user: req.user });
  else res.status(401).json({ ok: false });
});

// Uygulama şifresi (LEOHOCA_PASSWORD) - /api/auth ve /api/auth/required
router.post('/auth', (req, res) => {
  const pwd = process.env.LEOHOCA_PASSWORD;
  if (!pwd || !pwd.trim()) return res.json({ ok: true });
  const { password } = req.body || {};
  res.json({ ok: password === pwd });
});

router.get('/auth/required', (req, res) => {
  res.json({ required: !!(process.env.LEOHOCA_PASSWORD && process.env.LEOHOCA_PASSWORD.trim()) });
});

// --- Feedback ---
router.post('/feedback', (req, res) => {
  const { rating, messageId, comment } = req.body || {};
  const userId = req.headers.authorization?.startsWith('Bearer ') ? auth.verifyToken(req.headers.authorization.slice(7))?.id : null;
  const sessionId = req.body.sessionId || '';

  if (!rating || (rating !== 1 && rating !== -1)) {
    return res.status(400).json({ ok: false, error: 'Geçersiz rating (1 veya -1)' });
  }

  try {
    db.prepare('INSERT INTO feedback (user_id, session_id, rating, message_id, comment) VALUES (?, ?, ?, ?, ?)')
      .run(userId, sessionId, rating, messageId || null, (comment || '').trim());
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Public config (özellik bayrakları) ---
router.get('/config/public', (req, res) => {
  res.json({
    features: settings.getFeatureFlags(),
    content: settings.getAppContent()
  });
});

// --- Admin (tüm /admin/* auth gerektirir) ---
router.get('/admin/check', auth.requireAuth, (req, res) => {
  if (req.user?.is_admin) res.json({ ok: true, admin: true });
  else res.status(403).json({ ok: false, admin: false });
});

router.get('/admin/users', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, name, is_admin, created_at FROM users ORDER BY id').all();
  res.json({ ok: true, users });
});

router.get('/admin/feedback', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const feedback = db.prepare(`
    SELECT f.*, u.email FROM feedback f
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC LIMIT ?
  `).all(limit);
  const stats = db.prepare('SELECT rating, COUNT(*) as c FROM feedback GROUP BY rating').all();
  res.json({ ok: true, feedback, stats });
});

router.get('/admin/settings', auth.requireAuth, auth.requireAdmin, (req, res) => {
  res.json({ ok: true, settings: settings.getSettings() });
});

router.put('/admin/settings', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const { key, value } = req.body || {};
  if (key) {
    settings.setSetting(key, value);
    res.json({ ok: true });
  } else {
    const updates = req.body.settings || req.body;
    for (const [k, v] of Object.entries(updates)) {
      if (typeof k === 'string') settings.setSetting(k, v);
    }
    res.json({ ok: true });
  }
});

router.get('/admin/content', auth.requireAuth, auth.requireAdmin, (req, res) => {
  res.json({ ok: true, content: settings.getAppContent() });
});

router.post('/admin/content', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const { type, key, value, sortOrder } = req.body || {};
  if (!type || !key) return res.status(400).json({ ok: false, error: 'type ve key gerekli' });
  settings.setAppContent(type, key, value || '', sortOrder || 0);
  res.json({ ok: true });
});

router.delete('/admin/content/:type/:key', auth.requireAuth, auth.requireAdmin, (req, res) => {
  settings.deleteAppContent(req.params.type, req.params.key);
  res.json({ ok: true });
});

router.post('/admin/upload', auth.requireAuth, auth.requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'Dosya yok' });
  const url = '/uploads/' + req.file.filename;
  res.json({ ok: true, url });
});

module.exports = router;
