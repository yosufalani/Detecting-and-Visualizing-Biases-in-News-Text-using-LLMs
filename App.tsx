import React, { useState, useEffect } from 'react';
import { AnalysisResult } from './types';
import { fetchHistory, deleteAnalysis, checkBackendConnection } from './services/apiService';
import ArticleAnalyzer from './components/ArticleAnalyzer';
import CompareView from './components/CompareView';
import HistoryList from './components/HistoryList';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [history, setHistory]               = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [view, setView]                     = useState<'home' | 'compare'>('home');
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
    const headers = ["Title", "Timestamp", "Category", "Bias Score", "Sensationalism", "Tonality", "Summary"];
    const rows = history.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      new Date(item.timestamp).toISOString(),
      item.category,
      item.biasScore,
      item.sensationalismScore,
      `"${item.tonality.replace(/"/g, '""')}"`,
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
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => { setView('home'); setSelectedResult(null); }}
            className="font-semibold text-sm text-gray-900 focus:outline-none"
          >
            VeriBias
          </button>
          <div className="flex items-center gap-5">
            {(['home', 'compare'] as const).map(key => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`text-sm transition-colors ${
                  view === key ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {key === 'home' ? 'Analyze' : 'Compare'}
              </button>
            ))}
            <button
              onClick={exportToCSV}
              disabled={!history.length}
              className="text-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Export
            </button>
            <div className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {view === 'home' && (
          <div className="flex gap-8 items-start">

            {/* ── Left column: analyzer + history ──────── */}
            <div className="w-80 shrink-0 space-y-8">

              <ArticleAnalyzer onResult={handleNewResult} />

              {history.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <HistoryList
                  history={history}
                  onDelete={handleDelete}
                  onSelect={r => setSelectedResult(r)}
                />
              </div>
            )}

            </div>

            {/* ── Right column: result ──────────────────── */}
            <div className="flex-1 min-w-0">
              {selectedResult ? (
                <ResultView
                  result={selectedResult}
                  onClose={() => setSelectedResult(null)}
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-sm text-gray-300">Results will appear here</p>
                </div>
              )}
            </div>

          </div>
        )}

        {view === 'compare' && (
          <CompareView history={history} />
        )}

      </main>

    </div>
  );
};

export default App;