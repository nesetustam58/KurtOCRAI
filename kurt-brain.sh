#!/bin/bash
TASK="$1"
TARGET="$2"
if [ -z "$TASK" ] || [ -z "$TARGET" ]; then echo "Kullanim: ./kurt-brain.sh \"gorev\" hedef/dosya.tsx"; exit 1; fi
if [ -f "$TARGET" ]; then cp "$TARGET" "$TARGET.bak"; fi
PROMPT="GOREV: $TASK. SADECE $TARGET icin kod yaz, baska dosya olusturma."
echo "Beyin calisiyor: $TARGET..."
curl -s http://localhost:11434/api/generate -d "{\"model\":\"qwen2.5-coder:14b\",\"prompt\":\"$PROMPT\",\"stream\":false}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))" > /tmp/kurt_out.txt
cp /tmp/kurt_out.txt "$TARGET"
echo "Yazildi: $TARGET"
