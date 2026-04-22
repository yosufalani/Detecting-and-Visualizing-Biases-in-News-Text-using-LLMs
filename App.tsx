import React, { useState, useEffect } from 'react';
import { AnalysisResult } from './types';
import { fetchHistory, deleteAnalysis, checkBackendConnection } from './services/apiService';
import ArticleAnalyzer from './components/ArticleAnalyzer';
import HistoryList from './components/HistoryList';
import ResultView from './components/ResultView';
import StatsView from './components/StatsView';

const App: React.FC = () => {
  const [history, setHistory]               = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [view, setView]                     = useState<'home' | 'stats'>('home');
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    const init = async () => {
      setIsBackendOnline(await checkBackendConnection());
      setHistory(await fetchHistory());
    };
    init();
    const interval = setInterval(async () => {
      setIsBackendOnline(await checkBackendConnection());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNewResult = (result: AnalysisResult) => {
    setHistory(prev => [result, ...prev]);
    setSelectedResult(result);
  };

  const handleDelete = async (id: string) => {
    await deleteAnalysis(id);
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedResult?.id === id) setSelectedResult(null);
  };

  const exportToCSV = () => {
    if (!history.length) return;
    const headers = ["Title", "Source", "Timestamp", "Category", "Framing Score", "Sensationalism", "Summary"];
    const rows = history.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${(item.source || '').replace(/"/g, '""')}"`,
      new Date(item.timestamp).toISOString(),
      item.category,
      item.framingScore,
      item.sensationalismScore,
      `"${item.summary.replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `veribias_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }} className="min-h-screen bg-[#F8F6F1]">

      {/* ── Masthead ──────────────────────────────────────────────── */}
      <header className="border-b-2 border-[#1a1a1a]">
        {/* Top strip */}
        <div className="bg-[#1a1a1a] px-8 py-1.5 flex items-center justify-between">
          <span style={{ fontFamily: "'Georgia', serif" }} className="text-[11px] text-[#999] tracking-widest uppercase">
            Media Bias Detection System
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[#666] tracking-wider">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className="text-[11px] text-[#666]">{isBackendOnline ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Nameplate */}
        <div className="px-8 py-5 flex items-end justify-between border-b border-[#ddd]">
          <button
            onClick={() => { setView('home'); setSelectedResult(null); }}
            className="focus:outline-none group"
          >
            <h1 style={{ fontFamily: "'Georgia', serif", letterSpacing: '-1px' }}
              className="text-5xl font-bold text-[#1a1a1a] group-hover:opacity-80 transition-opacity leading-none">
              VeriBias
            </h1>
            <p style={{ fontFamily: "'Georgia', serif" }} className="text-[12px] text-[#888] italic mt-1 tracking-wide">
              Detecting the bias you weren't meant to see
            </p>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1 pb-1">
            {([
              { key: 'home',  label: 'Analyse' },
              { key: 'stats', label: 'Results' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{ fontFamily: "'Georgia', serif" }}
                className={`px-4 py-1.5 text-sm transition-all border ${
                  view === key
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'text-[#555] border-transparent hover:border-[#ccc] hover:text-[#1a1a1a]'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={exportToCSV}
              disabled={!history.length}
              style={{ fontFamily: "'Georgia', serif" }}
              className="px-4 py-1.5 text-sm text-[#888] hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-[#ccc]"
            >
              Export
            </button>
          </nav>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-8 py-8">

        {view === 'home' && (
          <div className="flex gap-10 items-start">

            {/* Left column */}
            <div className="w-[320px] shrink-0 space-y-8">

              {/* Section rule */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-[#1a1a1a]" />
                  <span style={{ fontFamily: "'Georgia', serif" }}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
                    New Analysis
                  </span>
                  <div className="h-px flex-1 bg-[#1a1a1a]" />
                </div>
                <ArticleAnalyzer onResult={handleNewResult} />
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-[#ccc]" />
                    <span style={{ fontFamily: "'Georgia', serif" }}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888]">
                      Previous Analyses
                    </span>
                    <div className="h-px flex-1 bg-[#ccc]" />
                  </div>
                  <HistoryList
                    history={history}
                    onDelete={handleDelete}
                    onSelect={r => setSelectedResult(r)}
                    selectedId={selectedResult?.id}
                  />
                </div>
              )}
            </div>

            {/* Right column — result */}
            <div className="flex-1 min-w-0">
              {selectedResult ? (
                <ResultView
                  result={selectedResult}
                  onClose={() => setSelectedResult(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-96 border border-dashed border-[#ccc]">
                  <p style={{ fontFamily: "'Georgia', serif" }}
                    className="text-[#bbb] text-sm italic">
                    Analysis results will appear here
                  </p>
                </div>
              )}
            </div>

          </div>
        )}


        {view === 'stats' && (
          <StatsView />
        )}

      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t-2 border-[#1a1a1a] mt-16 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span style={{ fontFamily: "'Georgia', serif" }}
            className="text-[11px] text-[#aaa] italic">
            VeriBias — University of Stavanger · Bachelor's Thesis 2026
          </span>
          <span style={{ fontFamily: "'Georgia', serif" }}
            className="text-[11px] text-[#aaa]">
            For research purposes only
          </span>
        </div>
      </footer>

    </div>
  );
};

export default App;