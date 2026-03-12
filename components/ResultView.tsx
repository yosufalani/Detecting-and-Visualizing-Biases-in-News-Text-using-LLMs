import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnalysisResult, BiasDetail } from '../types';
import { BIAS_COLORS } from '../constants';

interface ResultViewProps {
  result: AnalysisResult & { framingScore?: number };
  onClose: () => void;
}

const getBiasColorClass = (score: number) => {
  if (score < 2) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score < 4) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

const getFramingLabel = (score: number) => {
  if (score < 2) return 'Low';
  if (score < 4) return 'Moderate';
  return 'High';
};

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [activeBias, setActiveBias] = useState<BiasDetail | null>(null);

  const alignmentScore = result.biasScore ?? 0;
  const framingScore = result.framingScore ?? 1;

  useEffect(() => {
    document.body.style.overflow = activeBias ? 'hidden' : 'auto';
  }, [activeBias]);

  return (
    <div className="relative rounded-3xl shadow-2xl border border-white/40 overflow-hidden h-full flex flex-col backdrop-blur-xl bg-white/70">
      
      {/* Header */}
      <div className="relative z-10 p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold line-clamp-1">{result.title}</h2>
          <p className="text-slate-400 text-sm">
            Analysis Report • {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-12">

        {/* Executive Summary */}
        <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
          <h4 className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            Executive Summary
          </h4>
          <p className="text-blue-900 leading-relaxed italic text-sm">
            "{result.summary}"
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Political Alignment */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Political Alignment
            </span>

            <div className="mt-4 flex items-center justify-between">
              <div
                className="text-2xl font-black italic uppercase tracking-tight"
                style={{ color: BIAS_COLORS[result.category] }}
              >
                {result.category}
              </div>

              <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-xl border">
                Score: {alignmentScore}
              </div>
            </div>

            {/* Alignment Slider */}
            <div className="mt-8">
              <div className="relative h-3 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-white to-red-700"></div>

                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${((alignmentScore + 100) / 200) * 100}% - 12px)`
                  }}
                >
                  <div className="w-6 h-6 bg-white border-4 border-gray-900 rounded-full shadow-lg"></div>
                </div>
              </div>

              <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-gray-400">
                <span>Far Left</span>
                <span>Center</span>
                <span>Far Right</span>
              </div>
            </div>
          </div>

          {/* Framing Intensity */}
          <div className={`p-6 rounded-3xl border shadow-sm ${getBiasColorClass(framingScore)}`}>
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
              Framing Intensity
            </span>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-3xl font-black">
                {framingScore}/5
              </div>

              <div className="text-sm font-bold uppercase tracking-widest">
                {getFramingLabel(framingScore)}
              </div>
            </div>

            <div className="mt-6 h-2 bg-white/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-700"
                style={{ width: `${(framingScore / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Biased Phrases */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Framing & Biased Phrasing
          </h3>

          {result.biasedPhrases?.length > 0 ? (
            result.biasedPhrases.map((phrase: any, idx: number) => (
              <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="font-bold text-gray-900 italic mb-3">
                  "{phrase}"
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              No significantly biased linguistic framing detected.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResultView;