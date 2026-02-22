# Instagram API Entegrasyonu — Yol Haritası

Sosyal medya uzmanı için: Admin panelden hesap ekleme, sohbet üzerinden anlık istatistik + çözüm yol haritası.

---

## 🔒 Güvenlik (Kesin Kurallar)

| Kural | Açıklama |
|-------|----------|
| **Şifre/token sohbette YOK** | Hiçbir zaman kullanıcıya token, şifre, API key gösterilmez |
| **Sadece Admin panel** | Hesap bağlama sadece admin.html üzerinden |
| **OAuth ile bağlan** | Kullanıcı Meta'da yetkilendirir, token sunucuda saklanır |
| **Şifreli saklama** | Token'lar DB'de şifreli (JWT/encrypt) |

---

## 📐 Mimari

```
[Admin Panel] → OAuth → [Meta/Instagram] → access_token
                              ↓
[DB: instagram_accounts] ← token, username, account_id
                              ↓
[Kullanıcı Sohbet] "örnek_hesap istatistikleri" 
                              ↓
[Backend] → token ile Instagram API çağrısı → veri
                              ↓
[AI] → istatistik + sorun tespiti + çözüm yol haritası
```

---

## 1. Admin Panel — Hesap Ekleme

### Akış
1. Admin → "Instagram Hesabı Ekle" butonu
2. Meta OAuth sayfasına yönlendirme
3. Kullanıcı yetkilendirir (instagram_business_basic, instagram_manage_insights)
4. Callback → token alınır → DB'ye kaydedilir
5. Hesap listesi: @kullanici_adi, son güncelleme, durum

### Gerekli
- Meta for Developers uygulaması
- Instagram Graph API etkin
- Redirect URI: `https://leohoca.../api/instagram/callback`

---

## 2. Veritabanı

```sql
-- instagram_accounts tablosu
id, admin_id, username, instagram_user_id, access_token_encrypted, 
refresh_token, expires_at, created_at, last_sync_at
```

Token'lar asla düz metin saklanmaz.

---

## 3. Instagram API — Alınacak Veriler

| Metrik | Endpoint | Açıklama |
|--------|----------|----------|
| Takipçi sayısı | `/{ig-user-id}?fields=followers_count` | Anlık |
| Görüntülenme | `/{ig-user-id}/insights` | impressions, reach |
| Etkileşim | insights | likes, comments, saves |
| Profil görüntüleme | insights | profile_views |
| Yeni takipçi | insights | follower_count (değişim) |

**"Hatalar" / Sorunlar:** Instagram doğrudan hata logu vermez. AI şunları yorumlar:
- Düşen reach → "İçerik algoritmasına uymuyor olabilir"
- Düşen engagement → "Posting saatleri veya içerik tipi"
- Takipçi kaybı → "Spam/robot temizliği veya içerik uyumsuzluğu"

---

## 4. Sohbet Entegrasyonu

### Kullanıcı örnekleri
- "örnek_hesap istatistiklerini göster"
- "@kullanici_adi nasıl gidiyor?"
- "Bağlı hesaplarımın özeti"

### Backend akışı
1. Kullanıcı mesajında @username veya "hesap adı" tespit
2. DB'den token al (admin yetkisi veya hesap sahibi)
3. Instagram API çağrısı
4. Veriyi AI'a context olarak ver
5. AI: istatistik + sorun analizi + çözüm yol haritası

### AI prompt eklentisi
```
Kullanıcı Instagram istatistiği istediğinde:
- Verilen verileri özetle
- Düşük metrikleri "sorun" olarak işaretle
- Her sorun için 3-5 maddelik çözüm yol haritası ver
- Asla token, şifre, API bilgisi yazma
```

---

## 5. Uygulama Adımları

| Sıra | Görev | Zorluk |
|------|-------|--------|
| 1 | Meta for Developers'da uygulama oluştur | Kolay |
| 2 | Instagram Graph API ekle, OAuth ayarla | Orta |
| 3 | DB: instagram_accounts tablosu | Kolay |
| 4 | API route: /api/instagram/connect, callback | Orta |
| 5 | Admin panel: "Hesap Ekle" UI | Orta |
| 6 | API route: /api/instagram/stats/:username | Orta |
| 7 | AI: özel soru tespiti + Instagram verisi context | Orta |
| 8 | Persona: Instagram uzmanı yetenekleri | Kolay |

---

## 6. Ortam Değişkenleri

```
META_APP_ID=xxx
META_APP_SECRET=xxx
INSTAGRAM_REDIRECT_URI=https://leohoca.up.railway.app/api/instagram/callback
```

---

## 7. Meta App Kurulumu (Adım Adım)

### Adım 1: Meta for Developers'a giriş
1. **https://developers.facebook.com** adresine gidin
2. Facebook hesabınızla giriş yapın
3. Sağ üstten **"My Apps"** → **"Create App"**

### Adım 2: Uygulama türü
1. **"Other"** veya **"Business"** seçin
2. **"Next"** → Uygulama adı: `LeoGPT` (veya istediğiniz)
3. **"Create App"** tıklayın

### Adım 3: Instagram ürününü ekleyin
1. Sol menüden **"Add Products"** veya **"Products"** → **"Set Up"**
2. **"Instagram"** veya **"Instagram Graph API"** bulun
3. **"Set Up"** tıklayın
4. **"Instagram Basic Display"** (eski) yerine **"Instagram Graph API"** veya **"Instagram API with Instagram Login"** seçin

### Adım 4: OAuth ayarları
1. Sol menü: **Instagram** → **"Basic Display"** veya **"Settings"**
2. **"Valid OAuth Redirect URIs"** bölümüne ekleyin:
   ```
   https://leohoca.up.railway.app/api/instagram/callback
   ```
   (Kendi domain'inizi yazın — Railway URL'niz veya localhost için `http://localhost:3100/api/instagram/callback`)
3. **"Save Changes"**

### Adım 5: App ID ve Secret alın
1. Sol menü: **"Settings"** → **"Basic"**
2. **App ID** → kopyalayın → `.env` dosyasına `META_APP_ID=xxx`
3. **App Secret** → **"Show"** tıklayın → kopyalayın → `META_APP_SECRET=xxx`

### Adım 6: Uygulamayı canlıya alın (Production)
1. Sol üstte **"Development"** / **"Live"** modu var
2. Canlı kullanım için **"Switch to Live"** veya **"App Review"** gerekebilir
3. **Instagram Basic Display** için genelde **App Review** gerekmez (test modunda çalışır)
4. Test modunda sadece **uygulama geliştiricileri** ve **test kullanıcıları** bağlanabilir

### Adım 7: Instagram hesabı gereksinimi
- Bağlanacak hesap **Instagram Business** veya **Creator** olmalı
- Kişisel hesap → **Ayarlar** → **Hesap** → **Profesyonel hesaba geç** ile değiştirilebilir

### Adım 8: .env dosyası
```env
META_APP_ID=1234567890123456
META_APP_SECRET=abcdef1234567890abcdef1234567890
INSTAGRAM_REDIRECT_URI=https://leohoca.up.railway.app/api/instagram/callback
```

**Kısa özet:** Meta for Developers → Create App → Instagram ekle → Redirect URI ekle → App ID + Secret al → .env'e yaz

---

## 8. Özet

- **Admin:** OAuth ile hesap ekler, token güvenle saklanır
- **Sohbet:** "X hesabı istatistikleri" → anlık veri + analiz + çözüm
- **Güvenlik:** Şifre/token sohbette asla yok
