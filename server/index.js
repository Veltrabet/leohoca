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

// CORS - për kërkesat nga frontend (domain i ndryshëm)
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
const imagegen = require('./imagegen');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3100;

// Initialize AI
ai.initAI();

app.use(cors);
app.use(express.json());

// API routes (auth, feedback, admin)
const routes = require('./routes');
app.use('/api', routes);

// Shërbej skedarët statikë të klientit (client në një nivel më lart se server)
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

// Logo dhe skedarë statikë (përputhshmëri deploy)
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
    greeting: ai.getGreeting('sq-AL')
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
  const lang = 'sq-AL';
  res.json({ greeting: ai.getGreeting(lang) });
});

// SPA fallback - vetëm për path të panjohur
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

          // Image generation intent (only when text, not when user sends image)
          const hasImageIntent = !image && text && /(krijo|bëj|gjenero).*(imazh|foto|vizatim)|(imazh|foto|vizatim).*(krijo|bëj|gjenero)|create\s+image|generate\s+image|\bdraw\b|resim\s+yap|fotoğraf\s+oluştur|görsel\s+oluştur/i.test(text);
          if (hasImageIntent && imagegen.isConfigured()) {
            try {
              const result = await imagegen.generateImage(text, {});
              if (ws.readyState === 1) {
                ws.send(JSON.stringify({
                  type: 'image_generated',
                  base64: result.base64,
                  mimeType: result.mimeType || 'image/png',
                  prompt: text,
                  caption: 'Ja imazhi i gjeneruar!'
                }));
              }
              break;
            } catch (e) {
              console.error('[Image gen]', e.message);
              // fall through to AI for explanation
            }
          }

          let instagramContext = [];
          const t = (text || '').toLowerCase();
          const hasIgIntent = /\b(istatistik|statistik|statistikat|instagram|meta|business|llogari|si po shkon|përmbledhje|performans|ndjekës|follower|reklamë|gabim|njoftim|reach|arritje|pamje|kontroll|prestigex)\b/i.test(t);
          if (hasIgIntent) {
            const mentions = (t.match(/@([a-zA-Z0-9_.]+)/g) || []).map(m => m.slice(1));
            const accounts = db.prepare('SELECT username, instagram_user_id, access_token FROM instagram_accounts').all();
            const norm = (u) => (u || '').toLowerCase().replace(/_/g, '');
            const usernames = mentions.length
              ? accounts.filter(a => mentions.some(m => norm(a.username) === norm(m) || norm(a.username).startsWith(norm(m)))).map(a => a.username)
              : accounts.map(a => a.username);
            for (const un of usernames.slice(0, 5)) {
              try {
                const row = accounts.find(a => a.username.toLowerCase() === un.toLowerCase()) || db.prepare('SELECT instagram_user_id, access_token FROM instagram_accounts WHERE LOWER(username) = LOWER(?)').get(un);
                if (row) {
                  const token = ig.decryptToken(row.access_token);
                  const stats = await ig.fetchAccountStats(token, row.instagram_user_id);
                  instagramContext.push({ username: un, stats });
                }
              } catch (e) {
                console.error('[Instagram stats]', un, e.message);
              }
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
  console.log(`   Kompjuter: http://localhost:${PORT}`);
  if (ip) {
    console.log(`   Telefon:   http://${ip}:${PORT}`);
    console.log(`   (Telefoni dhe kompjuteri duhet të jenë në të njëjtën WiFi)\n`);
  } else {
    console.log('   Asistenti AI me zë gati për Shqip\n');
  }
});
