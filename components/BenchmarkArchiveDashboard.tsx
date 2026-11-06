'use client';

import React, { useEffect, useState } from 'react';

export default function BenchmarkArchiveDashboard() {
  const [archives, setArchives] = useState<any[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<any | null>(null);

  const loadArchives = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('kurtocrai_benchmark_archives') || '[]');
      setArchives(saved.reverse()); // En son iterasyon en üstte
      if (saved.length > 0 && !selectedIteration) {
        setSelectedIteration(saved[0]);
      }
    } catch (e) {
      console.error("Arşiv yükleme hatası:", e);
    }
  };

  useEffect(() => {
    loadArchives();
  }, []);

  const clearArchives = () => {
    localStorage.removeItem('kurtocrai_benchmark_archives');
    setArchives([]);
    setSelectedIteration(null);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">📂 Tıklanabilir Geçmiş Arşiv & İterasyon Logları</h4>
          <p className="text-xs text-gray-500">Geçmiş test koşumlarının detaylarını inceleyin.</p>
        </div>
        {archives.length > 0 && (
          <button
            onClick={clearArchives}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all"
          >
            Arşivi Temizle
          </button>
        )}
      </div>

      {archives.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4">Henüz kaydedilmiş arşiv bulunmuyor. Benchmark koşturulduğunda loglar buraya eklenecektir.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sol Kolon: İterasyon Listesi */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border-r border-gray-100">
            {archives.map((arch, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedIteration(arch)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedIteration?.iteration === arch.iteration && selectedIteration?.timestamp === arch.timestamp
                    ? 'bg-[#024D43]/10 border-[#024D43] text-[#024D43] font-semibold'
                    : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span>İterasyon #{arch.iteration}</span>
                  <span className="font-mono">Ort. CER: %{(arch.averageCER * 100).toFixed(2)}</span>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(arch.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          {/* Sağ Kolon: Seçilen İterasyonun Detayları */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">
            {selectedIteration ? (
              <div>
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-800">İterasyon #{selectedIteration.iteration} Detayları</span>
                  <span className="text-xs font-mono text-blue-700">Zaman: {new Date(selectedIteration.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="space-y-2">
                  {selectedIteration.results?.map((res: any, rIdx: number) => (
                    <div key={rIdx} className="bg-white p-2.5 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">{res.testId}</span>
                      <div className="flex gap-4 font-mono">
                        <span className={res.success ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          CER: %{(res.cer * 100).toFixed(2)}
                        </span>
                        <span className="text-gray-400">{res.executionTimeMs} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-10">İncelemek için sol menüden bir iterasyon seçin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}