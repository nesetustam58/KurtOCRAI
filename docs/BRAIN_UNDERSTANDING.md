# KurtOCRAI - CTO Level Brain Understanding

## 1. Goals - Dünyanın En Doğru OCR + AI Document Intelligence
- Privacy-first, local-first, free/open-source MVP
- Beat competitors via academic papers + benchmarks
- Target: Low-quality scans, handwriting, multilingual TR/EN
- Zero cloud dependency in Phase 1 - all in browser
- Future: SaaS but self-hostable

## 2. Tech Stack
### Phase 1 MVP [NOW]:
- Next.js 14 App Router + TypeScript + Tailwind CSS
- 【entity-Tesseract¦canonical_name=Tesseract】.js v5 - client-side OCR, 100+ languages
- Components: UploadZone drag-drop, ImagePreview, OcrResult, LanguageSelector
- lib/kurtOCR.ts - wrapper for 【entity-Tesseract¦canonical_name=Tesseract】
- No backend, no API calls

### Phase 2 [Next]:
- Python microservice: EasyOCR + PaddleOCR
- FastAPI, image enhancement: denoise, deskew, super-resolution
- config.yaml: easyocr, lang: tr/en, denoise: true

### Phase 3:
- LLM Document Intelligence: Qwen2.5-VL / Donut / LayoutLMv3
- Table extraction, KV extraction

### Phase 4:
- Benchmark vs Google Vision, AWS Textract - publish results

## 3. Local-First Privacy
- All processing in browser via WASM
- No image upload to server, no tracking
- Offline capable after first load
- .env for keys, never commit

## 4. Phases
- FAZ 1 MVP: Upload + 【entity-Tesseract¦canonical_name=Tesseract】 + result display + copy/download [localhost:3000]
- FAZ 2 GELİŞMİŞ OCR: Python service + enhancement
- FAZ 3 AI: Document understanding
- FAZ 4 BENCHMARK: Academic comparison

## 5. Brains System [3 Brains]
- Kurt Ana Beyin: qwen2.5-coder:14b  - Main CTO, roles: chat/edit/apply - ~/.continue/config.json title field
- Kurt Hizli Fix: qwen2.5-coder:7b [4.7GB] - Quick fixes, role: edit
- Kurt Mimar NIM: deepseek-ai/deepseek-coder-33b-instruct via https://integrate.api.nvidia.com/v1 - Reviewer, role: chat, API Key: nvapi-xxx [rotated], fallback, 40 RPM / 10k day

## 6. Security & Rules
- AGENT_RULES.md, SECURITY_RULES.md, BRAIN_ORCHESTRATION.md must be read
- .gitignore: .env, node_modules/, .continue/, config.yaml.bak
- Continue config: config.json with title not name, config.yaml at project root is app config must stay

## 7. Current Status
- GitHub: https://github.com/nesetustam58/KurtOCRAI.git main branch
- Ollama verified: ollama list + curl localhost:11434/api/tags
- VS Code: Continue (NE) green tick, Problems 0
- docs/PROMPTS/: 4 files final structure - V3 full never delete, 001 Faz1 now, 002 Test placeholder, 003 Gorev1 placeholder
    