/**
 * LeoGPT - Uygulama ayarları (admin panelinden yönetilir)
 */

const db = require('./db');

const CACHE = {};
const CACHE_TTL = 60000; // 1 dakika
let lastFetch = 0;

function getSettings() {
  if (Date.now() - lastFetch < CACHE_TTL && Object.keys(CACHE).length) return CACHE;
  const rows = db.prepare('SELECT key, value FROM settings').all();
  for (const r of rows) CACHE[r.key] = r.value;
  lastFetch = Date.now();
  return CACHE;
}

function getSetting(key, defaultValue = '') {
  const s = getSettings();
  return s[key] !== undefined ? s[key] : defaultValue;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
    .run(key, String(value));
  CACHE[key] = String(value);
}

function getFeatureFlags() {
  const s = getSettings();
  return {
    voice: s.features_voice !== '0',
    chat: s.features_chat !== '0',
    visual: s.features_visual !== '0',
    tech: s.features_tech !== '0',
    business: s.features_business !== '0',
    requireLogin: s.require_login === '1',
    inviteOnly: s.invite_only !== '0'
  };
}

function getAppContent() {
  return db.prepare('SELECT * FROM app_content ORDER BY sort_order, id').all();
}

function setAppContent(type, key, value, sortOrder = 0) {
  db.prepare(`
    INSERT INTO app_content (type, key, value, sort_order) VALUES (?, ?, ?, ?)
    ON CONFLICT(type, key) DO UPDATE SET value = excluded.value, sort_order = excluded.sort_order
  `).run(type, key, value, sortOrder);
}

function deleteAppContent(type, key) {
  db.prepare('DELETE FROM app_content WHERE type = ? AND key = ?').run(type, key);
}

module.exports = {
  getSettings,
  getSetting,
  setSetting,
  getFeatureFlags,
  getAppContent,
  setAppContent,
  deleteAppContent
};
