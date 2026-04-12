import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

const BIAS_META: Record<string, { short: string; desc: string }> = {
  framing:         { short: 'Word choices favouring one political side', desc: 'Framing bias occurs when language subtly favours one perspective without stating anything factually false. The same event can produce very different reader reactions depending on which words are chosen.' },
  negativity:      { short: 'Disproportionate focus on negative outcomes', desc: 'Negativity bias occurs when an article consistently emphasises threats, failures, or bad outcomes — even when positive or neutral information is equally relevant.' },
  confirmation:    { short: 'Selective evidence confirming a preset narrative', desc: 'Confirmation bias in journalism means structuring an article around a conclusion and cherry-picking evidence that supports it, while ignoring contradicting information.' },
  anchoring:       { short: 'An early claim that distorts how the rest reads', desc: 'Anchoring bias occurs when an initial figure, claim, or framing disproportionately influences how the reader interprets everything that follows.' },
  attribution:     { short: 'Different explanations for similar behaviour', desc: 'Attribution bias applies different standards of explanation to different groups — attributing the same behaviour to character in one group and circumstance in another.' },
  selection:       { short: 'Which stories and sources are chosen', desc: 'Selection bias is about which facts, sources, and stories are included. Coverage decisions shape the narrative as much as the words used.' },
  sensationalism:  { short: 'Exaggerated language to provoke emotion', desc: 'Sensationalism uses dramatic or emotionally charged language to attract attention rather than inform.' },
  false_balance:   { short: 'Presenting fringe views as equally valid', desc: 'False balance gives disproportionate weight to a minority position to appear neutral.' },
  omission:        { short: 'Relevant context that is missing', desc: 'Omission bias occurs when an article leaves out facts that would materially change the reader\'s understanding.' },
  ingroup_outgroup:{ short: 'Us vs them framing between groups', desc: 'In-group/out-group bias frames one group as relatable while presenting another as threatening.' },
};

const severityLabel = (s: number) => s <= 2 ? 'Mild' : s <= 3 ? 'Moderate' : s <= 4 ? 'Strong' : 'Extreme';
const severityColor = (s: number) => s <= 2 ? '#16a34a' : s <= 3 ? '#d97706' : '#dc2626';

const getVerdict = (biases: any[]) => {
  if (!biases.length) return { label: 'No Significant Bias Detected', pct: 4, color: '#16a34a' };
  // Use the highest-scoring detected bias as the primary signal
  const max = Math.max(...biases.map((b: any) => b.score || 0));
  if (max <= 2) return { label: 'Mild Bias Detected',     pct: 25,  color: '#16a34a' };
  if (max <= 3) return { label: 'Moderate Bias Detected', pct: 52,  color: '#d97706' };
  if (max <= 4) return { label: 'Strong Bias Detected',   pct: 78,  color: '#dc2626' };
  return             { label: 'Extreme Bias Detected',    pct: 100, color: '#7f1d1d' };
};

interface ResultViewProps {
  result: AnalysisResult;
  onClose: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [expanded,        setExpanded]        = useState<string | null>(null);
  const [showHighlighted, setShowHighlighted] = useState(false);

  const alignmentScore        = result.biasScore ?? 0;
  const confidence            = result.confidence ?? 0;
  const strengths: string[]   = (result as any).strengths ?? [];
  const detectedBiases: any[] = result.detailedBiases ?? [];
  const verdict               = getVerdict(detectedBiases);

  const serif = { fontFamily: "'Georgia', 'Times New Roman', serif" };

  return (
    <div className="space-y-0">

      {/* ── Article header ──────────────────────────────────────── */}
      <div className="border-b-2 border-[#1a1a1a] pb-4 mb-6 flex justify-between items-start gap-4">
        <div>
          <h2 style={serif} className="text-xl font-bold text-[#1a1a1a] leading-snug">{result.title}</h2>
          <p style={serif} className="text-[12px] text-[#888] italic mt-1">
            {(result as any).source && `${(result as any).source} · `}
            {new Date(result.timestamp).toLocaleString('en-GB')}
            {(result as any).modelUsed && ` · ${(result as any).modelUsed}`}
          </p>
        </div>
        <button onClick={onClose} className="text-[#aaa] hover:text-[#1a1a1a] transition-colors text-sm shrink-0">✕</button>
      </div>

      {/* ── Verdict ─────────────────────────────────────────────── */}
      <div className="mb-6 border border-[#e8e4de] bg-white p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span style={serif} className="text-xl font-bold text-[#1a1a1a]">{verdict.label}</span>
          {confidence > 0 && (
            <span style={serif} className="text-[11px] text-[#999] italic">{confidence}% confidence</span>
          )}
        </div>
        <div className="h-1.5 bg-[#eee]">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${verdict.pct}%`, backgroundColor: verdict.color }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p style={serif} className="text-[11px] text-[#999] italic">
            {detectedBiases.length === 0
              ? 'No significant bias detected across all 10 categories'
              : `${detectedBiases.length} of 10 bias categories triggered`}
          </p>
          {detectedBiases.length > 0 && (
            <p style={serif} className="text-[11px] text-[#999] italic">
              Highest: <span style={{ color: severityColor(Math.max(...detectedBiases.map((b:any) => b.score))) }}>
                {severityLabel(Math.max(...detectedBiases.map((b:any) => b.score)))}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Political alignment ─────────────────────────────────── */}
      <div className="mb-6 border border-[#e8e4de] p-4 bg-white">
        <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
          Political Alignment
        </p>
        <div className="flex items-center gap-3">
          <span style={serif} className="text-[11px] text-[#888] w-12 text-right italic">Far Left</span>
          <div className="relative flex-1 h-1.5 bg-[#eee]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af] via-[#e5e7eb] to-[#b91c1c]" />
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `clamp(0px, calc(${((alignmentScore + 100) / 200) * 100}% - 7px), calc(100% - 14px))` }}
            >
              <div className="w-3.5 h-3.5 bg-white border-2 border-[#1a1a1a] rounded-full" />
            </div>
          </div>
          <span style={serif} className="text-[11px] text-[#888] w-12 italic">Far Right</span>
        </div>
        <p style={serif} className="text-center text-[12px] text-[#555] mt-2 font-semibold">
          {result.category ?? 'Centre'}
        </p>
      </div>

      {/* ── Detected biases ─────────────────────────────────────── */}
      {detectedBiases.length > 0 && (
        <div className="mb-6">
          <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
            Detected Biases
          </p>
          <div className="border border-[#e8e4de] divide-y divide-[#e8e4de] bg-white">
            {[...detectedBiases].sort((a, b) => (b.score || 0) - (a.score || 0)).map((bias: any) => {
              const meta   = BIAS_META[bias.key] ?? { short: '', desc: '' };
              const isOpen = expanded === bias.key;
              const evidence = bias.evidence ?? [];

              return (
                <div key={bias.key}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : bias.key)}
                    className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-[#F8F6F1] transition-colors"
                  >
                    {/* Score bar */}
                    <div className="w-16 shrink-0">
                      <div className="h-1 bg-[#eee]">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${(bias.score / 5) * 100}%`,
                            backgroundColor: severityColor(bias.score)
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span style={serif} className="text-sm text-[#1a1a1a] font-semibold">{bias.type}</span>
                      {meta.short && (
                        <p style={serif} className="text-[11px] text-[#999] italic mt-0.5">{meta.short}</p>
                      )}
                    </div>
                    <span style={serif} className="text-xs italic shrink-0"
                      style={{ color: severityColor(bias.score) }}>
                      {severityLabel(bias.score)}
                    </span>
                    <i className={`fas fa-chevron-down text-[10px] text-[#bbb] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-[#F8F6F1] border-t border-[#e8e4de] space-y-3">
                      {bias.reasoning && (
                        <p style={serif} className="text-[12px] text-[#555] italic pt-3">"{bias.reasoning}"</p>
                      )}
                      {meta.desc && (
                        <p style={serif} className="text-[12px] text-[#888]">{meta.desc}</p>
                      )}
                      {evidence.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p style={serif} className="text-[10px] font-bold uppercase tracking-widest text-[#aaa]">
                            Flagged phrases
                          </p>
                          {evidence.slice(0, 4).map((e: any, i: number) => (
                            <div key={i} className="bg-white border border-[#e8e4de] p-3">
                              <p style={serif} className="text-[12px] font-semibold text-[#1a1a1a] italic mb-1">
                                "{e.phrase}"
                              </p>
                              {e.explanation && (
                                <p style={serif} className="text-[11px] text-[#888] mb-1">{e.explanation}</p>
                              )}
                              {e.neutral_alternative && (
                                <p style={serif} className="text-[11px] text-[#16a34a]">→ {e.neutral_alternative}</p>
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
        <div className="mb-6">
          <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
            Well-Written Phrases
          </p>
          <div className="space-y-2">
            {strengths.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#16a34a] text-[11px] mt-0.5 shrink-0">✓</span>
                <span style={serif} className="text-[12px] text-[#555] italic">"{s}"</span>
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
            style={serif}
            className="text-[12px] text-[#888] italic hover:text-[#1a1a1a] transition-colors underline underline-offset-2"
          >
            {showHighlighted ? 'Hide article text' : 'Show highlighted article text'}
          </button>
          {showHighlighted && (
            <div style={serif} className="mt-3 border border-[#e8e4de] bg-white p-6">
              <style>{`
                .highlighted-article mark {
                  background-color: #fef08a;
                  color: #1a1a1a;
                  padding: 0 2px;
                  cursor: help;
                  border-radius: 2px;
                }
              `}</style>
              <div
                className="highlighted-article text-sm text-[#333] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: result.highlightedText }}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ResultView;