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
  const scope = 'instagram_business_basic,instagram_business_manage_insights';
  return `https://www.instagram.com/oauth/authorize?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=${scope}&response_type=code`;
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
  const raw = await res.json();
  if (raw.error) throw new Error(raw.error_message || raw.error?.message || raw.error || 'Token alınamadı');
  const data = raw.data?.[0] || raw;
  if (!data.access_token) throw new Error('access_token nuk u kthye nga Meta');
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

  const followers = basic.followers_count ?? 0;
  const mediaCount = basic.media_count ?? 0;
  const impressions = insights.impressions ?? 0;
  const reach = insights.reach ?? 0;
  const profileViews = insights.profile_views ?? 0;

  const issues = [];
  if (followers > 0 && reach === 0 && mediaCount > 0) issues.push('reach_sifir');
  if (followers > 100 && impressions < 10 && mediaCount > 0) issues.push('dusuk_goruntulenme');
  if (reach > 0 && impressions > 0 && (reach / impressions) < 0.3) issues.push('dusuk_erisim_orani');
  if (followers > 500 && profileViews === 0) issues.push('profil_goruntulenme_yok');

  return {
    followers_count: followers,
    media_count: mediaCount,
    impressions,
    reach,
    profile_views: profileViews,
    ...insights,
    issues,
    engagement_hint: followers > 0 && reach > 0 ? ((reach / followers) * 100).toFixed(1) + '%' : null
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
