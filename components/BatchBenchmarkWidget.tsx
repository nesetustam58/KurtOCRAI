'use client';

import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { OcrBatchBenchmark, BenchmarkTestCase, BenchmarkResult, OptimizationLog } from '../lib/ocrBatchBenchmark';

export default function BatchBenchmarkWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(1);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentId: '' });
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [optLog, setOptLog] = useState<OptimizationLog | null>(null);

  const startAutonomousBenchmark = async () => {
    setIsRunning(true);
    setSummary(null);
    setResults([]);

    try {
      // 1. Edge Worker Katmanından Akademik Veri Setlerini Çek
      const res = await fetch('/api/ocr-fetcher');
      const data = await res.json();
      
      if (!data.success || !data.testCases) {
        throw new Error('Akademik veri seti manifestosu alınamadı.');
      }

      const testCases: BenchmarkTestCase[] = data.testCases;

      // 2. Gerçek Tesseract.js v5 Motoru ile Edge Görsellerini Tara
      const realTesseractRunner = async (imageUrl: string, docType: string): Promise<string> => {
        const worker = await createWorker('tur+eng');
        await worker.setParameters({
          tessedit_pageseg_mode: (docType === 'fis' ? '4' : '6') as any,
        });

        const ret = await worker.recognize(imageUrl);
        await worker.terminate();

        return (ret && ret.data && typeof ret.data.text === 'string') ? ret.data.text.trim() : '';
      };

      const output = await OcrBatchBenchmark.runBatch(
        testCases,
        realTesseractRunner,
        (curr, total, id) => {
          setProgress({ current: curr, total, currentId: id });
        },
        iteration
      );

      setSummary(output.summary);
      setResults(output.results);
      setOptLog(output.optimizationLog);
      setIteration(prev => prev + 1);
    } catch (error) {
      console.error('Hibrit Akademik Otonom Benchmark Hatası:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#024D43] bg-[#024D43]/10 px-3 py-1 rounded-full">
            Hibrit Akademik Motor v6.0 (SROIE & CORD Entegre)
          </span>
          <h3 className="text-xl font-bold text-gray-800 mt-2">Cloudflare Edge & Self-Optimization Laboratuvarı</h3>
          <p className="text-sm text-gray-500">Dünya standardındaki akademik veri setleriyle beslenen, sıfır insan müdahaleli otonom motor.</p>
        </div>
        <button
          onClick={startAutonomousBenchmark}
          disabled={isRunning}
          className={`px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${
            isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#024D43] hover:opacity-90'
          }`}
        >
          {isRunning ? `Otonom Koşum İterasyon #${iteration} (${progress.current}/${progress.total})...` : `🚀 Hibrit Otonom Döngüyü Başlat (İterasyon #${iteration})`}
        </button>
      </div>

      {isRunning && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 font-medium mb-2">
            <span>İşlenen Akademik Ünite: <strong className="text-gray-900">{progress.currentId}</strong></span>
            <span>İlerleme: %{Math.round((progress.current / progress.total) * 100)}</span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#024D43] h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {optLog && (
        <div className="mb-6 p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-sm">
          <div>
            <span className="font-bold text-blue-900">🧠 Edge Optimizasyon Raporu:</span>
            <span className="text-blue-700 ml-2">İterasyon #{optLog.iteration} tamamlandı. Dinamik kural havuzu güncellendi.</span>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-blue-800">
            <span>Ort. CER: %{(optLog.averageCER * 100).toFixed(2)}</span>
            <span>Toplam Kural: {optLog.injectedRulesCount}</span>
            <span className="px-2 py-0.5 bg-blue-200/60 rounded text-blue-900 uppercase">{optLog.status}</span>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-500 block">Akademik Test Ünitesi</span>
            <span className="text-2xl font-bold text-gray-800">{summary.totalTests}</span>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <span className="text-xs text-green-600 block">Kararlı (CER &lt; %20)</span>
            <span className="text-2xl font-bold text-green-700">{summary.successCount}</span>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <span className="text-xs text-red-600 block">Sapma Gösteren</span>
            <span className="text-2xl font-bold text-red-700">{summary.failureCount}</span>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-xs text-blue-600 block">Karakter Hata Oranı (CER)</span>
            <span className="text-2xl font-bold text-blue-700">{(summary.averageCER * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="p-3">Akademik Veri Seti / Kimlik</th>
                <th className="p-3">Doğruluk Durumu</th>
                <th className="p-3">Karakter Hata (CER)</th>
                <th className="p-3">İşlem Süresi</th>
                <th className="p-3">Self-Healing Düzeltmeleri</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800">{res.testId}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      res.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {res.success ? 'Başararlı ✓' : 'Optimize Ediliyor ⚙'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold">{(res.cer * 100).toFixed(2)}%</td>
                  <td className="p-3 font-mono">{res.executionTimeMs} ms</td>
                  <td className="p-3 text-xs text-gray-500">{res.detectedErrors.join(', ') || 'Kusursuz Eşleşme'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}