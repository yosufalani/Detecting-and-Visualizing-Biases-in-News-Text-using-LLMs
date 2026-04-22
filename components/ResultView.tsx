import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';

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
  const max = Math.max(...biases.map((b: any) => b.score || 0));
  if (max <= 2) return { label: 'Mild Bias Detected',     pct: 25,  color: '#16a34a' };
  if (max <= 3) return { label: 'Moderate Bias Detected', pct: 52,  color: '#d97706' };
  if (max <= 4) return { label: 'Strong Bias Detected',   pct: 78,  color: '#dc2626' };
  return             { label: 'Extreme Bias Detected',    pct: 100, color: '#7f1d1d' };
};

interface Tooltip {
  x: number;
  y: number;
  phrase: string;
  explanation: string;
  neutral: string;
  biasType: string;
}

interface ResultViewProps {
  result: AnalysisResult;
  onClose: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ result, onClose }) => {
  const [expanded,          setExpanded]          = useState<string | null>(null);
  const [tooltip,           setTooltip]           = useState<Tooltip | null>(null);
  const [showHighlighted,   setShowHighlighted]   = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const articleRef                            = useRef<HTMLDivElement>(null);
  const tooltipRef                            = useRef<HTMLDivElement>(null);

  const alignmentScore        = result.biasScore ?? 0;
  const confidence            = result.confidence ?? 0;
  const strengths: string[]   = (result as any).strengths ?? [];
  const detectedBiases: any[] = result.detailedBiases ?? [];
  const verdict               = getVerdict(detectedBiases);

  const serif = { fontFamily: "'Georgia', 'Times New Roman', serif" };

  // Build a lookup: phrase (lowercased) → { explanation, neutral, biasType }
  const phraseMap = useRef<Map<string, { explanation: string; neutral: string; biasType: string }>>(new Map());

  useEffect(() => {
    phraseMap.current.clear();
    detectedBiases.forEach((bias: any) => {
      (bias.evidence ?? []).forEach((e: any) => {
        if (e.phrase) {
          phraseMap.current.set(e.phrase.toLowerCase().trim(), {
            explanation: e.explanation ?? '',
            neutral:     e.neutral_alternative ?? '',
            biasType:    bias.type ?? '',
          });
        }
      });
    });
  }, [detectedBiases]);

  // Click handler on the article container — delegate to <mark> elements
  const handleArticleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'MARK') {
      setTooltip(null);
      return;
    }

    const phrase     = target.getAttribute('data-phrase') || target.textContent || '';
    const lookup     = phraseMap.current.get(phrase.toLowerCase().trim());
    const rect       = target.getBoundingClientRect();
    const container  = articleRef.current!.getBoundingClientRect();

    // Position tooltip below the mark, clamped inside the container
    const rawLeft = rect.left - container.left;
    const clampedLeft = Math.max(0, Math.min(rawLeft, container.width - 320));

    setTooltip({
      x:           clampedLeft,
      y:           rect.bottom - container.top + 6,
      phrase:      phrase,
      explanation: lookup?.explanation ?? target.getAttribute('data-explanation') ?? '',
      neutral:     lookup?.neutral     ?? '',
      biasType:    lookup?.biasType    ?? '',
    });
  };

  // Close tooltip on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        articleRef.current  && !articleRef.current.contains(e.target as Node)
      ) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Inject data-phrase onto every <mark> after HTML is set
  // (the backend sets data-explanation; we also want data-phrase for the lookup)
  const prepareHtml = (html: string) => {
    // Replace <mark ...> to add data-phrase equal to the inner text content
    // We do a simple regex since the backend wraps single phrases
    return html.replace(
      /<mark([^>]*)>([\s\S]*?)<\/mark>/g,
      (_match, attrs, inner) => {
        const text = inner.replace(/<[^>]+>/g, '').trim();
        return `<mark${attrs} data-phrase="${text.replace(/"/g, '&quot;')}">${inner}</mark>`;
      }
    );
  };

  return (
    <div className="space-y-0">

      {/* ── Article header ──────────────────────────────────────── */}
      <div className="border-b-2 border-[#1a1a1a] pb-4 mb-6 flex justify-between items-start gap-4">
        <div>
          <h2 style={serif} className="text-xl font-bold text-[#1a1a1a] leading-snug">{result.title}</h2>
          <p style={serif} className="text-[12px] text-[#888] italic mt-1">
            {(result as any).source && `${(result as any).source} · `}
            {new Date(result.timestamp).toLocaleString('en-GB')}
          </p>
          {(result as any).modelUsed && (
            <span style={serif} className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              (result as any).modelUsed === 'Claude'
                ? 'bg-[#f0f4ff] text-[#2E5FA3] border border-[#2E5FA3]'
                : 'bg-[#fff8f0] text-[#d97706] border border-[#d97706]'
            }`}>
              {(result as any).modelUsed}
            </span>
          )}
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
              Highest:{' '}
              <span style={{ color: severityColor(Math.max(...detectedBiases.map((b: any) => b.score))) }}>
                {severityLabel(Math.max(...detectedBiases.map((b: any) => b.score)))}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Visualizations toggle ───────────────────────────────── */}
      {(confidence > 0 || detectedBiases.length > 0) && (
        <div className="mb-6">
          <button
            onClick={() => setShowVisualizations(v => !v)}
            style={serif}
            className="text-[12px] text-[#888] italic hover:text-[#1a1a1a] transition-colors underline underline-offset-2"
          >
            {showVisualizations ? 'Hide visualizations' : 'Show visualizations'}
          </button>

          {showVisualizations && (
            <div className="mt-4 space-y-4">

              {/* ── Confidence gauge ──────────────────────────────── */}
              {confidence > 0 && (
                <div className="border border-[#e8e4de] bg-white p-4">
                  <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
                    Model Confidence
                  </p>
                  <div className="flex items-center gap-4">
                    <svg width="96" height="56" viewBox="0 0 96 56" className="shrink-0">
                      <path d="M 8 52 A 40 40 0 0 1 88 52" fill="none" stroke="#eee" strokeWidth="8" strokeLinecap="round" />
                      {(() => {
                        const r = 40;
                        const total = Math.PI * r;
                        const filled = (confidence / 100) * total;
                        const color = confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626';
                        return (
                          <path
                            d="M 8 52 A 40 40 0 0 1 88 52"
                            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${filled} ${total}`}
                            style={{ transition: 'stroke-dasharray 0.8s ease' }}
                          />
                        );
                      })()}
                      <text x="48" y="50" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="bold"
                        fill={confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626'}>
                        {confidence}%
                      </text>
                    </svg>
                    <div className="flex-1 space-y-1.5">
                      {[
                        { label: 'High  (≥ 80%)',   color: '#16a34a' },
                        { label: 'Medium (60–79%)', color: '#d97706' },
                        { label: 'Low   (< 60%)',   color: '#dc2626' },
                      ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span style={serif} className="text-[10px] text-[#999]">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <p style={serif} className="text-[11px] text-[#555] font-semibold">
                        {confidence >= 80 ? 'High confidence' : confidence >= 60 ? 'Moderate confidence' : 'Low confidence'}
                      </p>
                      <p style={serif} className="text-[10px] text-[#aaa] italic mt-0.5">
                        {confidence >= 80 ? 'Result is reliable' : confidence >= 60 ? 'Treat with some caution' : 'Ambiguous — review manually'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Bias score bar chart ──────────────────────────── */}
              {detectedBiases.length > 0 && (
                <div className="border border-[#e8e4de] bg-white p-4">
                  <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-4">
                    Bias Scores — Ranked
                  </p>
                  <div className="space-y-2">
                    {[...detectedBiases]
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((bias: any) => {
                        const pct = ((bias.score || 0) / 5) * 100;
                        const color = severityColor(bias.score);
                        return (
                          <div key={bias.key} className="flex items-center gap-3">
                            <span style={serif} className="text-[11px] text-[#555] w-36 shrink-0 text-right truncate" title={bias.type}>
                              {bias.type}
                            </span>
                            <div className="flex-1 h-4 bg-[#f3f4f6] relative">
                              <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                              {[1,2,3,4].map(t => (
                                <div key={t} className="absolute top-0 bottom-0 w-px bg-white opacity-60" style={{ left: `${(t/5)*100}%` }} />
                              ))}
                            </div>
                            <div className="w-20 shrink-0 flex items-center gap-1.5">
                              <span style={{ ...serif, color }} className="text-[12px] font-bold">{bias.score}/5</span>
                              <span style={{ ...serif, color }} className="text-[10px] italic">{severityLabel(bias.score)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex mt-1 pl-[9.5rem] pr-[5rem]">
                    {['1','2','3','4','5'].map(n => (
                      <span key={n} style={serif} className="text-[9px] text-[#ccc] flex-1 text-center">{n}</span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
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

      {/* ── Detected biases (no flagged phrases here anymore) ───── */}
      {detectedBiases.length > 0 && (
        <div className="mb-6">
          <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
            Detected Biases
          </p>
          <div className="border border-[#e8e4de] divide-y divide-[#e8e4de] bg-white">
            {[...detectedBiases].sort((a, b) => (b.score || 0) - (a.score || 0)).map((bias: any) => {
              const meta   = BIAS_META[bias.key] ?? { short: '', desc: '' };
              const isOpen = expanded === bias.key;

              return (
                <div key={bias.key}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : bias.key)}
                    className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-[#F8F6F1] transition-colors"
                  >
                    <div className="w-16 shrink-0">
                      <div className="h-1 bg-[#eee]">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${(bias.score / 5) * 100}%`, backgroundColor: severityColor(bias.score) }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span style={serif} className="text-sm text-[#1a1a1a] font-semibold">{bias.type}</span>
                      {meta.short && (
                        <p style={serif} className="text-[11px] text-[#999] italic mt-0.5">{meta.short}</p>
                      )}
                    </div>
                    <span style={serif} className="text-xs italic shrink-0" style={{ color: severityColor(bias.score) }}>
                      {severityLabel(bias.score)}
                    </span>
                    <i className={`fas fa-chevron-down text-[10px] text-[#bbb] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 bg-[#F8F6F1] border-t border-[#e8e4de] space-y-2 pt-3">
                      {bias.reasoning && (
                        <p style={serif} className="text-[12px] text-[#555] italic">"{bias.reasoning}"</p>
                      )}
                      {meta.desc && (
                        <p style={serif} className="text-[12px] text-[#888]">{meta.desc}</p>
                      )}
                      {/* Hint nudging user to the highlighted text */}
                      {(bias.evidence ?? []).length > 0 && (
                        <p style={serif} className="text-[11px] text-[#bbb] italic pt-1">
                          ↓ Click highlighted phrases in the article text to see specific examples
                        </p>
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

      {/* ── Highlighted article text (toggle, click to explain) ── */}
      {result.highlightedText && (
        <div className="mb-2">
          <button
            onClick={() => setShowHighlighted(v => !v)}
            style={serif}
            className="text-[12px] text-[#888] italic hover:text-[#1a1a1a] transition-colors underline underline-offset-2 mb-3 block"
          >
            {showHighlighted ? 'Hide article text' : 'Show highlighted article text'}
          </button>

          <style>{`
            .highlighted-article mark {
              background-color: #fef08a;
              color: #1a1a1a;
              padding: 0 2px;
              cursor: pointer;
              border-radius: 2px;
              border-bottom: 1.5px solid #ca8a04;
              transition: background-color 0.15s;
            }
            .highlighted-article mark:hover {
              background-color: #fde047;
            }
            .highlighted-article mark.active-mark {
              background-color: #fde047;
              outline: 2px solid #ca8a04;
            }
          `}</style>

          {/* Relative container so tooltip is positioned inside it */}
          {showHighlighted && (
          <div
            ref={articleRef}
            className="relative border border-[#e8e4de] bg-white p-6"
            onClick={handleArticleClick}
          >
            <div
              className="highlighted-article text-sm text-[#333] leading-relaxed"
              style={serif}
              dangerouslySetInnerHTML={{ __html: prepareHtml(result.highlightedText) }}
            />

            {/* ── Tooltip ─────────────────────────────────────────── */}
            {tooltip && (
              <div
                ref={tooltipRef}
                className="absolute z-50 bg-white border border-[#e8e4de] shadow-lg p-4 w-80"
                style={{ top: tooltip.y, left: tooltip.x }}
                onClick={e => e.stopPropagation()}
              >
                {/* Close */}
                <button
                  onClick={() => setTooltip(null)}
                  className="absolute top-2 right-3 text-[#bbb] hover:text-[#555] text-xs"
                >✕</button>

                {/* Bias type badge */}
                {tooltip.biasType && (
                  <p style={serif} className="text-[10px] font-bold uppercase tracking-widest text-[#aaa] mb-2">
                    {tooltip.biasType}
                  </p>
                )}

                {/* The phrase itself */}
                <p style={serif} className="text-[12px] font-semibold italic text-[#1a1a1a] mb-2 leading-snug">
                  "{tooltip.phrase}"
                </p>

                {/* Explanation */}
                {tooltip.explanation && (
                  <p style={serif} className="text-[12px] text-[#555] mb-2 leading-snug">
                    {tooltip.explanation}
                  </p>
                )}

                {/* Neutral alternative */}
                {tooltip.neutral && (
                  <p style={serif} className="text-[11px] text-[#16a34a] border-t border-[#e8e4de] pt-2 mt-2">
                    → {tooltip.neutral}
                  </p>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ResultView;