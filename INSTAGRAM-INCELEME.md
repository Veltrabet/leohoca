# Instagram Entegrasyonu — Teknik İnceleme ve Onay

**Tarih:** 2026-02-23  
**Proje:** LeoGPT / leohoca.up.railway.app

---

## 1. Kod İncelemesi

### 1.1 `server/instagram.js`

| Öğe | Değer | Durum |
|-----|-------|-------|
| OAuth URL | `https://www.instagram.com/oauth/authorize` | ✅ Meta Business Login dokümanına uygun |
| Scope | `instagram_business_basic,instagram_business_manage_insights` | ✅ Insights için gerekli |
| Token exchange | `POST https://api.instagram.com/oauth/access_token` | ✅ Doğru endpoint |
| Long-lived token | `GET https://graph.instagram.com/access_token` | ✅ Doğru endpoint |
| Token response | `raw.data?.[0] \|\| raw` | ✅ Yeni API formatı destekleniyor |

### 1.2 `server/routes.js`

| Öğe | Durum |
|-----|-------|
| Callback: `error`, `error_reason`, `error_description` yakalanıyor | ✅ |
| Callback: `code_yok` durumu | ✅ |
| Callback: Loglama `[Instagram callback] query:` | ✅ Debug için |
| adminUrl: `x-forwarded-proto`, `x-forwarded-host` | ✅ Railway proxy uyumlu |

### 1.3 Ortam Değişkenleri (.env / Railway)

| Değişken | Açıklama |
|----------|----------|
| `META_APP_ID` | **Instagram App ID** (Business login settings'ten) |
| `META_APP_SECRET` | **Instagram App Secret** (Business login settings'ten) |
| `INSTAGRAM_REDIRECT_URI` | `https://leohoca.up.railway.app/api/instagram/callback` |

---

## 2. "Invalid platform app" — Kök Neden

Bu hata **Meta tarafında** oluşur; kod tarafında değil. Olası nedenler:

1. **Yanlış App ID/Secret:** Settings → Basic yerine **Instagram → API setup with Instagram login → Business login settings** kullanılmalı
2. **Yanlış ürün:** "API setup with Instagram login" eklenmeli (Basic Display veya Facebook Login değil)
3. **Redirect URI uyuşmazlığı:** Meta'daki URI ile `.env` birebir aynı olmalı

---

## 3. Meta Developer Console Kontrol Listesi

- [ ] Uygulama tipi: **Business**
- [ ] Ürün: **Instagram** → **API setup with Instagram login**
- [ ] Business login settings → **Instagram App ID** ve **Instagram App Secret** kopyalandı
- [ ] OAuth redirect URIs:
  - `https://leohoca.up.railway.app/api/instagram/callback`
  - `https://leohoca.up.railway.app/api/instagram/callback/` (opsiyonel)
- [ ] Instagram hesabı: **Business** veya **Creator**

---

## 4. Akış Özeti

```
Admin Panel → + Lidh llogari Instagram
    ↓
GET /api/instagram/connect → OAuth URL döner
    ↓
Yönlendirme: https://www.instagram.com/oauth/authorize?client_id=...&redirect_uri=...
    ↓
Kullanıcı "İzin ver" tıklar
    ↓
Instagram → https://leohoca.up.railway.app/api/instagram/callback?code=...
    ↓
Code → Token exchange → Long-lived token → DB'ye kayıt → admin.html?ig_ok=...
```

---

## 5. Onay

Bu inceleme tamamlandı. Kod tarafı doğru yapılandırılmıştır. "Invalid platform app" hatası için **Meta Developer Console** ayarlarını kontrol edin.

**Referans:** [Meta Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
