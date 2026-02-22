# Instagram Hataları — Çözüm Adımları

## "Yetersiz Geliştirici Görevi" (Insufficient Developer Role)

Bu hata, yetkilendirme sırasında Instagram hesabınızın uygulamada yetkili olmadığını gösterir.

### Çözüm

1. **Meta App Roles kontrolü**
   - https://developers.facebook.com/apps/1254273963501504/roles/
   - Kendinizin **Administrator** veya **Developer** olduğundan emin olun
   - Değilseniz, uygulama sahibi sizi bu rollerden biriyle eklemeli

2. **Instagram hesabını Tester olarak ekleyin**
   - Meta → Instagram → API setup with Instagram login
   - **2. Generate access tokens** → **Add account**
   - Instagram hesabınızla giriş yapın
   - Hesabı **Instagram Tester** olarak atayın
   - Bu adımda da aynı hatayı alırsanız: Önce **Roles** sayfasında kendinizi Admin/Developer yapın

3. **Instagram–Meta hesap bağlantısı**
   - Instagram hesabınızın aynı Meta (Facebook) hesabına bağlı olduğundan emin olun
   - Instagram → Ayarlar → Hesap → Paylaşılan hesap yönetimi

---

## "code_yok" Hatası

"code_yok" alıyorsanız, Meta tarafında **2 şey** eksik olabilir:

---

## 1. OAuth Redirect URI Ekle (En sık neden)

1. **https://developers.facebook.com/apps** → LeoGPT uygulamanızı açın
2. Sol menü: **Instagram** → **API setup with Instagram login**
3. **4. Set up Instagram business login** bölümünü **genişletin** (tıklayın)
4. **OAuth redirect URIs** alanına şunu ekleyin:
   ```
   https://leohoca.up.railway.app/api/instagram/callback
   ```
5. **Save** tıklayın

---

## 2. Instagram Hesabını Tester Olarak Ekle

Development modunda sadece **Instagram Tester** hesaplar yetkilendirebilir.

1. Aynı sayfada **2. Generate access tokens** bölümünü genişletin
2. **Add account** tıklayın
3. Instagram hesabınızla giriş yapın
4. Hesabı **Instagram Tester** olarak atayın

---

## 3. Railway Variables Kontrolü

Railway → Projeniz → **Variables**:

| Değişken | Değer |
|----------|-------|
| `META_APP_ID` | `1242959117925253` |
| `META_APP_SECRET` | (Business login settings'ten) |
| `INSTAGRAM_REDIRECT_URI` | `https://leohoca.up.railway.app/api/instagram/callback` |

---

## 4. Yetkilendirme

Instagram sayfasında **"İzin ver" / "Allow"** butonuna tıklayın. İptal ederseniz `code` gelmez.

---

## Debug

Railway deploy sonrası: **https://leohoca.up.railway.app/api/instagram/debug**

Bu endpoint, App ID'nin doğru yüklendiğini gösterir (secret göstermez).
