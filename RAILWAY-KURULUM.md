# LeoHoca - Railway Kurulum Rehberi

LeoHoca artık **https://leohoca-production.up.railway.app** adresinde çalışıyor.

## Tek Yapmanız Gereken: GROQ_API_KEY

1. **Railway Dashboard** → https://railway.app/dashboard
2. **leohoca** projenize tıklayın
3. **leohoca** servisine tıklayın
4. **Variables** sekmesi → **+ New Variable**
5. **Name:** `GROQ_API_KEY`
6. **Value:** Groq API anahtarınız (https://console.groq.com)
7. Kaydedin

Railway otomatik yeniden deploy eder. 1-2 dakika sonra LeoHoca çalışır.

---

## Şifre Koruması (Opsiyonel)

Sadece şifreyi bildiğiniz kişilerin kullanmasını istiyorsanız:

1. Railway **Variables** → **+ New Variable**
2. **Name:** `LEOHOCA_PASSWORD`
3. **Value:** Belirlediğiniz şifre (örn: `leo123`)
4. Bu şifreyi kullanmak istediğiniz kişilere verin

Şifre eklemezseniz herkes erişebilir.

## Yeni Özellikler için Ek Variables

Kayıt, giriş ve admin paneli için:

| Name | Value |
|------|-------|
| `ADMIN_EMAIL` | admin@email.com |
| `ADMIN_PASSWORD` | guvenli_sifre |
| `JWT_SECRET` | rastgele_uzun_anahtar (min 32 karakter) |

## Kontrol Listesi

- [x] GitHub'a push edildi
- [x] Railway'de deploy edildi
- [x] Domain: leohoca-production.up.railway.app
- [ ] **GROQ_API_KEY** eklendi (Variables)
- [ ] **ADMIN_EMAIL**, **ADMIN_PASSWORD**, **JWT_SECRET** (admin paneli)
- [ ] **LEOHOCA_PASSWORD** (opsiyonel - şifre koruması)

---

## Kullanım

**https://leohoca-production.up.railway.app** adresine gidin.

- Mikrofon butonuna basıp konuşun
- TR / SQ dil seçin
- LeoHoca yanıt verir ve sesli okur

Domain almaya gerek yok. Bu link herkese açık.
