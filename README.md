# LeoHoca - Real-time Voice AI Assistant

A full-stack real-time voice AI assistant that supports **Turkish (tr-TR)** and **Albanian (sq-AL)**. LeoHoca helps with software development, project planning, and business ideas—like a close, intelligent friend.

**Herkes erişebilir** – Railway/Render ile ücretsiz buluta deploy edin.

## Features

- **Speech-to-Text**: Microphone input with Web Speech API
- **AI Chat**: Streaming responses via OpenAI
- **Text-to-Speech**: Natural voice output
- **Real-time**: WebSocket-based instant communication
- **Interruption**: Speak anytime—AI stops when you talk
- **Bilingual**: Auto-detects Turkish vs Albanian
- **Session Memory**: Remembers conversation context
- **PWA**: Install on phone and use like a native app

## Tech Stack

- **Backend**: Node.js, Express, WebSocket (ws)
- **Frontend**: HTML, Vanilla JavaScript, CSS
- **AI**: Ollama (ücretsiz, sınırsız) veya OpenAI (opsiyonel)
- **Voice**: Browser Web Speech API (STT + TTS)

## Project Structure

```
├── server/
│   ├── config/
│   │   ├── persona.json    # AI personality & system prompt
│   │   └── voice.json      # Voice/language config
│   ├── index.js            # Express + WebSocket server
│   ├── ai.js               # OpenAI integration
│   ├── memory.js           # Session-based memory
│   └── package.json
├── client/
│   ├── index.html
│   ├── app.js              # STT, TTS, WebSocket client
│   ├── styles.css
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/
├── scripts/
│   └── generate-icons.js   # PWA icon generator
├── README.md
└── .env.example
```

## Herkese Açık Deploy (Ücretsiz)

### Railway ile (Önerilen)

1. **https://railway.app** – GitHub ile giriş
2. **New Project** → **Deploy from GitHub** → Repo seçin
3. **Variables** → `GROQ_API_KEY` ekleyin (https://console.groq.com – ücretsiz key)
4. Deploy tamamlanınca **Settings** → **Generate Domain** ile URL alın
5. Herkes bu URL ile erişebilir

### Render ile

1. **https://render.com** – GitHub ile giriş
2. **New** → **Web Service** → Repo seçin
3. Build: `cd server && npm install`
4. Start: `cd server && npm start`
5. **Environment** → `GROQ_API_KEY` ekleyin
6. Deploy

### Groq API Key (Ücretsiz)

- https://console.groq.com
- Sign up → API Keys → Create
- Kredi kartı gerekmez

---

## Hostinger ile Kullanım

Hostinger paylaşımlı hosting Node.js desteklemez. **Çözüm:** Frontend Hostinger'da, backend Railway'de (ücretsiz).

### Adım 1: Backend'i Railway'e deploy edin

1. Bu projeyi GitHub'a push edin
2. Railway.app → New Project → Deploy from GitHub
3. Variables → `GROQ_API_KEY` ekleyin
4. Settings → Generate Domain → URL alın (örn: `https://leohoca.up.railway.app`)

### Adım 2: Frontend'i Hostinger'a yükleyin

1. `client` klasöründeki tüm dosyaları Hostinger File Manager veya FTP ile yükleyin:
   - index.html, config.js, app.js, styles.css
   - manifest.json, sw.js
   - icons/ klasörü (icon-192.png, icon-512.png, icon.svg)

2. **config.js** dosyasını düzenleyin:
   ```javascript
   var LEOHOCA_BACKEND = 'https://SIZIN-RAILWAY-URL.up.railway.app';
   ```
   (Railway'den aldığınız URL'yi yazın)

3. `public_html` veya sitenizin ana dizinine yükleyin

### Adım 3: Domain ayarı

- Hostinger'da domain'iniz zaten ayarlıysa (örn: leohoca.com), dosyalar yüklendiğinde otomatik çalışır
- Subdomain kullanmak isterseniz (örn: ai.siteniz.com), Hostinger'da subdomain oluşturup dosyaları o klasöre yükleyin

### Özet

| Bileşen | Nerede | Maliyet |
|---------|--------|---------|
| Frontend (HTML, JS, CSS) | Hostinger | Mevcut hosting |
| Backend (Node.js, AI) | Railway | Ücretsiz |
| AI (Groq) | Groq Cloud | Ücretsiz |

---

## Yerel Kullanım (Ollama)

### 1. Ollama kur (sadece kendi bilgisayarınız için)

```bash
# https://ollama.com indir, kur
ollama pull llama3.2
```

### 2. Server başlat

```bash
cd server
npm install
npm start
```

### 3. Tarayıcıda aç

**http://localhost:3000** (veya 3001)

**Chrome** kullanın.

## Telefonda Kullanım

1. Bilgisayarda server'ı çalıştırın: `cd server && npm start`
2. Telefon ve bilgisayar **aynı WiFi** ağında olmalı
3. Bilgisayarda tarayıcıda açtığınızda sayfanın altında "📱 Telefon: http://..." linki görünür
4. Bu adresi telefonun tarayıcısına yazın veya linke tıklayın
5. PWA olarak "Ana ekrana ekle" ile uygulama gibi kullanabilirsiniz

## PWA Installation

1. Open the app in Chrome on your phone
2. Tap the browser menu → **Add to Home Screen** or **Install app**
3. LeoHoca will appear on your home screen and run like a native app

## Usage

1. **Select language**: Tap TR (Turkish) or SQ (Albanian)
2. **Tap the microphone** button and speak
3. LeoHoca will transcribe, send to AI, and speak the response
4. **Interrupt anytime**: Tap mic again or start speaking—AI stops

## Safety

LeoHoca refuses illegal, harmful, hacking, fraud, violence, or dangerous instructions. If asked for illegal content, it politely declines and suggests legal alternatives.

## Configuration

### Persona (`server/config/persona.json`)

- Edit `systemPrompt` to change LeoHoca's personality
- Customize greetings for each language

### Voice (`server/config/voice.json`)

- Adjust speech rate, pitch, and language settings

## License

MIT
