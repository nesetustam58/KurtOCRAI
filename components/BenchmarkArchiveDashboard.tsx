'use client';

import React, { useEffect, useState } from 'react';

export default function BenchmarkArchiveDashboard() {
  const [archives, setArchives] = useState<any[]>([]);
  const [selectedIteration, setSelectedIteration] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadArchives = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('kurtocrai_benchmark_archives') || '[]');
      // Eskiden yeniye / yeniden eskiye düzgün sıralama (Kopyayı bozmamak için kopya üzerinde reverse)
      const sorted = [...saved].reverse();
      setArchives(sorted);
      
      // Eğer seçili iterasyon yoksa veya listede kalmadıysa en üsttekini seç
      if (sorted.length > 0) {
        if (!selectedIteration || !sorted.some((a: any) => a.iteration === selectedIteration.iteration && a.timestamp === selectedIteration.timestamp)) {
          setSelectedIteration(sorted[0]);
        }
      }
    } catch (e) {
      console.error("Arşiv yükleme hatası:", e);
    }
  };

  useEffect(() => {
    loadArchives();
    const interval = setInterval(loadArchives, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearArchives = () => {
    localStorage.removeItem('kurtocrai_benchmark_archives');
    setArchives([]);
    setSelectedIteration(null);
  };

  const handleCopyArchivePayload = (arch: any) => {
    const jsonStr = "```json\n" + (arch.aiPayload || JSON.stringify(arch, null, 2)) + "\n```";
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(arch.iteration);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">📂 Tıklanabilir Geçmiş Arşiv & İterasyon Logları</h4>
          <p className="text-xs text-gray-500">Geçmiş test koşumlarının detaylarını inceleyin, iterasyonlar arasında gezinin.</p>
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
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2 border-r border-gray-100">
            {archives.map((arch, idx) => {
              const isSelected = selectedIteration?.iteration === arch.iteration && selectedIteration?.timestamp === arch.timestamp;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedIteration(arch)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#024D43]/10 border-[#024D43] text-[#024D43] font-semibold shadow-sm'
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">İterasyon #{arch.iteration}</span>
                    <span className="font-mono">CER: %{(arch.averageCER * 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{new Date(arch.timestamp).toLocaleDateString()} {new Date(arch.timestamp).toLocaleTimeString()}</span>
                    <span>{arch.successCount}/{arch.totalTests} Kararlı</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sağ Kolon: Seçilen İterasyonun Detayları ve AI Kopyalama */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-72 overflow-y-auto flex flex-col justify-between">
            {selectedIteration ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <div>
                    <span className="text-xs font-bold text-gray-800">İterasyon #{selectedIteration.iteration} Detay Raporu</span>
                    <span className="block text-[10px] text-gray-500 font-mono">Kayıt Zamanı: {new Date(selectedIteration.timestamp).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => handleCopyArchivePayload(selectedIteration)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-all border border-blue-200 flex items-center gap-1.5"
                  >
                    {copiedId === selectedIteration.iteration ? '✓ Kopyalandı!' : '📋 Bu İterasyon İçin AI JSON Kopyala'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-gray-100">
                  <div>Ortalama CER: <strong className="text-blue-700">{(selectedIteration.averageCER * 100).toFixed(2)}%</strong></div>
                  <div>Kararlı Ünite: <strong className="text-green-600">{selectedIteration.successCount} / {selectedIteration.totalTests}</strong></div>
                </div>

                <div className="space-y-1.5">
                  {selectedIteration.results?.map((res: any, rIdx: number) => (
                    <div key={rIdx} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-700">{res.testId}</span>
                      <div className="flex gap-3 font-mono">
                        <span className={res.success ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          %{(res.cer * 100).toFixed(2)}
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