# KURT CTO - BRAIN ORCHESTRATION - 3 BEYİN GÖREV DAĞILIMI
# Amaç: Beyinler çakışmasın, herkes işini bilsin

## BEYİNLER

### 1. Kurt Ana Beyin [qwen2.5-coder:14b] - CTO & Ana Mimar
- Title: Kurt Ana Beyin
- Provider: ollama, model: qwen2.5-coder:14b
- Roller: chat, edit, apply, Agent modunda aktif
- Ne yapar: 
    - V3 Final Prompt'u uygular
    - Faz 1 MVP, docs/GÖREV 1, GÖREV 2 gibi büyük feature'ları kodlar
    - docs/ klasörünü, KurtOCR Core'u, Next.js frontend'i oluşturur
    - Mimariden sorumlu, son söz onda
- Ne yapmaz: 1 satırlık typo fix için kullanılmaz (Hızlı Fix'e bırakır)
- Seçim: Büyük işlerde "Kurt Ana Beyin" seçilir

### 2. Kurt Hızlı Fix [qwen2.5-coder:7b] - Hızlı Müdahale Timi
- Title: Kurt Hızlı Fix
- Provider: ollama, model: qwen2.5-coder:7b
- Roller: edit
- Ne yapar:
    - Küçük bug fix, typo, renk değişimi, 1-2 satır düzeltme
    - Hızlı hotfix, "şu butonun rengini düzelt" gibi işler
    - 5 saniyelik işler
- Ne yapmaz:
    - Büyük dosya oluşturma YASAK
    - Mimari değiştirme YASAK
    - docs/ yapısı değiştirme YASAK
- Seçim: Küçük fixlerde "Kurt Hızlı Fix" seçilir

### 3. Kurt Mimar NIM [deepseek-ai/deepseek-coder-33b-instruct] - Mimar & Reviewer
- Title: Kurt Mimar NIM
- Provider: openai (Nvidia), model: deepseek-ai/deepseek-coder-33b-instruct
- Roller: chat
- Ne yapar:
    - Kod review, güvenlik analizi, en iyi pratik önerisi
    - "Dünyanın en doğru OCR'ı nasıl olur?" önerisini değerlendirir
    - Performans, güvenlik, mimari tavsiye verir
- Ne yapmaz:
    - Direkt dosya yazma YOK, sadece analiz ve öneri
    - Öneriyi Ana Beyin uygular
- Seçim: Review, analiz, öneri işlerinde "Kurt Mimar NIM" seçilir

## ÇAKIŞMA ÖNLEME KURALLARI

1. Aynı anda sadece 1 beyin aktif olur. Diğerleri bekler.
2. Dosya kilidi: Bir beyin bir dosyayı yazarken diğeri o dosyaya dokunmaz.
3. Görev kuyruğu: Büyük görev -> Ana Beyin, Küçük fix -> Hızlı Fix, Review -> Mimar NIM
4. Son söz: Kurt Ana Beyin (CTO)
5. Her beyin göreve başlamadan önce bu dosyayı + AGENT_RULES.md + SECURITY_RULES.md + V3 Prompt'u okur.

## WORKFLOW ÖRNEĞİ

- Faz 1 MVP -> Ana Beyin (Agent modunda) -> docs/ + src/ oluşturur
- Buton rengi yanlış -> Hızlı Fix -> 1 satır düzeltir
- Güvenlik açığı var mı? -> Mimar NIM -> Analiz eder -> Ana Beyin fixler

## GEÇİŞ TALİMATI

- V3 Prompt'un en başında: "Önce AGENT_RULES.md, SECURITY_RULES.md ve BRAIN_ORCHESTRATION.md'yi oku, hangi beyin olduğunu bil, o role göre davran" yazılacak.

END OF ORCHESTRATION