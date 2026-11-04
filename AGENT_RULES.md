# KURT CTO - AGENT GUARDRAILS - KURT OCRAI
# This file is MANDATORY to read before ANY task. Agent must follow these rules.

## 1. CRITICAL FILES - NEVER DELETE WITHOUT USER APPROVAL
Before deleting ANY of these files, you MUST ask: "Kritik dosya silinecek, onay veriyor musun?" and wait for YES.

CRITICAL LIST:
- config.yaml, config.json, .env, .env.local
- package.json, package-lock.json, pnpm-lock.yaml
- tsconfig.json, next.config.js, tailwind.config.js
- .continue/, .continue/config.json, .continue/config.yaml.bak
- .git/, .gitignore
- docs/, README.md, AGENT_RULES.md, CHANGELOG.md
- KurtOCRAI/config.yaml (app config)
- Any file outside KurtOCRAI workspace

If file is in critical list -> STOP -> Ask user -> Wait for explicit "evet/sil" -> Then delete.

## 2. BACKUP POLICY - BEFORE MAJOR UPDATES
Before any major update (3+ files changed, Faz change, major refactor, architecture change):

1. git add .
2. git commit -m "backup: before <task-name> - <date>"
3. git branch backup/<task-name>-<date>
4. Then proceed with task.

Never skip backup. If git is dirty, commit first.

## 3. SECURITY & CTO PRINCIPLES
- NEVER hardcode secrets. Use process.env.NVIDIA_API_KEY, process.env.XXX. Never push API keys to GitHub.
- NEVER run destructive commands: rm -rf /, rm -rf ~, rm -rf .git, rm -rf .continue, rm -rf node_modules without approval.
- ALWAYS read file before overwriting. Check if exists first.
- ALWAYS work ONLY inside KurtOCRAI workspace. Never touch ~/Documents/CODE/other-projects.
- ALWAYS keep docs/ updated. After code change, update docs/CHANGELOG.md with what and why.
- ALWAYS follow V3 architecture: docs/ = documentation, KurtOCR Core = OCR engine, Next.js frontend = UI. Don't break this structure without asking.
- ALWAYS use TypeScript strict, no any unless justified.
- ALWAYS keep V3 Prompt as source of truth.
- ALWAYS log changes in CHANGELOG.md
- NEVER push secrets, .env, node_modules to GitHub.

## 4. WORKFLOW
- Step 1: Read AGENT_RULES.md + V3 Prompt + relevant docs/
- Step 2: Plan (use Plan mode if needed)
- Step 3: Backup via git
- Step 4: Implement via Agent mode
- Step 5: Ask user to test via terminal: npm run dev / npm run build
- Step 6: Update docs/CHANGELOG.md

## 5. APPROVAL FLOW
- Create file -> Show diff -> Wait for Accept
- Edit file -> Show diff -> Wait for Accept
- Delete file -> If critical, ask explicit approval. If not critical, still show and wait for Accept.
- Big refactor -> Backup + Ask approval -> Then proceed.

## 6. FORBIDDEN
- No rm -rf without approval
- No secret in code
- No touching other projects
- No breaking V3 architecture without approval
- No skipping backup

END OF RULES - Agent must obey.