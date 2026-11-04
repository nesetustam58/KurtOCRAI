#!/bin/bash
mkdir -p app components lib
cat > package.json << 'EOFF'
{"name":"kurtocrai","version":"0.1.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start"},"dependencies":{"next":"14.2.5","react":"18.3.1","react-dom":"18.3.1","tesseract.js":"^5.1.0"},"devDependencies":{"typescript":"^5.5.0","@types/node":"^20.12.0","@types/react":"^18.3.0","tailwindcss":"^3.4.1","postcss":"^8.4.33","autoprefixer":"^10.4.17"}}
EOFF
cat > app/page.tsx << 'EOFF'
import UploadZone from "@/components/UploadZone";
export default function Home(){return <main className="min-h-screen bg-zinc-950 text-white p-6"><h1 className="text-5xl font-black mt-12">KurtOCRAI</h1><div className="mt-10 p-8 rounded-2xl bg-zinc-900 border border-zinc-800"><UploadZone/></div></main>}
EOFF
echo "created"
