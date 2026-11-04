# KurtOCRAI - Görselden Metne OCR - Sana Ait Yazılım

> **Vizyon:** Dünyanın en doğru, en hızlı, en basit OCR + AI Document Intelligence. Gerçek bir insan PDF/resim yükler ve <2 saniyede mükemmel metni alır, privacy (local processing), temiz kod, otomatik dokümantasyon.

Bu klasördeki kodların tamamı sana ait, istediğin gibi çalıştırabilir ve değiştirebilirsin.

## İÇİNDEKİLER

1. `simple_ocr.py` -> En basit kullanım, tek dosya ile terminalden çalışır
2. `app.py + templates/index.html` -> Web uygulaması versiyonu (sürükle-bırak) [Eski Python versiyon]
3. **Yeni Faz 1 MVP:** `app/` (Next.js 14) + `components/UploadZone.tsx` + `lib/kurtOCR.ts` -> Tarayıcı içinde Tesseract.js v5
4. `docs/PROMPTS/` -> Prompt arşivi, profesyonel versiyonlama
5. `Gorselden-Metne-Ocr-Taray.html` -> **Seçilen Kullanıcı Arayüzü** (Meta AI tarafından hazırlandı, hafızada tutuluyor, VS Code AI beyne yaptırılacak)

## TEKNOLOJİ

### Faz 1 MVP [ŞU AN]
- **Next.js 14.2+ App Router, TypeScript Strict, Tailwind CSS 3.4+**
- **KurtOCR Core:** Tesseract.js 5.x (browser OCR, tur+eng) - Tarayıcı içinde çalışır, resim sunucuya gitmez
- **File:** pdf-lib (PDF sayfa çıkarma - Faz 2)
- **State:** Zustand 4.x (planlandı)
- **Validation:** Zod
- **Security:** DOMPurify, lib/security.ts
- **UI:** `Gorselden-Metne-Ocr-Taray.html` -> `app/page.tsx` ve `components/UploadZone.tsx`'e taşınacak

### Faz 2 [Python Gelişmiş OCR]
- **EasyOCR:** Türkçe desteği çok iyi olan açık kaynak OCR motoru
- **Enhancement:** Denoise, deskew, super-resolution, griye çevirme
- **Çok sayfalı PDF:** PyMuPDF ile sayfaları resme çevirip OCR yap
- **Backend:** FastAPI microservice

### Faz 3 [AI Document Intelligence]
- **GOT-OCR 2.0 veya TrOCR** modelleri
- **LLM:** Qwen2.5-VL / Donut / LayoutLMv3 ile tablo ve KV extraction

### Faz 4 [Benchmark]
- Google Vision, AWS Textract vs karşılaştırma

## KURULUM

```bash
# 1. KurtOCRAI'yi tek başına aç (kainat'tan ayrı)
# Finder > Belgeler > CODE > KurtOCRAI > VS Code ile Aç

# 2. AI beyin ile setup script oluştur (Kurt Ana Beyin 14b)
# Continue > Kurt Ana Beyin > Agent > New Session
# Prompt: Create file setup-kurtocrai.sh that creates full KurtOCRAI Phase 1 MVP structure

# 3. Script'i çalıştır
chmod +x setup-kurtocrai.sh
./setup-kurtocrai.sh

# 4. Kur ve çalıştır
npm install
npm run dev
# http://localhost:3000