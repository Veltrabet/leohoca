# GitHub'a Yükleme Rehberi

## Adım 1: GitHub'da yeni repo oluşturun

1. **https://github.com** adresine gidin
2. Sağ üstte **+** → **New repository** tıklayın
3. **Repository name:** `leohoca` veya `yapay-zeka` yazın
4. **Public** seçin
5. **Create repository** tıklayın (README eklemeyin, boş olsun)

## Adım 2: Terminal'de bu komutları çalıştırın

Terminal açın (Cmd+Space → "Terminal" yazın) ve şunları yapın:

```bash
cd "/Users/Apple/Desktop/yapay zeka"

git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
git push -u origin main
```

**Önemli:** `KULLANICI_ADINIZ` → GitHub kullanıcı adınız  
**Önemli:** `REPO_ADI` → Oluşturduğunuz repo adı (örn: leohoca)

### Örnek:
GitHub kullanıcı adınız `ahmet` ve repo adı `leohoca` ise:
```bash
git remote add origin https://github.com/ahmet/leohoca.git
git push -u origin main
```

## Adım 3: Şifre / Token

GitHub artık şifre kabul etmiyor. İki seçenek:

### A) GitHub Desktop (Kolay)
1. https://desktop.github.com indirin
2. GitHub ile giriş yapın
3. File → Add Local Repository → "yapay zeka" klasörünü seçin
4. Publish repository tıklayın

### B) Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token
3. repo yetkisi verin
4. Push sırasında şifre yerine bu token'ı kullanın
