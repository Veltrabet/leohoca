# Deploy në GitHub — Udhëzues

## 1. Përgatitje

- Mos ngarkoni **server/.env** — ai është në .gitignore
- Variablat e ndjeshme vendosen në Railway Variables

## 2. Push në GitHub

```bash
git init
git add .
git commit -m "LeoGPT - AI Asistent"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## 3. Variablat Railway

| Variabël | Vlerë | Ku merret |
|----------|-------|-----------|
| GROQ_API_KEY | gsk_xxx | console.groq.com |
| ADMIN_EMAIL | admin@example.com | — |
| ADMIN_PASSWORD | xxx | — |
| META_APP_ID | xxx | developers.facebook.com |
| META_APP_SECRET | xxx | developers.facebook.com |
| INSTAGRAM_REDIRECT_URI | https://DOMAIN/api/instagram/callback | URL e Railway |

## 4. Meta / Instagram

1. developers.facebook.com → Create App → Business
2. Add Product → Instagram → Set Up
3. Valid OAuth Redirect URIs: `https://LEOHOCA-URL/api/instagram/callback`
4. Settings → Basic → Kopjo App ID dhe App Secret

## 5. Test

- Hap https://DOMAIN-RAILWAY
- Admin: https://DOMAIN-RAILWAY/admin.html
- Hyr me ADMIN_EMAIL dhe ADMIN_PASSWORD
