# LeoHoca - Hostinger Kurulum Rehberi

Hostinger paylaşımlı hosting'de Node.js çalışmaz. Bu yüzden **hibrit** yapı kullanıyoruz:
- **Hostinger** → Sadece statik dosyalar (HTML, CSS, JS)
- **Railway** → Backend (ücretsiz)

## Hızlı Kurulum

### 1. Railway'de Backend (5 dk)

1. https://railway.app → GitHub ile giriş
2. **New Project** → **Deploy from GitHub repo**
3. Bu projeyi seçin (önce GitHub'a push edin)
4. **Variables** sekmesi → `GROQ_API_KEY` = (https://console.groq.com'dan alın)
5. **Settings** → **Networking** → **Generate Domain**
6. URL'yi kopyalayın (örn: `https://leohoca-production.up.railway.app`)

### 2. config.js Oluşturun

`client/config.js` dosyasını açın ve şunu yazın:

```javascript
var LEOHOCA_BACKEND = 'https://SIZIN-RAILWAY-URL.up.railway.app';
```

Railway'den aldığınız URL'yi yapıştırın. `https://` ile başlamalı.

### 3. Hostinger'a Yükleyin

**File Manager** veya **FTP** ile `client` klasöründeki dosyaları yükleyin:

```
public_html/  (veya sitenizin kök dizini)
├── index.html
├── config.js      ← Düzenlediğiniz dosya
├── app.js
├── styles.css
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon.svg
```

### 4. Test Edin

Sitenize gidin (örn: `https://siteniz.com` veya `https://leohoca.siteniz.com`). Mikrofon butonuna basıp konuşun.

## Sorun Giderme

**"Bağlanıyor..." kalıyorsa:**
- config.js'deki URL doğru mu? `https://` ile başlamalı
- Railway deploy başarılı mı? Dashboard'da kontrol edin
- Tarayıcı konsolunda (F12) hata var mı?

**Ses çalışmıyorsa:**
- Chrome kullanın (Safari'de bazı özellikler kısıtlı)
- Mikrofon izni verin
- HTTPS gerekli (Hostinger genelde SSL sunar)

## Maliyet

| Servis | Ücret |
|--------|-------|
| Hostinger | Mevcut hosting planınız |
| Railway | Ücretsiz (aylık limit var) |
| Groq API | Ücretsiz |
