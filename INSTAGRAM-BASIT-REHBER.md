# Instagram Hesap Bağlama — Hızlı Rehber

Admin panelden Instagram hesaplarınızı bağlayın, sohbette "istatistiklerim", "@hesap_adi nasıl gidiyor" gibi sorularla anlık analiz alın.

---

## 1. Meta for Developers'da Uygulama Oluştur

1. **https://developers.facebook.com** → Giriş yap
2. **My Apps** → **Create App** → **Other** veya **Business** seç
3. Uygulama adı: `LeoGPT` (veya istediğiniz) → **Create**

---

## 2. Instagram API Ekle

1. Sol menü: **Add Products** veya **Products**
2. **Instagram** veya **Instagram Graph API** bul → **Set Up**
3. **Instagram API with Instagram Login** seçin (yeni API)

---

## 3. OAuth Ayarları

1. Sol menü: **Instagram** → **Basic Display** veya **Settings**
2. **Valid OAuth Redirect URIs** bölümüne ekleyin:
   - Yerel: `http://localhost:3100/api/instagram/callback`
   - Canlı: `https://leohoca.up.railway.app/api/instagram/callback` (kendi domain'iniz)

---

## 4. App ID ve Secret Al

1. **Settings** → **Basic**
2. **App ID** → kopyala → `META_APP_ID`
3. **App Secret** → Show → kopyala → `META_APP_SECRET`

---

## 5. .env Dosyasına Ekle

```env
META_APP_ID=xxx
META_APP_SECRET=xxx
INSTAGRAM_REDIRECT_URI=https://leohoca.up.railway.app/api/instagram/callback
```

**Önemli:** `INSTAGRAM_REDIRECT_URI` tam olarak Meta'da yazdığınız URL ile aynı olmalı.

---

## 6. Instagram Hesabı

- Bağlanacak hesap **Instagram Business** veya **Creator** olmalı
- Kişisel hesap → **Ayarlar** → **Hesap** → **Profesyonel hesaba geç**

---

## 7. Admin Panelden Bağla

1. **http://localhost:3100/admin.html** (veya canlı URL)
2. Giriş yap (admin@example.com / admin123)
3. **Instagram Hesapları** bölümünde **+ Hesap Bağla**
4. Meta sayfasında yetkilendir
5. Geri dönünce hesap listede görünür

---

## 8. Sohbette Kullan

- "İstatistiklerim nasıl?"
- "@kullanici_adi nasıl gidiyor?"
- "Takipçi sayım ne?"
- "Instagram hesaplarımın özeti"

AI, bağlı hesapların verilerini çekip analiz eder. **Token/şifre asla sohbette gösterilmez.**
