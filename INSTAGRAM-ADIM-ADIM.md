# Instagram Hesap Bağlama — Adım Adım (Invalid platform app hatası çözümü)

"Invalid platform app" hatası alıyorsanız, Meta uygulaması yanlış yapılandırılmıştır. Aşağıdaki adımları **sırayla** takip edin.

---

## Adım 1: Yeni Meta Uygulaması Oluştur

1. **https://developers.facebook.com/apps** → Giriş yap
2. **Create App** tıkla
3. **Use case:** "Other" seç → Next
4. **App type:** "Business" seç → Next
5. **App name:** LeoGPT (veya istediğiniz)
6. **Contact email:** Kendi emailiniz
7. **Create app** tıkla

---

## Adım 2: Instagram Ürününü Ekle

1. Sol menüde **Instagram** bulun (veya "Add products")
2. **Instagram** → **Set up** tıkla
3. **"API setup with Instagram login"** seçin (Facebook Login DEĞİL!)
4. Bu adım otomatik olarak Instagram Business Login ekler

---

## Adım 3: Instagram Hesabı Ekle (Test için)

1. Sol menü: **Instagram** → **API setup with Instagram login**
2. **2. Generate access tokens** bölümünde **Add account** tıklayın
3. Instagram hesabınızla giriş yapın
4. Hesabı **Instagram Tester** olarak atayın (Development modunda sadece tester hesaplar yetkilendirebilir)
5. Hesap **Business** veya **Creator** olmalı (kişisel hesap → Ayarlar → Profesyonel hesaba geç)

---

## Adım 4: Business Login Ayarları (ÖNEMLİ — code_yok önlemek için)

1. Sol menü: **Instagram** → **API setup with Instagram login**
2. **4. Set up Instagram business login** bölümünü açın (genişletin)
3. **OAuth redirect URIs** kısmına ekleyin:
   ```
   https://leohoca.up.railway.app/api/instagram/callback
   ```
   (Kendi domain'inizi yazın — Railway URL'niz)
4. **Save** tıklayın — Bu adım yapılmazsa "code_yok" hatası alırsınız!

---

## Adım 5: App ID ve Secret Al

1. **Business login settings** penceresinde (veya aynı sayfada):
   - **Instagram App ID** — kopyalayın
   - **Instagram App Secret** — Show → kopyalayın

2. **ÖNEMLİ:** Settings → Basic'teki App ID ile karıştırmayın. Instagram için **Instagram App ID** kullanın. (Bazı uygulamalarda aynı olabilir.)

---

## Adım 6: Railway / .env Değişkenleri

Railway Variables veya `server/.env`:

```
META_APP_ID=Instagram_App_ID_buraya
META_APP_SECRET=Instagram_App_Secret_buraya
INSTAGRAM_REDIRECT_URI=https://leohoca.up.railway.app/api/instagram/callback
```

**Redirect URI** Meta'da yazdığınız ile **birebir aynı** olmalı (https, slash, domain).

---

## Adım 7: Admin Panelden Bağla

1. https://leohoca.up.railway.app/admin.html
2. Giriş yap
3. **Instagram Hesapları** → **+ Lidh llogari Instagram**
4. Instagram sayfasında yetkilendir
5. Geri dön → Hesap listede görünmeli

---

## "code_yok" hatası alıyorsanız

Bu hata, Instagram sizi callback URL'ye yönlendirdiğinde `code` parametresinin gelmediğini gösterir.

**Kontrol edin:**
1. **Yetkilendirmeyi tamamladınız mı?** Instagram sayfasında "İzin ver" / "Allow" butonuna tıkladınız mı? İptal ederseniz `code` gelmez.
2. **Redirect URI eşleşmesi:** Meta'daki OAuth Redirect URI ile `.env`'deki `INSTAGRAM_REDIRECT_URI` **birebir aynı** olmalı (sonunda `/` olup olmaması dahil).
3. **Railway logları:** Deploy sonrası tekrar deneyin; Railway → Deployments → View Logs. `[Instagram callback] query:` satırında Instagram'ın gönderdiği parametreleri göreceksiniz.

**Meta'da deneyin:** Redirect URI'yi hem sondaki slash **ile** hem **olmadan** ekleyin:
- `https://leohoca.up.railway.app/api/instagram/callback`
- `https://leohoca.up.railway.app/api/instagram/callback/`

---

## "Invalid platform app" hatası — En sık nedenler

Bu hata genelde **yanlış App ID** kullanıldığında oluşur:

### 1. Doğru App ID ve Secret kullanın
- **Settings → Basic** içindeki "App ID" ve "App Secret" **kullanmayın**
- **Instagram → API setup with Instagram login → Business login settings** bölümündeki **Instagram App ID** ve **Instagram App Secret** kullanın
- [Meta dokümanı](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/) bu bilgilerin buradan alınması gerektiğini belirtiyor

### 2. Doğru Instagram ürünü
- **"API setup with Instagram login"** eklenmiş olmalı (Instagram Basic Display veya Facebook Login değil)
- Sol menü: **Instagram** → **API setup with Instagram login**

### 3. OAuth URL
- Kodda `https://www.instagram.com/oauth/authorize` kullanılıyor (Meta Business Login dokümanına göre)

### 4. Diğer kontroller
- Uygulama tipi **Business** olmalı
- **OAuth redirect URI** Meta’da ve `.env`’de birebir aynı olmalı

---

## Instagram Hesabı Gereksinimi

- **Business** veya **Creator** hesap olmalı
- Kişisel hesap → Instagram uygulaması → Ayarlar → Hesap → Profesyonel hesaba geç

---

## Teknik İnceleme

Detaylı kod ve akış incelemesi için: **INSTAGRAM-INCELEME.md**
