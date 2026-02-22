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
  try {
    const { email, password, name } = req.body || {};
    const result = auth.register(email, password, name);
    if (result.ok) res.json(result);
    else res.status(400).json(result);
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ ok: false, error: e.message || 'Sunucu hatası' });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = auth.login(email, password);
    if (result.ok) res.json(result);
    else res.status(401).json(result);
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ ok: false, error: e.message || 'Sunucu hatası' });
  }
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
  const s = settings.getSettings();
  const content = settings.getAppContent();
  const logoUrl = content.find(c => c.key === 'logo_url')?.value || s.app_logo_url || '';
  res.json({
    features: settings.getFeatureFlags(),
    content,
    logoUrl
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

router.get('/admin/allowed-emails', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, email, created_at FROM allowed_emails ORDER BY email').all();
  res.json({ ok: true, emails: rows });
});

router.post('/admin/allowed-emails', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const { email } = req.body || {};
  const em = (email || '').trim().toLowerCase();
  if (!em || !em.includes('@')) return res.status(400).json({ ok: false, error: 'Geçerli email girin' });
  try {
    db.prepare('INSERT INTO allowed_emails (email) VALUES (?)').run(em);
    res.json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ ok: false, error: 'Bu email zaten listede' });
    throw e;
  }
});

router.delete('/admin/allowed-emails/:id', auth.requireAuth, auth.requireAdmin, (req, res) => {
  db.prepare('DELETE FROM allowed_emails WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
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

// --- Instagram (admin: hesap ekleme, public: stats için API) ---
const ig = require('./instagram');

router.get('/instagram/connect', auth.requireAuth, auth.requireAdmin, (req, res) => {
  if (!ig.isConfigured()) return res.status(503).json({ ok: false, error: 'Instagram API yapılandırılmamış. META_APP_ID, META_APP_SECRET, INSTAGRAM_REDIRECT_URI ekleyin.' });
  const url = ig.getConnectUrl();
  if (!url) return res.status(503).json({ ok: false, error: 'OAuth URL oluşturulamadı' });
  res.json({ ok: true, url });
});

router.get('/instagram/callback', async (req, res) => {
  const { code, state, error, error_reason, error_description, message } = req.query;
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  const adminUrl = `${proto}://${host}/admin.html`;
  console.log('[Instagram callback] query:', JSON.stringify(req.query));
  const errMsg = error || error_reason || error_description || message;
  if (errMsg) return res.redirect(adminUrl + '?ig_error=' + encodeURIComponent(errMsg));
  if (!code) return res.redirect(adminUrl + '?ig_error=code_yok');
  try {
    const data = await ig.exchangeCodeForToken(code);
    const longToken = await ig.getLongLivedToken(data.access_token).catch(() => data.access_token);
    const userInfo = await ig.getIgUserInfo(longToken);
    const tokenToStore = longToken || data.access_token;
    const encrypted = ig.encryptToken(tokenToStore);
    db.prepare('INSERT OR REPLACE INTO instagram_accounts (username, instagram_user_id, access_token, last_sync_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(userInfo.username, userInfo.id, encrypted);
    res.redirect(adminUrl + '?ig_ok=' + encodeURIComponent(userInfo.username));
  } catch (e) {
    console.error('Instagram callback:', e);
    res.redirect(adminUrl + '?ig_error=' + encodeURIComponent(e.message || 'Bilinmeyen hata'));
  }
});

router.get('/admin/instagram/accounts', auth.requireAuth, auth.requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, username, instagram_user_id, created_at, last_sync_at FROM instagram_accounts ORDER BY username').all();
  res.json({ ok: true, accounts: rows });
});

router.delete('/admin/instagram/accounts/:id', auth.requireAuth, auth.requireAdmin, (req, res) => {
  db.prepare('DELETE FROM instagram_accounts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/admin/instagram/add-token', auth.requireAuth, auth.requireAdmin, async (req, res) => {
  const { token: accessToken } = req.body;
  if (!accessToken || typeof accessToken !== 'string') return res.status(400).json({ ok: false, error: 'Token gerekli' });
  const cleanToken = String(accessToken).trim().replace(/\s+/g, '');
  if (!cleanToken || cleanToken.length < 50) return res.status(400).json({ ok: false, error: 'Token çok kısa veya geçersiz' });
  try {
    const longToken = await ig.getLongLivedToken(cleanToken).catch(() => cleanToken);
    const userInfo = await ig.getIgUserInfo(longToken);
    const tokenToStore = longToken || cleanToken;
    const encrypted = ig.encryptToken(tokenToStore);
    db.prepare('INSERT OR REPLACE INTO instagram_accounts (username, instagram_user_id, access_token, last_sync_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(userInfo.username, userInfo.id, encrypted);
    res.json({ ok: true, username: userInfo.username });
  } catch (e) {
    console.error('Instagram add-token:', e);
    res.status(400).json({ ok: false, error: e.message || 'Token geçersiz' });
  }
});

router.get('/instagram/stats/:username', (req, res) => {
  const { username } = req.params;
  const row = db.prepare('SELECT instagram_user_id, access_token FROM instagram_accounts WHERE LOWER(username) = LOWER(?)').get(username);
  if (!row) return res.status(404).json({ ok: false, error: 'Hesap bulunamadı. Admin panelden ekleyin.' });
  const token = ig.decryptToken(row.access_token);
  ig.fetchAccountStats(token, row.instagram_user_id)
    .then(stats => {
      db.prepare('UPDATE instagram_accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE instagram_user_id = ?').run(row.instagram_user_id);
      res.json({ ok: true, username, stats });
    })
    .catch(e => res.status(500).json({ ok: false, error: e.message || 'İstatistik alınamadı' }));
});

router.get('/instagram/configured', (req, res) => {
  res.json({ configured: ig.isConfigured() });
});

router.get('/instagram/debug', (req, res) => {
  const id = process.env.META_APP_ID || '';
  res.json({
    configured: ig.isConfigured(),
    appIdPrefix: id ? id.slice(0, 4) + '...' + id.slice(-4) : null,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI || ''
  });
});

module.exports = router;
