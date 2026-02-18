# LeoHoca - zzerss.com Hostinger Kurulumu

## Adım 1: Railway'de Backend (tek seferlik)

1. Bu projeyi GitHub'a push edin
2. https://railway.app → New Project → Deploy from GitHub
3. Repo seçin → Deploy
4. **Variables** → `GROQ_API_KEY` ekleyin (https://console.groq.com)
5. **Settings** → **Networking** → **Generate Domain**
6. URL'yi kopyalayın (örn: `https://leohoca-production-xxx.up.railway.app`)

## Adım 2: Hostinger'a Yükleme

1. Hostinger **File Manager** veya **FTP** ile giriş yapın
2. `public_html` klasörüne (zzerss.com ana dizini) şu dosyaları yükleyin:

```
public_html/
├── index.html
├── config.js
├── app.js
├── styles.css
├── manifest.json
├── sw.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── icon.svg
```

**client** klasörünün içindeki tüm dosyaları `public_html` köküne yükleyin.

## Adım 3: İlk Açılış

1. https://zzerss.com adresine gidin
2. Kurulum ekranı açılacak
3. Railway'den kopyaladığınız URL'yi yapıştırın
4. **Kaydet ve Başlat** tıklayın
5. LeoHoca kullanıma hazır

Bu ayar tarayıcıda saklanır, tekrar girmeniz gerekmez.
