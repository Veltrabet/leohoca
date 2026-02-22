# LeoGPT — AI Asistent me Zë dhe Bisedë

Asistent AI në kohë reale që mbështet **Shqip (sq-AL)** dhe **Türkçe (tr-TR)**. LeoGPT ndihmon me zhvillim softueri, planifikim projektesh, ide biznesi dhe **statistika Instagram/Meta**.

**Deploy falas** — Railway/Render me një klik.

## Veçoritë

- **Zë → Tekst**: Mikrofon me Web Speech API
- **Bisedë AI**: Përgjigje në rrjedhë (Groq/Gemini/Ollama)
- **Tekst → Zë**: Zë natyror
- **WebSocket**: Komunikim në kohë reale
- **Ndërprerje**: Foli kurdo — AI ndalon
- **Shqip + Türkçe**: Gjuha parazgjedhur Shqip; Türkçe vetëm kur përdoruesi kërkon
- **Instagram/Meta**: Statistika nga Meta Business, njoftim gabimesh reklamash
- **PWA**: Instalo në telefon si aplikacion

## Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: HTML, JavaScript, Bootstrap 5 (admin)
- **AI**: Groq (falas) | Gemini (falas) | Ollama (lokale)

## Projektet

```
├── server/
│   ├── config/           # persona, voice
│   ├── index.js          # Express + WebSocket
│   ├── ai.js             # Groq/Gemini/Ollama
│   ├── instagram.js      # Meta/Instagram API
│   ├── .env.example      # Shembull variablash
│   └── .env              # Variabla (mos e ngarkoni në GitHub!)
├── client/
│   ├── index.html
│   ├── admin.html        # Paneli admin (Bootstrap 5)
│   └── app.js
├── railway.json
├── .gitignore            # .env, server/.env
└── README.md
```

## Deploy në Railway

1. **https://railway.app** → Hyr me GitHub
2. **New Project** → **Deploy from GitHub** → Zgjidh repon
3. **Variables** (obligator):
   - `GROQ_API_KEY` — https://console.groq.com (falas)
   - `ADMIN_EMAIL` — admin@example.com
   - `ADMIN_PASSWORD` — fjalëkalim i fortë
4. **Variables** (për Instagram):
   - `META_APP_ID` — Meta for Developers → Settings → Basic
   - `META_APP_SECRET` — i njëjti vend
   - `INSTAGRAM_REDIRECT_URI` — https://DOMAIN-RAILWAY/api/instagram/callback
5. **Settings** → **Generate Domain** → Merr URL
6. Në Meta, shto këtë URL në Valid OAuth Redirect URIs

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

**http://localhost:3100**

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
