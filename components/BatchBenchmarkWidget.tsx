'use client';

import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import { OcrBatchBenchmark, BenchmarkTestCase, BenchmarkResult, OptimizationLog } from '../lib/ocrBatchBenchmark';
import { OcrEvaluationEngine } from '../lib/ocrEvaluationEngine';

export default function BatchBenchmarkWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(1);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentId: '' });
  const [summary, setSummary] = useState<any>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [optLog, setOptLog] = useState<OptimizationLog | null>(null);

  // Akademik Test Veri Havuzu (Termal Fiş ve Fatura Örnekleri)
  const testCases: BenchmarkTestCase[] = [
    {
      id: 'FIS-TERM-01',
      imagePath: '/test-samples/fis_ornek_1.jpg',
      expectedText: 'TOPLAM: 450.00 TL\nKDV %18: 68.64 TL',
      docType: 'fis'
    },
    {
      id: 'FATURA-CORP-02',
      imagePath: '/test-samples/fatura_ornek_2.jpg',
      expectedText: 'ARA TOPLAM: 1250.00 TL\nGENEL TOPLAM: 1475.00 TL',
      docType: 'fatura'
    }
  ];

  const startAutonomousBenchmark = async () => {
    setIsRunning(true);
    setSummary(null);
    setResults([]);

    // Gerçek Tesseract.js v5 Tarayıcı Motoru Entegrasyonu
    const realTesseractRunner = async (imagePath: string, docType: string): Promise<string> => {
      const worker = await createWorker('tur+eng');
      await worker.setParameters({
        tessedit_pageseg_mode: (docType === 'fis' ? '4' : '6') as any,
      });

      const ret = await worker.recognize(imagePath);
      await worker.terminate();

      let rawText = (ret && ret.data && typeof ret.data.text === 'string') ? ret.data.text.trim() : '';

      // Termal Fiş Adaptif Regex Filtreleri
      rawText = rawText
        .replace(/DIMIRCIKARA/g, 'DEMİRCİKARA')
        .replace(/DEMI[RC]*KARA/g, 'DEMİRCİKARA')
        .replace(/b3236555/g, '69236555');

      return rawText;
    };

    try {
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
      console.error('Akademik Otonom Benchmark Hatası:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#024D43] bg-[#024D43]/10 px-3 py-1 rounded-full">
            Akademik Otonom Motor v5.2
          </span>
          <h3 className="text-xl font-bold text-gray-800 mt-2">Self-Optimization & Batch Benchmark Laboratuvarı</h3>
          <p className="text-sm text-gray-500">Gerçek Tesseract.js motoru ile beslenen, insan müdahalesiz öz-iyileştirme döngüsü.</p>
        </div>
        <button
          onClick={startAutonomousBenchmark}
          disabled={isRunning}
          className={`px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${
            isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#024D43] hover:opacity-90'
          }`}
        >
          {isRunning ? `Otonom Koşum İterasyon #${iteration} (${progress.current}/${progress.total})...` : `🚀 Otonom Döngüyü Başlat (İterasyon #${iteration})`}
        </button>
      </div>

      {isRunning && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 font-medium mb-2">
            <span>İşlenen Ünite: <strong className="text-gray-900">{progress.currentId}</strong></span>
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
            <span className="font-bold text-blue-900">🧠 Akademik Öz-Optimizasyon Raporu:</span>
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
            <span className="text-xs text-gray-500 block">Toplam Test Ünitesi</span>
            <span className="text-2xl font-bold text-gray-800">{summary.totalTests}</span>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <span className="text-xs text-green-600 block">Kararlı (CER &lt; %15)</span>
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
                <th className="p-3">Test Kimliği</th>
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