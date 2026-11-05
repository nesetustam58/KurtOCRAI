'use client';

import React from 'react';
import { TestLibraryItem } from '../lib/ocrEvaluationEngine';

interface TestLibraryPanelProps {
  testLibrary: TestLibraryItem[];
  onClearLibrary: () => void;
}

export default function TestLibraryPanel({ testLibrary, onClearLibrary }: TestLibraryPanelProps) {
  return (
    <section className="rounded-[24px] bg-[var(--surface-3)] border border-[var(--border)] p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[20px] font-bold">📚 Özerk Test Kütüphanesi & Web Literatür Logları</h2>
          <p className="text-[13.5px] text-[var(--ink-2)] mt-1">
            Görsel testleri ve web'den taranan akademik literatür kaynakçaları burada otomatik olarak depolanır.
          </p>
        </div>
        {testLibrary.length > 0 && (
          <button
            onClick={onClearLibrary}
            className="px-4 py-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[12px] font-semibold hover:text-red-600 transition"
          >
            Kütüphaneyi Temizle
          </button>
        )}
      </div>

      {testLibrary.length === 0 ? (
        <div className="text-center py-8 text-[var(--ink-3)] text-[14px] border border-dashed border-[var(--border)] rounded-[16px]">
          Henüz test kütüphanesine kaydedilmiş veri yok. Görsel tarayın veya "Web'den Literatür Tara" butonuna basın.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {testLibrary.map((item) => (
            <div
              key={item.id}
              className="rounded-[18px] bg-[var(--bg)] border border-[var(--border)] p-5 flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    {item.topic}
                  </span>
                  <span className="text-[11px] text-[var(--ink-3)]">{item.date}</span>
                </div>

                <p className="text-[13px] font-medium text-[var(--ink)] mb-2 italic">
                  "{item.summary}"
                </p>

                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="text-[11.5px] font-semibold text-[var(--ink-2)] mb-1">Taranan Kaynakçalar:</div>
                  <ul className="list-disc list-inside text-[11px] text-[var(--ink-3)] space-y-0.5">
                    {item.sourcesScanned.map((src, idx) => (
                      <li key={idx} className="truncate">{src}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11.5px] font-semibold pt-2">
                <span className="text-emerald-600">Güven Skoru: %{item.confidenceScore}</span>
                <span className="text-[var(--ink-2)]">Durum: Başarılı ✓</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}