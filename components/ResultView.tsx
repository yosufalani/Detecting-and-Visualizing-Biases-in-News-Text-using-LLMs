import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

const BIAS_INFO = [
  {
    key: 'political_framing',
    name: 'Political Framing',
    icon: 'fa-balance-scale',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    tag: 'bg-blue-100 text-blue-700',
    short: 'Word choices that favor one political side',
    desc: 'Political framing bias occurs when language subtly favors one political perspective — without stating anything factually false. The same event can produce very different reader reactions depending on which words are chosen.',
    biased: '"Radical protesters stormed the Capitol, threatening democracy."',
    neutral: '"Demonstrators entered the Capitol during the certification vote."',
    explanation: '"Radical", "stormed", and "threatening democracy" are editorial judgments, not neutral descriptions.',
    signals: ['"Tax relief" vs "tax cuts"', '"Illegal aliens" vs "undocumented immigrants"', '"Job creators" vs "the wealthy"'],
  },
  {
    key: 'political_direction',
    name: 'Political Direction',
    icon: 'fa-compass',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    tag: 'bg-purple-100 text-purple-700',
    short: 'Whether the bias leans left or right',
    desc: 'Once framing bias is detected, political direction identifies which side of the spectrum it favors — on a scale from Far Left to Far Right. This drives the alignment slider in the analysis above.',
    biased: '"The radical left\'s open borders agenda floods the country with illegal aliens."',
    neutral: '"The proposed policy would increase the number of migrants admitted annually."',
    explanation: '"Radical left", "open borders agenda", and "illegal aliens" all signal a strong rightward lean.',
    signals: ['Left: "undocumented", "reproductive rights", "gun safety"', 'Right: "illegal aliens", "pro-life", "tax relief", "radical left"', 'Center: neutral descriptors, balanced sourcing'],
  },
  {
    key: 'sensationalism',
    name: 'Sensationalism',
    icon: 'fa-fire',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    tag: 'bg-orange-100 text-orange-700',
    short: 'Exaggerated language designed to provoke emotion',
    desc: 'Sensationalism uses dramatic or emotionally charged language to attract attention rather than inform. It prioritizes engagement over accuracy and makes routine events sound extraordinary.',
    biased: '"BOMBSHELL: Explosive revelations DEVASTATE president in shocking scandal."',
    neutral: '"New documents in the ongoing investigation may be relevant to the case."',
    explanation: '"BOMBSHELL", "explosive", "DEVASTATE", and "shocking" add drama without adding facts.',
    signals: ['"Bombshell", "explosive", "shocking", "devastating"', '"Crisis" applied to routine problems', 'Clickbait headlines that overstate the story'],
  },
];

interface ResultViewProps {
  result: AnalysisResult;
  onClose: () => void;
}

const getBiasColorClass = (score: number) => {
  if (score < 2) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score < 4) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
};

const getFramingLabel = (score: number) => {
  if (score <= 1) return 'None';
  if (score < 3) return 'Mild';
  if (score < 4) return 'Moderate';
  if (score < 5) return 'Strong';
  return 'Extreme';
};

const getVerdict = (framingScore: number, sensationalismScore: number) => {
  const avg = (framingScore + (sensationalismScore || 0)) / 2;
  if (avg <= 1.5) return { label: 'Largely Neutral', color: 'bg-emerald-500', text: 'text-emerald-700', pct: 15 };
  if (avg <= 2.5) return { label: 'Mild Bias',       color: 'bg-yellow-400',  text: 'text-yellow-700', pct: 35 };
  if (avg <= 3.5) return { label: 'Moderate Bias',   color: 'bg-orange-400',  text: 'text-orange-700', pct: 60 };
  if (avg <= 4.5) return { label: 'Strong Bias',     color: 'bg-rose-500',    text: 'text-rose-700',   pct: 80 };
  return             { label: 'Extreme Bias',         color: 'bg-red-700',     text: 'text-red-800',    pct: 100 };
};

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [showHighlighted, setShowHighlighted] = useState(false);
  const [selectedBias, setSelectedBias]       = useState<string | null>(null);

  const alignmentScore      = result.biasScore ?? 0;
  const framingScore        = result.framingScore ?? 1;
  const confidence          = result.confidence ?? 0;
  const sensationalismScore = result.sensationalismScore ?? 0;
  const strengths: string[] = (result as any).strengths ?? [];

  const phrases = (result.biasedPhrases ?? []).map((p: any) =>
    typeof p === 'string' ? { phrase: p, reason: '', suggestedAlternative: '' } : p
  );

  const verdict = getVerdict(framingScore, sensationalismScore);

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
        <button onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          ✕
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-10">

        {/* ── 1. SYSTEMATIC OVERVIEW ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="px-6 pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Overall Assessment</h3>
          </div>

          {/* Verdict bar */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${verdict.text}`}>{verdict.label}</span>
              {confidence > 0 && <span className="text-xs text-gray-400">{confidence}% confidence</span>}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${verdict.color} transition-all duration-700 rounded-full`}
                   style={{ width: `${verdict.pct}%` }} />
            </div>
          </div>

          {/* 4-metric grid */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 text-center">
            {[
              { label: 'Framing',        value: `${framingScore}/5`,        sub: getFramingLabel(framingScore),        hexColor: null, scoreColor: framingScore >= 4 ? '#e11d48' : framingScore >= 3 ? '#d97706' : '#059669' },
              { label: 'Direction',      value: result.category ?? 'Center', sub: alignmentScore === 0 ? 'Neutral' : alignmentScore > 0 ? 'Right lean' : 'Left lean', hexColor: BIAS_COLORS[result.category as keyof typeof BIAS_COLORS] ?? '#6b7280', scoreColor: null },
              { label: 'Sensationalism', value: `${sensationalismScore}/5`,  sub: getFramingLabel(sensationalismScore), hexColor: null, scoreColor: sensationalismScore >= 4 ? '#e11d48' : sensationalismScore >= 3 ? '#d97706' : '#059669' },
              { label: 'Flagged',        value: `${phrases.length}`,         sub: phrases.length === 1 ? 'phrase' : 'phrases', hexColor: null, scoreColor: phrases.length >= 5 ? '#e11d48' : phrases.length >= 2 ? '#d97706' : '#059669' },
            ].map((m, i) => (
              <div key={i} className="px-3 py-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{m.label}</div>
                <div className="text-base font-black leading-tight"
                     style={{ color: m.hexColor ?? m.scoreColor ?? '#111' }}>
                  {m.value}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">AI Summary</div>
            <p className="text-blue-900 text-sm italic leading-relaxed">"{result.summary}"</p>
          </div>
        </div>

        {/* ── 2. FLAGGED PHRASES ──────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Flagged Phrases</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {phrases.length} found
            </span>
          </div>

          {phrases.length > 0 ? (
            <div className="space-y-3">
              {phrases.map((phrase, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Phrase row */}
                  <div className="px-5 pt-4 pb-3 border-b border-gray-50 flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Biased phrase</div>
                      <div className="font-semibold text-gray-900 text-sm break-words">"{phrase.phrase}"</div>
                    </div>
                  </div>

                  {/* Why + alternative */}
                  <div className="px-5 py-3 space-y-2.5">
                    {phrase.reason && (
                      <div className="flex items-start gap-2">
                        <i className="fas fa-info-circle text-gray-300 text-xs mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-500 leading-relaxed">{phrase.reason}</p>
                      </div>
                    )}
                    {phrase.suggestedAlternative && (
                      <div className="flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                        <i className="fas fa-arrow-right text-emerald-500 text-xs mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                            More neutral alternative
                          </span>
                          <span className="text-xs text-emerald-800 font-medium">
                            "{phrase.suggestedAlternative}"
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              No significantly biased linguistic framing detected.
            </div>
          )}
        </div>

        {/* ── 3. STRENGTHS / WELL-WRITTEN PHRASES ────────────────── */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Well-Written Phrases</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
                {strengths.length} found
              </span>
            </div>
            <div className="space-y-2">
              {strengths.map((s: string, idx: number) => (
                <div key={idx}
                  className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3 flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-500 text-sm mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                      Neutral / balanced language
                    </div>
                    <span className="text-sm text-emerald-900 font-medium">"{s}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. ALIGNMENT + FRAMING DETAIL ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-3xl border shadow-sm ${getBiasColorClass(framingScore)}`}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Framing Intensity</span>
              {confidence > 0 && <span className="text-xs opacity-60 font-medium">{confidence}% confidence</span>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-3xl font-black">{framingScore}/5</div>
              <div className="text-sm font-bold uppercase tracking-widest">{getFramingLabel(framingScore)}</div>
            </div>
            <div className="mt-6 h-2 bg-white/40 rounded-full overflow-hidden">
              <div className="h-full bg-current transition-all duration-700"
                   style={{ width: `${(framingScore / 5) * 100}%` }} />
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Political Alignment</span>
            <div className="mt-4"
              style={{ color: BIAS_COLORS[result.category as keyof typeof BIAS_COLORS] ?? '#6b7280' }}>
              <div className="text-2xl font-black italic uppercase tracking-tight">{result.category}</div>
            </div>
            <div className="mt-6">
              <div className="relative h-3 rounded-full shadow-inner overflow-visible">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-700 via-gray-200 to-red-700" />
                <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                     style={{ left: `clamp(0px, calc(${((alignmentScore + 100) / 200) * 100}% - 12px), calc(100% - 24px))` }}>
                  <div className="w-6 h-6 bg-white border-4 border-gray-900 rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-black uppercase text-gray-400">
                <span>Far Left</span><span>Center</span><span>Far Right</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. HIGHLIGHTED TEXT ─────────────────────────────────── */}
        {result.highlightedText && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Article Text</h3>
              <button onClick={() => setShowHighlighted(v => !v)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                {showHighlighted ? 'Hide' : 'Show highlighted text'}
              </button>
            </div>
            {showHighlighted && (
              <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-6 border border-gray-100
                             [&_mark]:bg-yellow-200 [&_mark]:text-gray-900 [&_mark]:rounded [&_mark]:px-0.5 [&_mark]:cursor-help"
                   dangerouslySetInnerHTML={{ __html: result.highlightedText }} />
            )}
          </div>
        )}

        {/* ── 6. BIAS TYPES REFERENCE ─────────────────────────────── */}
        {(() => {
          const TYPE_TO_KEY: Record<string, string> = {
            'Political Framing Bias': 'political_framing',
            'Sensationalism':         'sensationalism',
            'Source Selection Bias':  'source_bias',
          };
          const detectedKeys = new Set<string>(
            (result.detailedBiases ?? []).map((d: any) => TYPE_TO_KEY[d.type]).filter(Boolean)
          );
          if ((result.biasScore ?? 0) !== 0) detectedKeys.add('political_direction');

          const articlePhrases: Record<string, any[]> = {};
          (result.detailedBiases ?? []).forEach((d: any) => {
            const key = TYPE_TO_KEY[d.type];
            if (key && d.phrases?.length > 0) articlePhrases[key] = d.phrases;
          });
          if (detectedKeys.has('political_direction') && (result.biasedPhrases ?? []).length > 0) {
            articlePhrases['political_direction'] = (result.biasedPhrases as any[]).map(p => ({
              phrase: typeof p === 'string' ? p : p.phrase,
              explanation: typeof p === 'string' ? '' : p.reason,
              neutral_alternative: typeof p === 'string' ? '' : p.suggestedAlternative,
            }));
          }

          const visibleBiases = BIAS_INFO.filter(b => detectedKeys.has(b.key));
          if (visibleBiases.length === 0) return null;

          return (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">About the Bias Types Detected</h3>
              <p className="text-xs text-gray-400 mb-4">
                {visibleBiases.length} bias type{visibleBiases.length > 1 ? 's' : ''} found — click to learn more
              </p>
              <div className="space-y-3">
                {visibleBiases.map(bias => (
                  <div key={bias.key} className={`rounded-2xl border transition-all duration-200 overflow-hidden
                    ${selectedBias === bias.key ? `${bias.bg} ${bias.border}` : 'bg-gray-50 border-gray-200'}`}>
                    <button onClick={() => setSelectedBias(selectedBias === bias.key ? null : bias.key)}
                      className="w-full text-left p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
                          ${selectedBias === bias.key ? bias.tag : 'bg-white border border-gray-200 text-gray-500'}`}>
                          <i className={`fas ${bias.icon}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{bias.name}</div>
                          <div className="text-xs text-gray-500">{bias.short}</div>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200
                        ${selectedBias === bias.key ? 'rotate-180' : ''}`} />
                    </button>

                    {selectedBias === bias.key && (
                      <div className="px-5 pb-5 space-y-4">
                        <p className={`text-sm leading-relaxed ${bias.color}`}>{bias.desc}</p>
                        {(() => {
                          const real = articlePhrases[bias.key];
                          if (real?.length > 0) return (
                            <div className="space-y-3">
                              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">From this article</div>
                              {real.slice(0, 3).map((p: any, i: number) => (
                                <div key={i} className={`rounded-xl border p-3 ${bias.bg} ${bias.border}`}>
                                  <div className="font-semibold text-gray-900 italic text-sm mb-1">"{p.phrase}"</div>
                                  {p.explanation && <div className="text-xs text-gray-500 mb-1">{p.explanation}</div>}
                                  {p.neutral_alternative && <div className="text-xs text-emerald-600 font-medium">→ {p.neutral_alternative}</div>}
                                </div>
                              ))}
                            </div>
                          );
                          return (
                            <div className="space-y-2">
                              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Generic example</div>
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <div className="text-xs font-bold text-red-500 uppercase mb-1">Biased</div>
                                <p className="text-sm text-red-900 italic">{bias.biased}</p>
                              </div>
                              <div className="flex justify-center"><i className="fas fa-arrow-down text-gray-300 text-xs" /></div>
                              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <div className="text-xs font-bold text-green-600 uppercase mb-1">Neutral alternative</div>
                                <p className="text-sm text-green-900 italic">{bias.neutral}</p>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{bias.explanation}</p>
                            </div>
                          );
                        })()}

                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default ResultView;