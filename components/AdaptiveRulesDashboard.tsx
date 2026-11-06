'use client';

import React, { useEffect, useState } from 'react';

export default function AdaptiveRulesDashboard() {
  const [rules, setRules] = useState<any[]>([]);

  const loadRules = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('kurtocr_adaptive_rules') || '[]');
      setRules(saved);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const clearRules = () => {
    localStorage.removeItem('kurtocr_adaptive_rules');
    setRules([]);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">🧠 Dinamik Self-Healing Kural Havuzu</h4>
          <p className="text-xs text-gray-500">Otonom motorun hatalardan türettiği aktif adaptif kurallar.</p>
        </div>
        {rules.length > 0 && (
          <button
            onClick={clearRules}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all"
          >
            Kuralları Sıfırla
          </button>
        )}
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4">Henüz otonom kural üretilmedi. Benchmark koşturulduğunda kurallar otomatik buraya eklenecektir.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-2">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-mono">
              <div>
                <span className="font-bold text-[#024D43]">{rule.id}</span>
                <span className="text-gray-500 ml-2">(İterasyon #{rule.iteration})</span>
              </div>
              <span className="text-gray-400">{new Date(rule.createdAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}