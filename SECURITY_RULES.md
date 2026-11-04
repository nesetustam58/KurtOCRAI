# KURT OCRAI - SECURITY & PRIVACY RULES
# Siber Güvenlikçi Seviyesinde - OWASP Top 10 + KVKK/GDPR Uyumlu

## 1. SECRET YÖNETİMİ - ASLA İFŞA ETME
- NVIDIA_API_KEY, OPENAI_API_KEY gibi key'ler ASLA kodda düz yazılmaz.
- Doğru: process.env.NVIDIA_API_KEY veya ${{ secrets.NVIDIA_API_KEY }}
- Yanlış: "apiKey": "nvapi-..."
- .env dosyası 【entity-GitHub¦canonical_name=GitHub】'a ASLA pushlanmaz. .gitignore'da olmalı.
- Ekran görüntüsü alırken key'li yerleri sansürle veya secret placeholder kullan.
- Eski ifşa olan key'ler hemen silinip yenisi üretilir.

## 2. .GITIGNORE - ZORUNLU
Aşağıdakiler MUTLAKA .gitignore'da olmalı:
.env
.env.local
node_modules/
.continue/
config.yaml.bak
dist/
build/
*.log
.DS_Store

## 3. INPUT VALIDATION - OCR DOSYALARI
- Kullanıcı PDF/resim yüklerken: mime type kontrolü (pdf, png, jpg, jpeg sadece)
- Dosya boyutu limiti: 20MB max (config.yaml'da fileSizeLimitMB: 20)
- Dosya ismi sanitize: ../../ gibi path traversal engelle
- Yüklenen dosyalar local'de işlenir, 3. partiye gönderilmez.

## 4. XSS & INJECTION ÖNLEME
- OCR çıktısı frontend'de innerHTML ile basılmaz, textContent veya sanitize edilir.
- Kullanıcı input'u direkt SQL/NoSQL sorgusuna gömülmez.
- API endpoint'lerde rate limiting: 1 IP'den saniyede max 10 istek.

## 5. GİZLİLİK - KVKK/GDPR
- Yüklenen belgeler local'de kalır, bulut'a gönderilmez.
- localStorage'da belge içeriği tutulmaz.
- İşlem bitince temp dosyalar silinir.
- Log'larda belge içeriği veya key basılmaz.

## 6. DEPENDENCY GÜVENLİĞİ
- Her npm install / npm run build öncesi: npm audit çalışır.
- Kritik (critical/high) açık varsa build durdurulur, önce fix yapılır.
- Bilinmeyen paketler eklenmez, sadece güvenilir kaynaklar.

## 7. GIT GÜVENLİĞİ
- .env, node_modules/, .continue/, dist/ asla commit edilmez.
- Commit mesajları açık: "feat: OCR core eklendi" gibi.
- main branch'e direkt push yerine backup branch + PR mantığı (ileride).

## 8. BACKUP ŞİFRELEME & ERİŞİM
- Backup branch'ler (backup/*) private repo'da kalır, public yapılmaz.
- Yedek zip'ler şifreli tutulursa daha iyi (ileride).

## 9. CONTINUE & OLLAMA GÜVENLİĞİ
- ~/.continue/config.json local'dir, GitHub'a gitmez, güvenlidir.
- Ollama localhost:11434 sadece local'den erişilir, dışarıya açılmaz.
- Agent dosya silerken AGENT_RULES.md'ye uyar.

## 10. İHLAL DURUMUNDA
- Key ifşa olursa: Hemen sil + yeni key üret + .env ve Continue secret'ı güncelle.
- Şüpheli dosya yüklenirse: İşlem reddedilir, log'a IP ve dosya ismi (içerik değil) yazılır.

END OF SECURITY RULES