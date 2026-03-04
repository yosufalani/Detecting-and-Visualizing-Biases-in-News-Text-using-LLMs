import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnalysisResult, BiasDetail } from '../types';
import { BIAS_COLORS } from '../constants';

interface ResultViewProps {
  result: AnalysisResult;
  onClose: () => void;
}

const getBiasColorClass = (score: number) => {
  if (score < 20) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score < 50) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

const getSeverityLabel = (score: number) => {
  if (score < 20) return 'Low';
  if (score < 50) return 'Moderate';
  return 'High';
};

const getBiasIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'framing': return 'fa-crop-alt';
    case 'negativity': return 'fa-cloud-meatball';
    case 'confirmation': return 'fa-user-check';
    case 'anchoring': return 'fa-anchor';
    case 'attribution': return 'fa-fingerprint';
    case 'selection': return 'fa-tasks';
    case 'sensationalism': return 'fa-bullhorn';
    case 'false balance': return 'fa-balance-scale-left';
    case 'omission': return 'fa-ghost';
    case 'in-group/out-group': return 'fa-users-slash';
    default: return 'fa-shield-alt';
  }
};

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [activeBias, setActiveBias] = useState<BiasDetail | null>(null);

  useEffect(() => {
    document.body.style.overflow = activeBias ? 'hidden' : 'auto';
  }, [activeBias]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveBias(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="relative rounded-3xl shadow-2xl border border-white/40 overflow-hidden h-full flex flex-col backdrop-blur-xl bg-white/70">
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-rose-50/30 pointer-events-none"></div>

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
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-12">

        {/* Executive Summary */}
        <div className="relative p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
          <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest text-blue-400">
            AI GENERATED
          </div>
          <h4 className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            Executive Summary
          </h4>
          <p className="text-blue-900 leading-relaxed italic text-sm">
            "{result.summary}"
          </p>
        </div>

        {/* Primary Metrics */}
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

              <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-xl border border-gray-200 shadow-sm">
                Score: {result.biasScore}
              </div>
            </div>

            {/* Animated Spectrum */}
            <div className="mt-8">
              <div className="relative h-3 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-300 via-white via-red-300 to-red-700"></div>

                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${((result.biasScore + 100) / 200) * 100}% - 12px)`
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-black/20 blur-md scale-150 animate-pulse"></div>
                    <div className="w-6 h-6 bg-white border-4 border-gray-900 rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4 text-[10px] font-black tracking-widest uppercase text-gray-400">
                <span>Far Left</span>
                <span>Center</span>
                <span>Far Right</span>
              </div>
            </div>
          </div>

          {/* Other Metrics */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Sensationalism
              </span>
              <div className="text-3xl font-black mt-2 text-gray-800">
                {result.sensationalismScore}%
              </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Tonality
              </span>
              <div className="text-lg font-bold mt-2 text-gray-800 line-clamp-1">
                {result.tonality}
              </div>
            </div>
          </div>
        </div>

        {/* Bias Matrix */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i className="fas fa-layer-group text-blue-500"></i>
            Bias Intensity Matrix
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {result.detailedBiases?.map((bias, idx) => {
              const colorClasses = getBiasColorClass(bias.presenceScore);

              return (
                <button
                  key={idx}
                  onClick={() => setActiveBias(bias)}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] group flex flex-col h-full ${colorClasses}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <i className={`fas ${getBiasIcon(bias.type)} opacity-60 text-sm`}></i>
                    <span className="text-xs font-black">{bias.presenceScore}%</span>
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-tight mb-1">
                    {bias.type}
                  </div>

                  <div className="text-[9px] opacity-70 line-clamp-2 leading-tight">
                    {bias.evidence}
                  </div>

                  <div className="text-[9px] font-bold uppercase tracking-widest mt-2 opacity-70">
                    {getSeverityLabel(bias.presenceScore)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Biased Phrases */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i className="fas fa-highlighter text-amber-500"></i>
            Framing & Biased Phrasing
          </h3>

          <div className="space-y-6">
            {result.biasedPhrases?.length > 0 ? (
              result.biasedPhrases.map((phrase, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-5 flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 animate-pulse"></div>
                    <span className="font-bold text-gray-900 italic text-base">
                      "{phrase.phrase}"
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                      <h4 className="font-black text-gray-400 mb-2 uppercase text-[10px] tracking-widest">
                        Why It's Flagged
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {phrase.reason}
                      </p>
                    </div>

                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                      <h4 className="font-black text-emerald-700 mb-2 uppercase text-[10px] tracking-widest">
                        Neutral Alternative
                      </h4>
                      <p className="text-emerald-900 font-bold text-base leading-tight">
                        "{phrase.suggestedAlternative}"
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <i className="fas fa-check-circle text-emerald-500 text-3xl mb-2"></i>
                <p className="text-gray-500 font-medium">
                  No significantly biased linguistic framing detected.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal */}
      {activeBias &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setActiveBias(null)}
            />

            <div className={`relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden`}>
              <div className={`p-5 flex items-center justify-between border-b ${getBiasColorClass(activeBias.presenceScore)}`}>
                <div className="flex items-center gap-3">
                  <i className={`fas ${getBiasIcon(activeBias.type)} text-xl`}></i>
                  <h3 className="font-black uppercase tracking-widest text-sm">
                    {activeBias.type}
                  </h3>
                </div>
                <div className="text-sm font-black bg-white/70 px-3 py-1 rounded-xl">
                  {activeBias.presenceScore}%
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  AI Evidence & Reasoning
                </h4>

                <p className="text-gray-800 leading-relaxed text-sm">
                  {activeBias.evidence}
                </p>

                <button
                  onClick={() => setActiveBias(null)}
                  className="mt-8 w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ResultView;