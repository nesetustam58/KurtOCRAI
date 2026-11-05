'use client';

import React from 'react';
import Link from 'next/link';
import BatchBenchmarkWidget from '../../components/BatchBenchmarkWidget';

export default function BenchmarkPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Üst Navigasyon ve Geri Dönüş */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#024D43] bg-[#024D43]/10 px-3 py-1 rounded-full">
              Ar-Ge & Test Laboratuvarı
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">Otonom Batch Benchmark Motoru</h1>
            <p className="text-sm text-gray-500">Sadece yetkili geliştirici erişimine açık toplu OCR doğrulama ve optimizasyon paneli.</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>

        {/* Benchmark Bileşeni */}
        <BatchBenchmarkWidget />
      </div>
    </main>
  );
}