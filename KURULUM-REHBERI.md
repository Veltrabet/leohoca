# LeoGPT - Kurulum Rehberi

Kayıt, giriş, geri bildirim ve admin paneli dahil tam kurulum.

---

## ⚡ En Kritik — 3 Adımda Çalıştır

| # | Ne yap | Nerede |
|---|--------|---------|
| 1 | **GROQ_API_KEY** ekle | https://console.groq.com → API Keys |
| 2 | `server/.env` oluştur → `GROQ_API_KEY=gsk_xxx` yaz | Yerel |
| 3 | `npm start` → http://localhost:3000 | Terminal |

**Railway için:** Variables'a `GROQ_API_KEY` ekle → push → deploy otomatik.

> AI çalışmazsa = API key yok veya yanlış. Bu tek zorunlu değişken.

---

## 1. Yerel Bilgisayarda Kurulum

### Adım 1: Bağımlılıkları yükle

```bash
cd "/Users/Apple/Desktop/yapay zeka"
npm install
```

### Adım 2: Ortam değişkenlerini ayarla

`server/.env` dosyasını açın (yoksa oluşturun) ve ekleyin:

```
# Zorunlu - AI için
GROQ_API_KEY=gsk_xxx

# Admin paneli için (ilk kurulumda admin hesabı oluşturur)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=guvenli_sifre_123

# JWT için (production'da mutlaka değiştirin)
JWT_SECRET=rastgele_uzun_anahtar_buraya

# Opsiyonel - uygulama şifresi
# LEOHOCA_PASSWORD=app_sifresi
```

### Adım 3: Sunucuyu başlat

```bash
npm start
```

Tarayıcıda **http://localhost:3000** açın.

### Adım 4: Admin paneline giriş

1. **http://localhost:3000/admin.html** adresine gidin
2. `ADMIN_EMAIL` ve `ADMIN_PASSWORD` ile giriş yapın
3. Admin paneli açılır

---

## 📋 Admin Panele Giriş (Adım Adım)

### 1. Admin URL'leri
| Ortam | URL |
|-------|-----|
| Yerel | http://localhost:3000/admin.html |
| Railway | https://leohoca-production.up.railway.app/admin.html |

### 2. Giriş bilgileri
Admin paneline girmek için `.env` veya Railway Variables'ta tanımlı olan:
- **Email:** `ADMIN_EMAIL` değeri (örn: admin@example.com)
- **Şifre:** `ADMIN_PASSWORD` değeri

### 3. İlk kurulumda
`ADMIN_EMAIL` ve `ADMIN_PASSWORD` ilk sunucu başlatıldığında otomatik admin hesabı oluşturur. Bu email ve şifre ile giriş yapın.

### 4. Giriş adımları
1. Admin URL'yi tarayıcıda açın
2. Email kutusuna `ADMIN_EMAIL` yazın
3. Şifre kutusuna `ADMIN_PASSWORD` yazın
4. **Giriş** butonuna tıklayın

### 5. Admin panelde neler var?
- Geri bildirim istatistikleri (👍👎)
- Özellik açma/kapama
- Logo yükleme
- **Instagram hesapları** — Hesap Bağla ile Instagram ekleyin
- Kullanıcı listesi

---

## 2. Railway'de Kurulum (Canlı Yayın)

### Adım 1: GitHub'a push

```bash
cd "/Users/Apple/Desktop/yapay zeka"
git add -A
git commit -m "Kayıt, giriş, geri bildirim, admin paneli"
git push
```

### Adım 2: Railway Variables ekle

1. **https://railway.app/dashboard** → Projenize girin
2. **Variables** sekmesi → **+ New Variable**
3. Şu değişkenleri ekleyin:

| Name | Value | Açıklama |
|------|-------|----------|
| `GROQ_API_KEY` | gsk_xxx | Groq API anahtarı (https://console.groq.com) |
| `ADMIN_EMAIL` | admin@email.com | Admin giriş emaili |
| `ADMIN_PASSWORD` | guvenli_sifre | Admin şifresi |
| `JWT_SECRET` | rastgele_uzun_anahtar | En az 32 karakter |

**Opsiyonel:**
| Name | Value |
|------|-------|
| `LEOHOCA_PASSWORD` | Uygulama şifresi (boş bırakırsanız şifre istenmez) |
| `META_APP_ID` | Instagram API (Meta for Developers) |
| `META_APP_SECRET` | Instagram API |
| `INSTAGRAM_REDIRECT_URI` | https://siteniz.com/api/instagram/callback |

### Adım 3: Deploy

Railway otomatik deploy eder. 1-2 dakika bekleyin.

### Adım 4: Veritabanı (Railway)

Railway'de SQLite dosyası **kalıcı değildir** – her deploy'da sıfırlanır. Kalıcı veri için:

**Seçenek A:** Railway Volume (önerilen)
1. Railway projesi → **+ New** → **Volume**
2. Volume'u servisinize bağlayın
3. Variables'a ekleyin: `DATABASE_PATH=/data/leogpt.db`

**Seçenek B:** Veri sıfırlanır – sadece test için uygun

---

## 3. Kullanım

### Kullanıcılar
- **Ana sayfa:** Sohbet (giriş zorunlu değil)
- **auth.html:** Kayıt / Giriş
- Her AI yanıtında 👍 Beğendim / 👎 Beğenmedim

### Admin
- **admin.html:** Admin paneline giriş
- Geri bildirim istatistikleri
- Özellik açma/kapama
- Resim yükleme, içerik ekleme
- Kullanıcı listesi

---

## 4. Sorun Giderme

### "Admin hesabı oluşturuldu" mesajı gelmiyor
- `ADMIN_EMAIL` ve `ADMIN_PASSWORD` doğru yazıldığından emin olun
- Sunucuyu yeniden başlatın

### Giriş yapamıyorum
- Email ve şifreyi kontrol edin
- Admin paneli için `is_admin=1` olan hesap gerekir (ADMIN_EMAIL ile oluşturulan ilk hesap otomatik admin)

### Veritabanı hatası
- `server/data/` klasörü otomatik oluşturulur
- Yazma izni olduğundan emin olun

### Railway'de çalışmıyor
- Tüm Variables eklendi mi kontrol edin
- Logs sekmesinden hata mesajlarına bakın

---

## 5. Son Kontrol Listesi (Deploy Öncesi)

| Kontrol | Durum |
|---------|-------|
| `client/logo.png` mevcut | ✓ |
| `server/.env` → GROQ_API_KEY veya GEMINI_API_KEY | ✓ |
| Kayıt/giriş iptal — doğrudan sohbet | ✓ |
| Arnavutça varsayılan dil (SQ) | ✓ |
| Beyaz tema, profesyonel tasarım | ✓ |
| © Leohoca telif — footer ve meta | ✓ |
| Sesli komut (Chrome önerilir) | ✓ |
| Resim yükleme (GEMINI_API_KEY gerekli) | ✓ |
| PWA manifest — app olarak yükleme | ✓ |
| protect.js — sağ tık, F12 engeli | ✓ |

### Deploy sonrası
- Logo görünüyor mu? → `/logo.png` route tanımlı
- HTTPS ile çalışıyor mu? → Railway otomatik SSL
