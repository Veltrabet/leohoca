# LeoGPT — AI Asistent me Zë dhe Bisedë

Asistent AI në kohë reale vetëm në **Shqip (sq-AL)**. LeoGPT ndihmon me zhvillim softueri, planifikim projektesh, ide biznesi dhe **statistika Instagram/Meta**.

**Deploy falas** — Railway/Render me një klik.

## Veçoritë

- **Zë → Tekst**: Mikrofon me Web Speech API
- **Bisedë AI**: Përgjigje në rrjedhë (Groq/Gemini/Ollama)
- **Tekst → Zë**: Zë natyror
- **WebSocket**: Komunikim në kohë reale
- **Ndërprerje**: Foli kurdo — AI ndalon
- **Shqip**: Vetëm gjuha shqipe
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

## Përdorim me Hostinger

Hostinger shared hosting nuk mbështet Node.js. **Zgjidhje:** Frontend në Hostinger, backend në Railway (falas).

### Hapi 1: Deploy backend në Railway

1. Push këtë projekt në GitHub
2. Railway.app → New Project → Deploy from GitHub
3. Variables → shtoni `GROQ_API_KEY`
4. Settings → Generate Domain → merrni URL (p.sh. `https://leohoca.up.railway.app`)

### Hapi 2: Ngarkoni frontend në Hostinger

1. Ngarkoni të gjitha skedarët nga `client` me File Manager ose FTP:
   - index.html, config.js, app.js, styles.css
   - manifest.json, sw.js
   - icons/ (icon-192.png, icon-512.png, icon.svg)

2. Ndryshoni **config.js**:
   ```javascript
   var LEOHOCA_BACKEND = 'https://URL-JUAJ-RAILWAY.up.railway.app';
   ```
   (Vendosni URL nga Railway)

3. Ngarkoni në `public_html` ose drejtorinë kryesore të faqes

### Hapi 3: Cilësim domain

- Nëse domaini është tashmë i konfiguruar (p.sh. leohoca.com), funksionon automatikisht
- Për subdomain (p.sh. ai.faqajua.com), krijoni subdomain në Hostinger dhe ngarkoni atje

### Përmbledhje

| Komponent | Ku | Kosto |
|-----------|-----|-------|
| Frontend (HTML, JS, CSS) | Hostinger | Hosting ekzistues |
| Backend (Node.js, AI) | Railway | Falas |
| AI (Groq) | Groq Cloud | Falas |

---

## Përdorim lokale (Ollama)

### 1. Instaloni Ollama (vetëm për kompjuterin tuaj)

```bash
# Shkarkoni nga https://ollama.com
ollama pull llama3.2
```

### 2. Nisni serverin

```bash
cd server
npm install
npm start
```

### 3. Hapni në shfletues

**http://localhost:3100**

Përdorni **Chrome**.

## Përdorim në telefon

1. Nisni serverin në kompjuter: `cd server && npm start`
2. Telefoni dhe kompjuteri duhet të jenë në të njëjtën WiFi
3. Kur hapni në shfletues, në fund të faqes shfaqet "📱 Telefon: http://..."
4. Shkruani këtë adresë në shfletuesin e telefonit ose klikoni linkun
5. Si PWA "Shto në ekran kryesor" përdoret si aplikacion

## PWA Installation

1. Open the app in Chrome on your phone
2. Tap the browser menu → **Add to Home Screen** or **Install app**
3. LeoHoca will appear on your home screen and run like a native app

## Përdorim

1. **Shtypni mikrofonin** dhe folni
2. LeoHoca transkribon, dërgon te AI dhe lexon përgjigjen
3. **Ndërpritni kurdo**: Shtypni mikrofonin përsëri ose filloni të flisni — AI ndalon

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
