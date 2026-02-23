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
  const clean = String(shortToken || '').trim().replace(/\s+/g, '');
  const res = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(META_APP_SECRET)}&access_token=${encodeURIComponent(clean)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error?.message || 'Long-lived token alınamadı');
  return data.access_token;
}

async function getIgUserInfo(accessToken) {
  const clean = String(accessToken || '').trim().replace(/\s+/g, '');
  const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(clean)}`);
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

function formatNum(n) {
  if (n == null || isNaN(n)) return '0';
  const v = Number(n);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(v));
}

function parseInsightValue(d) {
  let v = d?.total_value?.value;
  if (v == null && d?.values?.length) {
    const arr = d.values;
    v = arr[arr.length - 1]?.value ?? arr[0]?.value;
  }
  if (v == null) v = 0;
  return typeof v === 'number' ? v : parseInt(v, 10) || 0;
}

async function fetchAccountStats(accessToken, igUserId) {
  const clean = String(accessToken || '').trim().replace(/\s+/g, '');
  const fields = 'followers_count,media_count';
  const res = await fetch(`https://graph.instagram.com/${igUserId}?fields=${fields}&access_token=${encodeURIComponent(clean)}`);
  const basic = await res.json();
  if (basic.error) throw new Error(basic.error?.message || 'İstatistik alınamadı');

  const followers = basic.followers_count ?? 0;
  const mediaCount = basic.media_count ?? 0;
  let dayInsights = {};
  let weekInsights = {};
  try {
    const dayRes = await fetch(`https://graph.instagram.com/${igUserId}/insights?metric=impressions,reach,profile_views&period=day&access_token=${encodeURIComponent(clean)}`);
    const dayData = await dayRes.json();
    if (dayData.data) dayInsights = Object.fromEntries(dayData.data.map(d => [d.name, parseInsightValue(d)]));
    else if (dayData.error) console.error('[Instagram insights day]', dayData.error?.message || dayData.error);
  } catch (e) {
    console.error('[Instagram insights day]', e.message);
  }
  try {
    const weekRes = await fetch(`https://graph.instagram.com/${igUserId}/insights?metric=impressions,reach,profile_views&period=week&access_token=${encodeURIComponent(clean)}`);
    const weekData = await weekRes.json();
    if (weekData.data) weekInsights = Object.fromEntries(weekData.data.map(d => [d.name, parseInsightValue(d)]));
    else if (weekData.error) console.error('[Instagram insights week]', weekData.error?.message || weekData.error);
  } catch (e) {
    console.error('[Instagram insights week]', e.message);
  }

  const impressions = dayInsights.impressions ?? 0;
  const reach = dayInsights.reach ?? 0;
  const profileViews = dayInsights.profile_views ?? 0;
  const reachWeek = weekInsights.reach ?? 0;
  const impressionsWeek = weekInsights.impressions ?? 0;

  const issues = [];
  if (followers > 0 && reach === 0 && mediaCount > 0) issues.push('reach_sifir');
  if (followers > 100 && impressions < 10 && mediaCount > 0) issues.push('dusuk_goruntulenme');
  if (reach > 0 && impressions > 0 && (reach / impressions) < 0.3) issues.push('dusuk_erisim_orani');
  if (followers > 500 && profileViews === 0) issues.push('profil_goruntulenme_yok');

  const engagementPct = followers > 0 && reach > 0 ? ((reach / followers) * 100).toFixed(1) : null;

  return {
    followers_count: followers,
    media_count: mediaCount,
    impressions,
    reach,
    profile_views: profileViews,
    reach_week: reachWeek,
    impressions_week: impressionsWeek,
    _meta: { fetched_at: new Date().toISOString(), delay_note: 'Meta API: veriler 48 saate kadar gecikmeli olabilir' },
    formatted: {
      followers: formatNum(followers),
      reach: formatNum(reach),
      impressions: formatNum(impressions),
      reach_week: formatNum(reachWeek),
      impressions_week: formatNum(impressionsWeek),
      engagement: engagementPct ? engagementPct + '%' : null
    },
    issues,
    engagement_hint: engagementPct ? engagementPct + '%' : null
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
