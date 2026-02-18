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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

// API: Get persona and config
app.get('/api/config', (req, res) => {
  const persona = require('./config/persona.json');
  const voice = require('./config/voice.json');
  res.json({
    persona,
    voice,
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

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
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
          if (!msg.text || typeof msg.text !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
            return;
          }

          ws.send(JSON.stringify({ type: 'ai_start' }));

          await ai.streamChat(
            sessionId,
            msg.text.trim(),
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
            }
          );
          break;

        case 'interrupt':
          ws.send(JSON.stringify({ type: 'interrupt_ack' }));
          break;

        case 'set_language': {
          const lang = (msg.lang === 'sq-AL' || msg.lang === 'tr-TR') ? msg.lang : 'sq-AL';
          setPreferredLanguage(sessionId, lang);
          ws.send(JSON.stringify({ type: 'language_set', lang }));
          ws.send(JSON.stringify({ type: 'greeting', greeting: ai.getGreeting(lang) }));
          break;
        }

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
