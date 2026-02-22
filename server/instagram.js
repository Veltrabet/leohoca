/**
 * LeoGPT - Instagram Graph API entegrasyonu
 * Meta for Developers: https://developers.facebook.com
 */

const crypto = require('crypto');

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || '';

function isConfigured() {
  return !!(META_APP_ID && META_APP_SECRET && INSTAGRAM_REDIRECT_URI);
}

function getConnectUrl() {
  if (!isConfigured()) return null;
  const scope = 'instagram_business_basic,instagram_manage_insights';
  return `https://api.instagram.com/oauth/authorize?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=${scope}&response_type=code`;
}

async function exchangeCodeForToken(code) {
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_message || data.error || 'Token alınamadı');
  return data;
}

async function getLongLivedToken(shortToken) {
  const res = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${META_APP_SECRET}&access_token=${shortToken}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error?.message || 'Long-lived token alınamadı');
  return data.access_token;
}

async function getIgUserInfo(accessToken) {
  const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error?.message || 'Kullanıcı bilgisi alınamadı');
  return data;
}

function encryptToken(token) {
  const key = process.env.JWT_SECRET || 'leogpt-ig-key';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(key, 'salt', 32), iv);
  let enc = cipher.update(token, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + enc;
}

function decryptToken(encrypted) {
  if (!encrypted || !encrypted.includes(':')) return encrypted;
  const key = process.env.JWT_SECRET || 'leogpt-ig-key';
  const [ivHex, enc] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(key, 'salt', 32), iv);
  return decipher.update(enc, 'hex', 'utf8') + decipher.final('utf8');
}

async function fetchAccountStats(accessToken, igUserId) {
  const fields = 'followers_count,media_count';
  const res = await fetch(`https://graph.instagram.com/${igUserId}?fields=${fields}&access_token=${accessToken}`);
  const basic = await res.json();
  if (basic.error) throw new Error(basic.error?.message || 'İstatistik alınamadı');

  let insights = {};
  try {
    const period = 'day';
    const metrics = 'impressions,reach,profile_views';
    const ir = await fetch(`https://graph.instagram.com/${igUserId}/insights?metric=${metrics}&period=${period}&access_token=${accessToken}`);
    const idata = await ir.json();
    if (idata.data) insights = Object.fromEntries(idata.data.map(d => [d.name, d.values?.[0]?.value ?? 0]));
  } catch (_) {}

  return {
    followers_count: basic.followers_count ?? 0,
    media_count: basic.media_count ?? 0,
    ...insights
  };
}

module.exports = {
  isConfigured,
  getConnectUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  getIgUserInfo,
  encryptToken,
  decryptToken,
  fetchAccountStats
};
