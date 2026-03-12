import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

// ── Bias type definitions shown at the bottom of every result
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

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [showHighlighted, setShowHighlighted] = useState(false);
  const [selectedBias, setSelectedBias] = useState<string | null>(null);

  const alignmentScore = result.biasScore ?? 0;
  const framingScore   = result.framingScore ?? 1;
  const confidence     = result.confidence ?? 0;

  // Normalise biasedPhrases — handles both old string[] format and new object[] format
  const phrases = (result.biasedPhrases ?? []).map((p: any) =>
    typeof p === 'string'
      ? { phrase: p, reason: '', suggestedAlternative: '' }
      : p
  );

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

      <div className="relative z-10 flex-1 overflow-y-auto p-8 space-y-10">

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Framing Intensity */}
          <div className={`p-6 rounded-3xl border shadow-sm ${getBiasColorClass(framingScore)}`}>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                Framing Intensity
              </span>
              {confidence > 0 && (
                <span className="text-xs opacity-60 font-medium">
                  {confidence}% confidence
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-3xl font-black">{framingScore}/5</div>
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

          {/* Political Alignment */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Political Alignment
            </span>

            <div className="mt-4 flex items-center justify-between">
              <div
                className="text-2xl font-black italic uppercase tracking-tight"
                style={{ color: BIAS_COLORS[result.category as keyof typeof BIAS_COLORS] ?? '#6b7280' }}
              >
                {result.category}
              </div>
            </div>

            {/* Alignment Slider */}
            <div className="mt-6">
              <div className="relative h-3 rounded-full overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-gray-200 to-red-700" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                  style={{ left: `calc(${((alignmentScore + 100) / 200) * 100}% - 12px)` }}
                >
                  <div className="w-6 h-6 bg-white border-4 border-gray-900 rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-black uppercase text-gray-400">
                <span>Far Left</span>
                <span>Center</span>
                <span>Far Right</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biased Phrases */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Framing &amp; Biased Phrasing
          </h3>

          {phrases.length > 0 ? (
            <div className="space-y-4">
              {phrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  {/* The flagged phrase */}
                  <div className="font-bold text-gray-900 italic mb-2">
                    "{phrase.phrase}"
                  </div>

                  {/* Why it's biased */}
                  {phrase.reason && (
                    <div className="text-sm text-gray-500 mb-2">
                      {phrase.reason}
                    </div>
                  )}

                  {/* Neutral alternative */}
                  {phrase.suggestedAlternative && (
                    <div className="text-sm text-emerald-600 font-medium">
                      → {phrase.suggestedAlternative}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              No significantly biased linguistic framing detected.
            </div>
          )}
        </div>

        {/* Highlighted Article Text */}
        {result.highlightedText && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Article Text</h3>
              <button
                onClick={() => setShowHighlighted(v => !v)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showHighlighted ? 'Hide' : 'Show highlighted text'}
              </button>
            </div>

            {showHighlighted && (
              <div
                className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-2xl p-6 border border-gray-100
                           [&_mark]:bg-yellow-200 [&_mark]:text-gray-900 [&_mark]:rounded [&_mark]:px-0.5
                           [&_mark]:cursor-help"
                dangerouslySetInnerHTML={{ __html: result.highlightedText }}
              />
            )}
          </div>
        )}

        {/* ── Bias Types Reference — only show types actually detected in this article */}
        {(() => {
          // Map detailedBiases type names back to BIAS_INFO keys
          const TYPE_TO_KEY: Record<string, string> = {
            'Political Framing Bias': 'political_framing',
            'Sensationalism':         'sensationalism',
            'Source Selection Bias':  'source_bias',
          };
          const detectedKeys = new Set<string>(
            (result.detailedBiases ?? [])
              .map((d: any) => TYPE_TO_KEY[d.type])
              .filter(Boolean)
          );
          // Show direction only if the slider is not sitting at center
          if ((result.biasScore ?? 0) !== 0) detectedKeys.add('political_direction');

          // Build a lookup: bias key → real phrases from this article
          const KEY_TO_TYPE: Record<string, string> = {
            'political_framing': 'Political Framing Bias',
            'sensationalism':    'Sensationalism',
            'source_bias':       'Source Selection Bias',
          };
          const articlePhrases: Record<string, any[]> = {};
          (result.detailedBiases ?? []).forEach((d: any) => {
            const key = TYPE_TO_KEY[d.type];
            if (key && d.phrases?.length > 0) articlePhrases[key] = d.phrases;
          });
          // political_direction has no detailedBiases entry — use biasedPhrases (same evidence)
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
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                About the Bias Types Detected
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {visibleBiases.length} bias type{visibleBiases.length > 1 ? 's' : ''} found in this article — click to learn more
              </p>
              <div className="space-y-3">
                {visibleBiases.map(bias => (
                  <div key={bias.key} className={`rounded-2xl border transition-all duration-200 overflow-hidden
                    ${selectedBias === bias.key ? `${bias.bg} ${bias.border}` : 'bg-gray-50 border-gray-200'}`}>

                    <button
                      onClick={() => setSelectedBias(selectedBias === bias.key ? null : bias.key)}
                      className="w-full text-left p-4 flex items-center justify-between"
                    >
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

                        {/* Real examples from the article */}
                        {(() => {
                          const real = articlePhrases[bias.key];
                          if (real && real.length > 0) {
                            return (
                              <div className="space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                  From this article
                                </div>
                                {real.slice(0, 3).map((p: any, i: number) => (
                                  <div key={i} className={`rounded-xl border p-3 ${bias.bg} ${bias.border}`}>
                                    <div className="font-semibold text-gray-900 italic text-sm mb-1">
                                      "{p.phrase}"
                                    </div>
                                    {p.explanation && (
                                      <div className="text-xs text-gray-500 mb-1">{p.explanation}</div>
                                    )}
                                    {p.neutral_alternative && (
                                      <div className="text-xs text-emerald-600 font-medium">
                                        → {p.neutral_alternative}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          // Fallback to generic example if no real phrases available
                          return (
                            <div className="space-y-2">
                              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Generic example</div>
                              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Biased</div>
                                <p className="text-sm text-red-900 italic">{bias.biased}</p>
                              </div>
                              <div className="flex justify-center">
                                <i className="fas fa-arrow-down text-gray-300 text-xs" />
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Neutral alternative</div>
                                <p className="text-sm text-green-900 italic">{bias.neutral}</p>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{bias.explanation}</p>
                            </div>
                          );
                        })()}

                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">What to look for</div>
                          <ul className="space-y-1">
                            {bias.signals.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <i className="fas fa-circle text-[4px] mt-1.5 shrink-0 text-gray-400" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
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