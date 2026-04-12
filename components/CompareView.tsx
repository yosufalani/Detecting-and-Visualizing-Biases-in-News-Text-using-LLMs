import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

interface CompareViewProps {
  history: AnalysisResult[];
}

type Model = 'gemini' | 'claude';

const API_BASE = '/api';

// ── Helpers ────────────────────────────────────────────────────────────────
const getFramingLabel = (score: number) => {
  if (score <= 1) return 'None';
  if (score < 3)  return 'Mild';
  if (score < 4)  return 'Moderate';
  if (score < 5)  return 'Strong';
  return 'Extreme';
};

const getFramingColor = (score: number) => {
  if (score < 2) return 'text-emerald-600';
  if (score < 4) return 'text-amber-600';
  return 'text-rose-600';
};

const getBarColor = (score: number) => {
  if (score < 2) return 'bg-emerald-500';
  if (score < 4) return 'bg-amber-400';
  return 'bg-rose-500';
};

// ── Score card ─────────────────────────────────────────────────────────────
const ScoreRow = ({
  label, left, right, max = 5
}: { label: string; left: number | null; right: number | null; max?: number }) => {
  const diff = left !== null && right !== null ? Math.abs(left - right) : null;
  const diffColor = diff === null ? '' : diff === 0 ? 'text-emerald-600' : diff <= 1 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="grid grid-cols-[1fr_80px_1fr] items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      {/* Left score */}
      <div className="flex items-center gap-2">
        {left !== null ? (
          <>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${getBarColor(left)} transition-all`}
                style={{ width: `${(left / max) * 100}%` }} />
            </div>
            <span className={`text-sm font-bold w-8 text-right ${getFramingColor(left)}`}>
              {left}/{max}
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-300 italic">—</span>
        )}
      </div>

      {/* Label + diff */}
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        {diff !== null && (
          <div className={`text-[10px] font-bold mt-0.5 ${diffColor}`}>
            {diff === 0 ? '✓ match' : `±${diff.toFixed(1)}`}
          </div>
        )}
      </div>

      {/* Right score */}
      <div className="flex items-center gap-2">
        {right !== null ? (
          <>
            <span className={`text-sm font-bold w-8 ${getFramingColor(right)}`}>
              {right}/{max}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${getBarColor(right)} transition-all`}
                style={{ width: `${(right / max) * 100}%` }} />
            </div>
          </>
        ) : (
          <span className="text-sm text-gray-300 italic">—</span>
        )}
      </div>
    </div>
  );
};

// ── Phrase list ─────────────────────────────────────────────────────────────
const PhraseList = ({ phrases, side }: { phrases: any[]; side: 'left' | 'right' }) => {
  if (!phrases?.length) return (
    <p className="text-xs text-gray-400 italic">No phrases flagged.</p>
  );
  return (
    <div className="space-y-2">
      {phrases.slice(0, 5).map((p: any, i: number) => {
        const phrase = typeof p === 'string' ? p : p.phrase;
        const reason = typeof p === 'string' ? '' : p.reason;
        const alt    = typeof p === 'string' ? '' : p.suggestedAlternative;
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className="text-xs font-semibold text-gray-800 italic mb-1">"{phrase}"</div>
            {reason && <div className="text-[10px] text-gray-400 mb-1">{reason}</div>}
            {alt    && <div className="text-[10px] text-emerald-600 font-medium">→ {alt}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
const CompareView: React.FC<CompareViewProps> = ({ history }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [leftModel,  setLeftModel]  = useState<Model>('gemini');
  const [leftResult, setLeftResult]  = useState<AnalysisResult | null>(null);
  const [rightResult, setRightResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const rightModel: Model = leftModel === 'gemini' ? 'claude' : 'gemini';

  const selectedArticle = history.find(h => h.id === selectedId) ?? null;

  const runComparison = async () => {
    if (!selectedArticle) return;
    setLoading(true);
    setError('');
    setLeftResult(null);
    setRightResult(null);

    try {
      const textToAnalyse = (selectedArticle as any).fullText
        || selectedArticle.originalTextSnippet
        || '';

      if (!textToAnalyse || textToAnalyse.length < 50) {
        setError('Full article text not available for this entry. Re-analyse the article to enable comparison.');
        setLoading(false);
        return;
      }

      const [leftRes, rightRes] = await Promise.all([
        fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text:  textToAnalyse,
            title: selectedArticle.title,
            model: leftModel,
          }),
        }),
        fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text:  textToAnalyse,
            title: selectedArticle.title,
            model: rightModel,
          }),
        }),
      ]);

      if (!leftRes.ok || !rightRes.ok) throw new Error('Analysis failed');

      const [l, r] = await Promise.all([leftRes.json(), rightRes.json()]);
      setLeftResult(l);
      setRightResult(r);
    } catch (e) {
      setError('Comparison failed. Make sure both API keys are configured and the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const modelLabel = (m: Model) => m === 'gemini' ? 'Gemini 2.5 Flash' : 'Claude Sonnet';
  const modelColor = (m: Model) => m === 'gemini' ? 'bg-blue-600' : 'bg-violet-600';

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Model Comparison</h2>
        <p className="text-gray-500 mt-1">Run the same article through Gemini and Claude side by side</p>
      </div>

      {/* Setup card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        {/* Article picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select article from history</label>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No articles analysed yet. Run an analysis first.</p>
          ) : (
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">— Choose an article —</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>
                  {h.title} · {new Date(h.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Model order toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Left model</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-64">
            {(['gemini', 'claude'] as Model[]).map(m => (
              <button key={m} type="button" onClick={() => setLeftModel(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  leftModel === m ? 'bg-slate-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}>
                {modelLabel(m)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Right side will automatically use {modelLabel(rightModel)}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />{error}
          </div>
        )}

        {/* Run button */}
        <button
          onClick={runComparison}
          disabled={!selectedId || loading}
          className={`px-6 py-3 rounded-lg font-bold text-white text-sm transition-all flex items-center gap-2 ${
            !selectedId || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-700'
          }`}
        >
          {loading ? (
            <><i className="fas fa-spinner fa-spin" />Running both models...</>
          ) : (
            <><i className="fas fa-code-branch" />Run Comparison</>
          )}
        </button>
      </div>

      {/* Results */}
      {(leftResult || rightResult) && (
        <div className="space-y-4">

          {/* Column headers */}
          <div className="grid grid-cols-2 gap-4">
            {([leftResult, rightResult] as const).map((res, i) => {
              const m = i === 0 ? leftModel : rightModel;
              return (
                <div key={i} className={`${modelColor(m)} text-white rounded-xl px-5 py-3 flex items-center justify-between`}>
                  <div>
                    <div className="font-bold text-sm">{modelLabel(m)}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {res ? `${res.confidence ?? 0}% confidence` : 'Loading...'}
                    </div>
                  </div>
                  <i className={`fas ${m === 'gemini' ? 'fa-robot' : 'fa-brain'} text-2xl opacity-40`} />
                </div>
              );
            })}
          </div>

          {/* Score comparison */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Scores</h3>
            <ScoreRow
              label="Framing"
              left={leftResult?.framingScore ?? null}
              right={rightResult?.framingScore ?? null}
            />
            <ScoreRow
              label="Sensationalism"
              left={leftResult?.sensationalismScore ?? null}
              right={rightResult?.sensationalismScore ?? null}
            />
            <ScoreRow
              label="Direction"
              left={leftResult ? Math.abs(leftResult.biasScore ?? 0) / 20 : null}
              right={rightResult ? Math.abs(rightResult.biasScore ?? 0) / 20 : null}
              max={5}
            />
          </div>

          {/* Summary comparison */}
          <div className="grid grid-cols-2 gap-4">
            {([leftResult, rightResult] as const).map((res, i) => (
              <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2">
                  AI Summary — {modelLabel(i === 0 ? leftModel : rightModel)}
                </div>
                <p className="text-sm text-blue-900 italic leading-relaxed">
                  "{res?.summary ?? '—'}"
                </p>
              </div>
            ))}
          </div>

          {/* Direction comparison */}
          <div className="grid grid-cols-2 gap-4">
            {([leftResult, rightResult] as const).map((res, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Political Alignment — {modelLabel(i === 0 ? leftModel : rightModel)}
                </div>
                <div className="text-xl font-black italic uppercase mb-4"
                  style={{ color: BIAS_COLORS[res?.category as keyof typeof BIAS_COLORS] ?? '#6b7280' }}>
                  {res?.category ?? '—'}
                </div>
                <div className="relative h-2.5 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-gray-200 to-red-700 rounded-full" />
                  {res && (
                    <div className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `clamp(0px, calc(${((( res.biasScore ?? 0) + 100) / 200) * 100}% - 8px), calc(100% - 16px))` }}>
                      <div className="w-4 h-4 bg-white border-4 border-gray-900 rounded-full shadow" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold uppercase text-gray-400">
                  <span>Far Left</span><span>Center</span><span>Far Right</span>
                </div>
              </div>
            ))}
          </div>

          {/* Flagged phrases */}
          <div className="grid grid-cols-2 gap-4">
            {([leftResult, rightResult] as const).map((res, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">Flagged Phrases</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {res?.biasedPhrases?.length ?? 0} found
                  </span>
                </div>
                <PhraseList phrases={res?.biasedPhrases ?? []} side={i === 0 ? 'left' : 'right'} />
              </div>
            ))}
          </div>

          {/* Agreement summary */}
          {leftResult && rightResult && (() => {
            const framingDiff = Math.abs((leftResult.framingScore ?? 0) - (rightResult.framingScore ?? 0));
            const senseDiff   = Math.abs((leftResult.sensationalismScore ?? 0) - (rightResult.sensationalismScore ?? 0));
            const avgDiff     = (framingDiff + senseDiff) / 2;
            const agreed      = avgDiff <= 1;
            return (
              <div className={`rounded-2xl border p-5 ${agreed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  <i className={`fas ${agreed ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-triangle text-amber-600'} text-xl mt-0.5`} />
                  <div>
                    <div className={`font-bold text-sm mb-1 ${agreed ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {agreed ? 'Models largely agree' : 'Models diverge — analytically interesting'}
                    </div>
                    <p className={`text-sm ${agreed ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {agreed
                        ? `Average score difference is ${avgDiff.toFixed(1)} points. Both models are in agreement — this increases confidence in the result.`
                        : `Average score difference is ${avgDiff.toFixed(1)} points. This article sits in an ambiguous region of the bias spectrum. Worth examining in your error analysis.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
};

export default CompareView;