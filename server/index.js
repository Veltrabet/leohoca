/**
 * LeoHoca - Real-time Voice AI Assistant Server
 * Express + WebSocket backend
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// CORS - Hostinger'dan gelen istekler için (frontend farklı domainde)
const cors = (req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
};

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}
const ai = require('./ai');
const { getDetectedLanguage, setPreferredLanguage, getPreferredLanguage } = require('./memory');
const db = require('./db');
const ig = require('./instagram');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize AI
ai.initAI();

app.use(cors);
app.use(express.json());

// API routes (auth, feedback, admin)
const routes = require('./routes');
app.use('/api', routes);

// Serve static client files (client klasörü server'ın bir üst dizininde)
const clientPath = path.join(__dirname, '..', 'client');
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});
app.use(express.static(clientPath));

// Logo ve statik dosyalar (deploy uyumluluğu)
app.get('/logo.png', (req, res) => {
  res.sendFile(path.join(clientPath, 'logo.png'));
});
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(clientPath, 'admin.html'));
});
app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(clientPath, 'auth.html'));
});

// API: Get persona and config
app.get('/api/config', (req, res) => {
  const persona = require('./config/persona.json');
  const voice = require('./config/voice.json');
  let voicePro = null;
  try { voicePro = require('./config/voice_pro.json'); } catch (_) {}
  res.json({
    persona,
    voice,
    voicePro,
    greeting: ai.getGreeting('tr-TR')
  });
});

// API: Network info (for phone access)
app.get('/api/network', (req, res) => {
  const host = req.get('host') || req.get('x-forwarded-host');
  const proto = req.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  const isLocal = !host || host.includes('localhost') || host.startsWith('127.');
  const ip = getLocalIP();
  const phoneUrl = !isLocal && host
    ? `${proto}://${host}`
    : ip ? `http://${ip}:${PORT}` : null;
  res.json({ phoneUrl, port: PORT });
});

// API: Get greeting for language
app.get('/api/greeting/:lang', (req, res) => {
  const lang = req.params.lang === 'sq-AL' ? 'sq-AL' : 'tr-TR';
  res.json({ greeting: ai.getGreeting(lang) });
});

// SPA fallback - sadece tanınmayan path'ler için
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const sessionId = uuidv4();
  ws.sessionId = sessionId;
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      switch (msg.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'chat':
          const text = typeof msg.text === 'string' ? msg.text.trim() : '';
          const image = msg.image;
          const imageMime = msg.imageMime || 'image/jpeg';
          if (!text && !image) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
            return;
          }

          ws.send(JSON.stringify({ type: 'ai_start' }));

          let instagramContext = [];
          const t = (text || '').toLowerCase();
          const hasIgIntent = /\b(istatistik|istatistikler|instagram|hesap|nasıl gidiyor|özet|performans|takipçi|follower)\b/i.test(t);
          if (hasIgIntent) {
            const mentions = (t.match(/@([a-zA-Z0-9_.]+)/g) || []).map(m => m.slice(1));
            const accounts = db.prepare('SELECT username, instagram_user_id, access_token FROM instagram_accounts').all();
            const usernames = mentions.length ? mentions.filter(u => accounts.some(a => a.username.toLowerCase() === u.toLowerCase())) : accounts.map(a => a.username);
            for (const un of usernames.slice(0, 5)) {
              try {
                const row = accounts.find(a => a.username.toLowerCase() === un.toLowerCase()) || db.prepare('SELECT instagram_user_id, access_token FROM instagram_accounts WHERE LOWER(username) = LOWER(?)').get(un);
                if (row) {
                  const token = ig.decryptToken(row.access_token);
                  const stats = await ig.fetchAccountStats(token, row.instagram_user_id);
                  instagramContext.push({ username: un, stats });
                }
              } catch (_) {}
            }
          }

          await ai.streamChat(
            sessionId,
            text || (image ? 'Çfarë shihni në këtë imazh?' : ''),
            image ? { base64: image, mimeType: imageMime } : null,
            (chunk) => {
              if (ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'ai_chunk', content: chunk }));
              }
            },
            (fullResponse) => {
              if (ws.readyState === 1) {
                ws.send(JSON.stringify({ 
                  type: 'ai_complete', 
                  content: fullResponse,
                  language: getDetectedLanguage(sessionId)
                }));
              }
            },
            instagramContext
          );
          break;

        case 'interrupt':
          ws.send(JSON.stringify({ type: 'interrupt_ack' }));
          break;

        case 'set_language':
          break;

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (err) {
      console.error('WebSocket error:', err);
      ws.send(JSON.stringify({ type: 'error', message: err.message || 'Server error' }));
    }
  });

  ws.on('close', () => {
    ws.isAlive = false;
  });

  ws.send(JSON.stringify({ type: 'connected', sessionId }));
  ws.send(JSON.stringify({ type: 'greeting', greeting: ai.getGreeting() }));
});

// Keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n🦁 LeoHoca server running`);
  console.log(`   Bilgisayar: http://localhost:${PORT}`);
  if (ip) {
    console.log(`   Telefon:   http://${ip}:${PORT}`);
    console.log(`   (Telefon ve bilgisayar aynı WiFi'de olmalı)\n`);
  } else {
    console.log('   Voice AI assistant ready for Turkish & Albanian\n');
  }
});
