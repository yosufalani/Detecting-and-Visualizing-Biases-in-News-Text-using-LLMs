import React, { useState, useEffect } from 'react';

const serif = { fontFamily: "'Georgia', 'Times New Roman', serif" };

const severityColor = (s: number) =>
  s <= 2 ? '#16a34a' : s <= 3 ? '#d97706' : '#dc2626';

interface Stats {
  total: number;
  avg_framing: number;
  avg_sensationalism: number;
  avg_confidence: number;
  avg_direction: number;
  high_bias_count: number;
  high_bias_pct: number;
  category_counts: Record<string, number>;
  outlet_counts: Record<string, number>;
  bias_type_counts: Record<string, number>;
}

interface EvalRow {
  id: string;
  title: string;
  source: string;
  topic: string;
  human_score: number;
  gemini_score: number | null;
  gemini_confidence: number;
  gemini_diff: number;
  gemini_exact: boolean;
  gemini_within_1: boolean;
  claude_score: number | null;
  claude_confidence: number;
  claude_diff: number;
  claude_exact: boolean;
  claude_within_1: boolean;
  model_agreement_diff: number | null;
}

interface EvalSummary {
  gemini: { n: number; exact_match_rate: number; within_1_rate: number; avg_difference: number; avg_confidence: number };
  claude:  { n: number; exact_match_rate: number; within_1_rate: number; avg_difference: number; avg_confidence: number };
  kappa: number | null;
  results: EvalRow[];
}

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string }> =
  ({ label, value, sub, color }) => (
    <div className="border border-[#e8e4de] bg-white p-4">
      <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-1">{label}</p>
      <p style={{ ...serif, color: color || '#1a1a1a' }} className="text-2xl font-bold leading-none">{value}</p>
      {sub && <p style={serif} className="text-[11px] text-[#aaa] italic mt-1">{sub}</p>}
    </div>
  );

const StatsView: React.FC = () => {
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [evalData,    setEvalData]    = useState<EvalSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEval,  setLoadingEval]  = useState(false);
  const [evalError,    setEvalError]    = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  const runEval = async () => {
    setLoadingEval(true);
    setEvalError(null);
    try {
      const r = await fetch('/api/evaluate');
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      const d = await r.json();
      setEvalData(d);
    } catch (e: any) {
      setEvalError(e.message || 'Evaluation failed');
    } finally {
      setLoadingEval(false);
    }
  };

  const directionLabel = (score: number) => {
    if (score <= -60) return 'Far Left';
    if (score <= -20) return 'Left';
    if (score <   20) return 'Centre';
    if (score <   60) return 'Right';
    return 'Far Right';
  };

  const directionColor = (score: number) =>
    score <= -20 ? '#1e40af' : score >= 20 ? '#b91c1c' : '#555';

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b-2 border-[#1a1a1a] pb-4">
        <h2 style={serif} className="text-2xl font-bold text-[#1a1a1a]">Aggregated Results</h2>
      </div>

      {loadingStats && (
        <p style={serif} className="text-[#aaa] italic text-sm">Loading stats…</p>
      )}

      {stats && stats.total === 0 && (
        <p style={serif} className="text-[#aaa] italic text-sm">No analyses saved yet. Analyse some articles first.</p>
      )}

      {stats && stats.total > 0 && (
        <>
          {/* ── Summary cards ──────────────────────────────────── */}
          <div>
            <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-3">
              Overview
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Articles Analysed" value={stats.total} />
              <StatCard
                label="Avg Framing Score"
                value={stats.avg_framing.toFixed(1) + ' / 5'}
                color={severityColor(stats.avg_framing)}
                sub="Political framing intensity"
              />
              <StatCard
                label="High Bias Articles"
                value={`${stats.high_bias_count} (${stats.high_bias_pct}%)`}
                color={stats.high_bias_pct > 40 ? '#dc2626' : '#d97706'}
                sub="Framing score ≥ 4"
              />
              <StatCard
                label="Avg Model Confidence"
                value={stats.avg_confidence.toFixed(0) + '%'}
                color={stats.avg_confidence >= 80 ? '#16a34a' : '#d97706'}
                sub="Across all analyses"
              />
              <StatCard
                label="Avg Sensationalism"
                value={stats.avg_sensationalism.toFixed(1) + ' / 5'}
                color={severityColor(stats.avg_sensationalism)}
              />
              <StatCard
                label="Avg Political Direction"
                value={directionLabel(stats.avg_direction)}
                color={directionColor(stats.avg_direction)}
                sub={`Score: ${stats.avg_direction > 0 ? '+' : ''}${stats.avg_direction.toFixed(0)}`}
              />
            </div>
          </div>

          {/* ── Category distribution ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

            <div className="border border-[#e8e4de] bg-white p-4">
              <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-4">
                Political Lean Distribution
              </p>
              <div className="space-y-2">
                {Object.entries(stats.category_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const pct = Math.round((count / stats.total) * 100);
                    const color = cat.toLowerCase().includes('left')  ? '#1e40af'
                                : cat.toLowerCase().includes('right') ? '#b91c1c'
                                : '#555';
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span style={serif} className="text-[11px] text-[#555] w-24 shrink-0 text-right">{cat}</span>
                        <div className="flex-1 h-3 bg-[#f3f4f6] relative">
                          <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span style={{ ...serif, color }} className="text-[11px] font-bold w-10 shrink-0">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bias type frequency */}
            <div className="border border-[#e8e4de] bg-white p-4">
              <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-4">
                Most Common Bias Types
              </p>
              <div className="space-y-2">
                {Object.entries(stats.bias_type_counts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([type, count]) => {
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span style={serif} className="text-[11px] text-[#555] w-32 shrink-0 text-right truncate" title={type}>{type}</span>
                        <div className="flex-1 h-3 bg-[#f3f4f6]">
                          <div className="h-full bg-[#1A2A4A] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={serif} className="text-[11px] text-[#888] w-10 shrink-0">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>

          {/* Outlet breakdown */}
          {Object.keys(stats.outlet_counts).length > 1 && (
            <div className="border border-[#e8e4de] bg-white p-4">
              <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-4">
                Articles by Outlet
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(stats.outlet_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([outlet, count]) => (
                    <div key={outlet} className="border border-[#e8e4de] px-3 py-2 bg-[#F8F6F1]">
                      <p style={serif} className="text-[12px] font-bold text-[#1a1a1a]">{outlet}</p>
                      <p style={serif} className="text-[10px] text-[#aaa]">{count} article{count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Human vs AI Evaluation ─────────────────────────────── */}
      <div>
        <div className="border-b border-[#e8e4de] pb-3 mb-4 flex items-end justify-between">
          <div>
            <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
              Human vs AI Evaluation
            </p>
            <p style={serif} className="text-[11px] text-[#aaa] italic mt-0.5">
              Requires ground_truth.py with annotated articles
            </p>
          </div>
          <button
            onClick={runEval}
            disabled={loadingEval}
            style={serif}
            className="px-4 py-1.5 text-sm bg-[#1a1a1a] text-white hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loadingEval ? 'Running…' : 'Run Evaluation'}
          </button>
        </div>

        {evalError && (
          <p style={serif} className="text-[12px] text-[#dc2626] italic">{evalError}</p>
        )}

        {evalData && (
          <div className="space-y-6">

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Gemini Exact Match',    value: `${Math.round((evalData.gemini?.exact_match_rate ?? 0) * 100)}%` },
                { label: 'Gemini Within-1',        value: `${Math.round((evalData.gemini?.within_1_rate    ?? 0) * 100)}%` },
                { label: 'Claude Exact Match',     value: `${Math.round((evalData.claude?.exact_match_rate  ?? 0) * 100)}%` },
                { label: 'Claude Within-1',         value: `${Math.round((evalData.claude?.within_1_rate     ?? 0) * 100)}%` },
              ].map(({ label, value }) => (
                <StatCard key={label} label={label} value={value} />
              ))}
            </div>

            {evalData.kappa !== null && evalData.kappa !== undefined && (
              <div className="border border-[#e8e4de] bg-white p-4 inline-block">
                <p style={serif} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888] mb-1">Inter-Rater Kappa (κ)</p>
                <p style={serif} className="text-2xl font-bold text-[#1a1a1a]">{evalData.kappa.toFixed(3)}</p>
                <p style={serif} className="text-[11px] text-[#aaa] italic mt-1">
                  {evalData.kappa >= 0.8 ? 'Almost perfect agreement'
                   : evalData.kappa >= 0.6 ? 'Substantial agreement'
                   : evalData.kappa >= 0.4 ? 'Moderate agreement'
                   : 'Fair agreement'}
                </p>
              </div>
            )}

            {/* Per-article table */}
            {evalData.results?.length > 0 && (
              <div className="border border-[#e8e4de] bg-white overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-[#1A2A4A]">
                      {['Article', 'Outlet', 'Human', 'Gemini', 'G Conf.', 'G Δ', 'Claude', 'C Conf.', 'C Δ', 'Model Δ'].map(h => (
                        <th key={h} style={serif} className="text-[10px] font-bold uppercase tracking-wider text-white px-3 py-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evalData.results.map((row, i) => {
                      const rowBg = i % 2 === 0 ? '#fff' : '#F8F6F1';
                      const gColor = row.gemini_within_1 ? '#16a34a' : '#dc2626';
                      const cColor = row.claude_within_1  ? '#16a34a' : '#dc2626';
                      return (
                        <tr key={row.id} style={{ backgroundColor: rowBg }}>
                          <td style={serif} className="px-3 py-2 text-[11px] text-[#1a1a1a] max-w-[200px] truncate" title={row.title}>
                            {row.title}
                          </td>
                          <td style={serif} className="px-3 py-2 text-[11px] text-[#555] whitespace-nowrap">{row.source}</td>
                          <td style={serif} className="px-3 py-2 text-[12px] font-bold text-[#1a1a1a] text-center">{row.human_score}</td>
                          <td style={{ ...serif, color: gColor }} className="px-3 py-2 text-[12px] font-bold text-center">{row.gemini_score ?? '—'}</td>
                          <td style={serif} className="px-3 py-2 text-[11px] text-[#888] text-center">{row.gemini_confidence ?? '—'}%</td>
                          <td style={{ ...serif, color: gColor }} className="px-3 py-2 text-[11px] font-bold text-center">{row.gemini_diff ?? '—'}</td>
                          <td style={{ ...serif, color: cColor }} className="px-3 py-2 text-[12px] font-bold text-center">{row.claude_score ?? '—'}</td>
                          <td style={serif} className="px-3 py-2 text-[11px] text-[#888] text-center">{row.claude_confidence ?? '—'}%</td>
                          <td style={{ ...serif, color: cColor }} className="px-3 py-2 text-[11px] font-bold text-center">{row.claude_diff ?? '—'}</td>
                          <td style={serif} className="px-3 py-2 text-[11px] text-[#555] text-center font-bold">
                            {row.model_agreement_diff !== null && row.model_agreement_diff !== undefined ? row.model_agreement_diff : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default StatsView;