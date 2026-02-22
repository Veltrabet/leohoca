# Instagram Hesaplarını Nasıl Eklersin?

Admin panelden Instagram hesaplarını bağla. Meta Business üzerinden tüm istatistikler alınır, sohbette soran kişiye cevap verilir. Reklam hatası varsa bildirim + öneri sunulur. **Ödeme bilgisi asla verilmez.**

---

## Adım 1: Meta for Developers

1. **https://developers.facebook.com** → Giriş yap
2. **My Apps** → **Create App** → **Business** seç
3. Uygulama adı: `LeoGPT` → **Create**

---

## Adım 2: Instagram API Ekle

1. Sol menü: **Add Products**
2. **Instagram** veya **Instagram Graph API** → **Set Up**
3. **Instagram API with Instagram Login** seç

---

## Adım 3: Redirect URI

1. **Instagram** → **Basic Display** veya **Settings**
2. **Valid OAuth Redirect URIs** ekle:
   - Yerel: `http://localhost:3100/api/instagram/callback`
   - Canlı: `https://leohoca.up.railway.app/api/instagram/callback`

---

## Adım 4: .env Dosyası

`server/.env` dosyasına ekle:

```
META_APP_ID=xxx
META_APP_SECRET=xxx
INSTAGRAM_REDIRECT_URI=https://leohoca.up.railway.app/api/instagram/callback
```

**App ID** ve **App Secret**: Meta → Settings → Basic

---

## Adım 5: Admin Panelden Bağla

1. **http://localhost:3100/admin.html** (veya canlı URL)
2. Giriş yap
3. **Instagram Hesapları** → **+ Hesap Bağla**
4. Meta sayfasında yetkilendir
5. Geri dön → Hesap listede

---

## Adım 6: Sohbette Sor

- "İstatistiklerim nasıl?"
- "@hesap_adi nasıl gidiyor?"
- "Reach düşük mü?"
- "Reklam hatası var mı?"
- "Takipçi sayım ne?"

AI, Meta'dan alınan verilere göre cevap verir. Sorun varsa (düşük reach, düşük engagement) **bildirir** ve **öneri** sunar. Ödeme bilgisi **asla** verilmez.
