# LeoGPT — Yol Haritası ve Özellik Kategorileri

## 🧠 1. Dil ve Zeka Yeteneği

| Özellik | Durum | Notlar |
|---------|-------|--------|
| Doğal sohbet | ✅ | Groq/Gemini/OpenAI |
| Metin yazma / düzeltme / özetleme | ✅ | Applications paneli |
| Çeviri (çok dil) | ✅ | TR, SQ, EN |
| Kod yazma ve hata çözme | ✅ | Codex |
| Mantık yürütme ve problem çözme | ✅ | AI yeteneği |
| Teknik destek | ✅ | Persona'da tanımlı |

---

## 🎙 2. Multimedya Yeteneği

| Özellik | Durum | Notlar |
|---------|-------|--------|
| Yazıyı sese çevirme (TTS) | ✅ | Web Speech API |
| Sesi yazıya çevirme (STT) | ✅ | Web Speech API |
| Görsel üretme | ⏳ | Fikir önerme (gerçek üretim yok) |
| Görsel düzenleme | ❌ | Planlanacak |
| Görsel analiz etme | ✅ | Resim yükleme + AI |

---

## 📂 3. Dosya ve Araç Yeteneği

| Özellik | Durum | Notlar |
|---------|-------|--------|
| PDF, Word, Excel, PPT oluşturma | ❌ | Planlanacak |
| Kod çalıştırma ortamı | ❌ | Planlanacak |
| Hesaplama yapma | ⏳ | AI ile yapılıyor |
| Veri analizi | ⏳ | AI ile yapılıyor |
| Web araştırma | ❌ | Planlanacak |

---

## 🔊 Profesyonel Ses Özellikleri (Hedef)

### 1️⃣ Doğallık (Human-like)
- [ ] Robotik olmamalı
- [ ] Nefes araları
- [ ] Vurgu doğru yerde
- [ ] Cümle sonu iniş/çıkış doğal

### 2️⃣ Ton Kontrolü
- [x] Erkek / Kadın ses
- [x] Samimi / Ciddi / Öğretici / Enerjik / Sakin (voice_pro.json)

### 3️⃣ Ayarlanabilir Parametreler
- [x] Konuşma hızı (0.7x – 1.2x)
- [x] Ses tonu (pitch) (0.8 – 1.4)
- [ ] Duygu seviyesi (emotion intensity)
- [ ] Aksan seçimi (TR, SQ varyasyonları)

### 🔥 Üst Seviye (Gelecek)
- [ ] **Neural TTS** — ElevenLabs / OpenAI TTS / Google Cloud TTS
- [ ] **Emotion-aware TTS**
- [ ] **Streaming ses** — Cevap yazılırken ses gelmesi

---

## Teknik Notlar

**Mevcut TTS:** Web Speech API (tarayıcı/OS sesleri) — sınırlı, ücretsiz.

**Neural TTS için seçenekler:**
| Servis | Kalite | Maliyet |
|--------|--------|---------|
| ElevenLabs | ⭐⭐⭐⭐⭐ | Ücretli |
| OpenAI TTS | ⭐⭐⭐⭐ | Ücretli |
| Google Cloud TTS | ⭐⭐⭐⭐ | Ücretli |
| Azure Speech | ⭐⭐⭐⭐ | Ücretli |

**Streaming TTS:** Web Speech API streaming desteklemiyor. Neural TTS API'leri ile mümkün.

---

## voice_pro.json (2.0 Pro)

TR/SQ/EN için dil + cinsiyet + duygu profilleri:
- **Samimi** (friendly)
- **Ciddi** (professional)
- **Öğretici** (teacher)
- **Enerjik** (energetic)
- **Sakin** (calm)

Emoji kaldırma, kod blok kaldırma aktif.

---

## 📱 Instagram API (Planlanan)

Sosyal medya uzmanı modu:
- Admin panelden hesap ekleme (OAuth, şifre sohbette yok)
- Sohbet: "@hesap istatistikleri" → anlık veri
- AI: sorun tespiti + çözüm yol haritası

Detay: `INSTAGRAM-ENTEGRASYON.md`
