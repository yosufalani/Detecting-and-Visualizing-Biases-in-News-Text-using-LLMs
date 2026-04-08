import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

// ── Bias metadata for all 10 types ────────────────────────────────────────
const BIAS_META: Record<string, { icon: string; short: string; desc: string }> = {
  framing: {
    icon: 'fa-balance-scale',
    short: 'Word choices that favour one political side',
    desc: 'Framing bias occurs when language subtly favours one perspective without stating anything factually false. The same event can produce very different reader reactions depending on which words are chosen.',
  },
  negativity: {
    icon: 'fa-minus-circle',
    short: 'Disproportionate focus on negative outcomes',
    desc: 'Negativity bias occurs when an article consistently emphasises threats, failures, or bad outcomes — even when positive or neutral information is equally relevant.',
  },
  confirmation: {
    icon: 'fa-check-circle',
    short: 'Selective evidence that confirms a pre-set narrative',
    desc: 'Confirmation bias in journalism means structuring an article around a conclusion and cherry-picking evidence that supports it, while ignoring contradicting information.',
  },
  anchoring: {
    icon: 'fa-anchor',
    short: 'An early claim that distorts how the rest reads',
    desc: 'Anchoring bias occurs when an initial figure, claim, or framing disproportionately influences how the reader interprets everything that follows.',
  },
  attribution: {
    icon: 'fa-user-tag',
    short: 'Different explanations applied to similar behaviour',
    desc: 'Attribution bias applies different standards of explanation to different groups — attributing the same behaviour to character in one group and circumstance in another.',
  },
  selection: {
    icon: 'fa-filter',
    short: 'Which stories and sources are chosen to cover',
    desc: 'Selection bias is about which facts, sources, and stories are included. Coverage decisions shape the narrative as much as the words used.',
  },
  sensationalism: {
    icon: 'fa-fire',
    short: 'Exaggerated language designed to provoke emotion',
    desc: 'Sensationalism uses dramatic or emotionally charged language to attract attention rather than inform. It makes routine events sound extraordinary.',
  },
  false_balance: {
    icon: 'fa-exchange-alt',
    short: 'Presenting fringe views as equally valid',
    desc: 'False balance gives disproportionate weight to a minority position to appear neutral — implying two sides are equally supported when they are not.',
  },
  omission: {
    icon: 'fa-eye-slash',
    short: 'Relevant context that is missing',
    desc: 'Omission bias occurs when an article leaves out facts that would materially change the reader\'s understanding — whether deliberately or through oversight.',
  },
  ingroup_outgroup: {
    icon: 'fa-users',
    short: 'Us vs them framing between groups',
    desc: 'In-group/out-group bias frames one group as relatable and sympathetic while presenting another as threatening or alien — often through pronoun choice, descriptors, and sourcing.',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const scoreColor = (score: number) => {
  if (score <= 2) return 'text-emerald-600';
  if (score <= 3) return 'text-amber-600';
  return 'text-rose-600';
};

const scoreBar = (score: number) => {
  if (score <= 2) return 'bg-emerald-400';
  if (score <= 3) return 'bg-amber-400';
  return 'bg-rose-500';
};

const severityLabel = (score: number) => {
  if (score <= 1) return 'None';
  if (score <= 2) return 'Mild';
  if (score <= 3) return 'Moderate';
  if (score <= 4) return 'Strong';
  return 'Extreme';
};

const getVerdict = (biases: any[]) => {
  if (!biases.length) return { label: 'Largely Neutral', color: 'bg-emerald-500', pct: 10 };
  const avg = biases.reduce((s: number, b: any) => s + (b.score || 0), 0) / biases.length;
  if (avg <= 1.5) return { label: 'Largely Neutral', color: 'bg-emerald-500', pct: 15 };
  if (avg <= 2.5) return { label: 'Mild Bias',       color: 'bg-yellow-400',  pct: 35 };
  if (avg <= 3.5) return { label: 'Moderate Bias',   color: 'bg-orange-400',  pct: 60 };
  if (avg <= 4.5) return { label: 'Strong Bias',     color: 'bg-rose-500',    pct: 80 };
  return             { label: 'Extreme Bias',         color: 'bg-red-700',     pct: 100 };
};

// ── Component ──────────────────────────────────────────────────────────────
interface ResultViewProps {
  result: AnalysisResult;
  onClose: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [expanded,        setExpanded]        = useState<string | null>(null);
  const [showHighlighted, setShowHighlighted] = useState(false);

  const alignmentScore          = result.biasScore ?? 0;
  const confidence              = result.confidence ?? 0;
  const strengths: string[]     = (result as any).strengths ?? [];
  const detectedBiases: any[]   = (result.detailedBiases ?? []);
  const verdict                 = getVerdict(detectedBiases);

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900 leading-snug">{result.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(result.timestamp).toLocaleString()}
            {(result as any).modelUsed && ` · ${(result as any).modelUsed}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm shrink-0 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* ── Overall verdict ─────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{verdict.label}</span>
          {confidence > 0 && (
            <span className="text-xs text-gray-400">{confidence}% confidence</span>
          )}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${verdict.color} rounded-full transition-all duration-700`}
            style={{ width: `${verdict.pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400">
          {detectedBiases.length === 0
            ? 'No significant bias detected'
            : `${detectedBiases.length} bias type${detectedBiases.length > 1 ? 's' : ''} detected`
          }
        </p>
      </div>

      {/* ── Political direction ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Political Alignment</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-14 text-right">Far Left</span>
          <div className="relative flex-1 h-2 rounded-full overflow-visible">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-gray-200 to-red-500" />
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `clamp(0px, calc(${((alignmentScore + 100) / 200) * 100}% - 8px), calc(100% - 16px))` }}
            >
              <div className="w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow" />
            </div>
          </div>
          <span className="text-xs text-gray-400 w-14">Far Right</span>
        </div>
        <p className="text-xs text-center text-gray-500 mt-1 font-medium">
          {result.category ?? 'Center'}
        </p>
      </div>

      {/* ── Detected biases ─────────────────────────────────────── */}
      {detectedBiases.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3">Detected Biases</p>
          <div className="space-y-1.5">
            {detectedBiases.map((bias: any) => {
              const meta     = BIAS_META[bias.key] ?? { icon: 'fa-exclamation-circle', short: '', desc: '' };
              const isOpen   = expanded === bias.key;
              const evidence = bias.evidence ?? [];

              return (
                <div key={bias.key} className="border border-gray-100 rounded-xl overflow-hidden">

                  <button
                    onClick={() => setExpanded(isOpen ? null : bias.key)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-20 shrink-0">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${scoreBar(bias.score)} rounded-full`}
                          style={{ width: `${(bias.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="flex-1 text-sm text-gray-800">{bias.type}</span>
                    <span className={`text-xs font-semibold shrink-0 ${scoreColor(bias.score)}`}>
                      {severityLabel(bias.score)}
                    </span>
                    <i className={`fas fa-chevron-down text-xs text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                      {bias.reasoning && (
                        <p className="text-xs text-gray-500 pt-3 italic">"{bias.reasoning}"</p>
                      )}
                      {meta.desc && (
                        <p className="text-xs text-gray-400">{meta.desc}</p>
                      )}
                      {evidence.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Flagged phrases</p>
                          {evidence.slice(0, 4).map((e: any, i: number) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-800 italic mb-1">"{e.phrase}"</p>
                              {e.explanation && (
                                <p className="text-[11px] text-gray-500 mb-1">{e.explanation}</p>
                              )}
                              {e.neutral_alternative && (
                                <p className="text-[11px] text-emerald-600 font-medium">→ {e.neutral_alternative}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Writing strengths ───────────────────────────────────── */}
      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-3">Well-Written Phrases</p>
          <div className="space-y-2">
            {strengths.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span className="italic">"{s}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Highlighted text ────────────────────────────────────── */}
      {result.highlightedText && (
        <div>
          <button
            onClick={() => setShowHighlighted(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showHighlighted ? 'Hide article text' : 'Show highlighted article text'}
          </button>
          {showHighlighted && (
            <div
              className="mt-3 text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-5 border border-gray-100
                         [&_mark]:bg-yellow-200 [&_mark]:text-gray-900 [&_mark]:rounded [&_mark]:px-0.5 [&_mark]:cursor-help"
              dangerouslySetInnerHTML={{ __html: result.highlightedText }}
            />
          )}
        </div>
      )}

    </div>
  );
};

export default ResultView;