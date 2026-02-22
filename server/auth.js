/**
 * LeoGPT - Kimlik doğrulama
 */

const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const settings = require('./settings');

const JWT_SECRET = process.env.JWT_SECRET || 'leogpt-secret-change-in-production';
const JWT_EXPIRY = '7d';

function isEmailAllowed(email) {
  const em = (email || '').toLowerCase().trim();
  if (!em) return false;
  const row = db.prepare('SELECT id FROM allowed_emails WHERE LOWER(email) = ?').get(em);
  return !!row;
}

function register(email, password, name) {
  if (!email || !password) return { ok: false, error: 'Email ve şifre gerekli' };
  if (password.length < 6) return { ok: false, error: 'Şifre en az 6 karakter olmalı' };

  const em = email.toLowerCase().trim();
  const flags = settings.getFeatureFlags();
  if (flags.inviteOnly && !isEmailAllowed(em)) {
    return { ok: false, error: 'Bu email izin listesinde değil. Admin\'den davet isteyin.' };
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
      .run(em, hash, (name || '').trim());
    const user = db.prepare('SELECT id, email, name, is_admin FROM users WHERE email = ?')
      .get(email.toLowerCase().trim());
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return { ok: true, token, user: { id: user.id, email: user.email, name: user.name, is_admin: !!user.is_admin } };
  } catch (e) {
    if (e.message.includes('UNIQUE')) return { ok: false, error: 'Bu email zaten kayıtlı' };
    throw e;
  }
}

function login(email, password) {
  if (!email || !password) return { ok: false, error: 'Email ve şifre gerekli' };

  const user = db.prepare('SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());
  if (!user) return { ok: false, error: 'Email veya şifre hatalı' };
  if (!bcrypt.compareSync(password, user.password_hash)) return { ok: false, error: 'Email veya şifre hatalı' };

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  return {
    ok: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, is_admin: !!user.is_admin }
  };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, is_admin FROM users WHERE id = ?').get(decoded.id);
    return user ? { id: user.id, email: user.email, name: user.name, is_admin: !!user.is_admin } : null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : (req.body?.token || req.query?.token);
  const user = token ? verifyToken(token) : null;
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Giriş gerekli' });
  if (!req.user.is_admin) return res.status(403).json({ ok: false, error: 'Yetkisiz' });
  next();
}

module.exports = {
  register,
  login,
  verifyToken,
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
