/**
 * LeoGPT - SQLite veritabanı
 */

const Database = require('better-sqlite3');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'leogpt.db');
require('fs').mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    rating INTEGER NOT NULL,
    message_id TEXT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, key)
  );

  CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
  CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
`);

function initAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) return;

  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)')
    .run(adminEmail, hash, 'Admin');
  console.log('Admin hesabı oluşturuldu:', adminEmail);
}

function initDefaultSettings() {
  const defaults = {
    features_voice: '1',
    features_chat: '1',
    features_visual: '1',
    features_tech: '1',
    features_business: '1',
    require_login: '0',
    app_logo_url: '',
    app_banner_url: '',
    app_extra_html: ''
  };
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaults)) {
    stmt.run(k, v);
  }
}

initDefaultSettings();
initAdmin();

module.exports = db;
