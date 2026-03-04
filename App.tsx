
import React, { useState, useEffect } from 'react';
import { AnalysisResult } from './types';
import { fetchHistory, deleteAnalysis, checkBackendConnection } from './services/apiService';
import ArticleAnalyzer from './components/ArticleAnalyzer';
import BiasDashboard from './components/BiasDashboard';
import HistoryList from './components/HistoryList';
import ResultView from './components/ResultView';

const App: React.FC = () => {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [view, setView] = useState<'home' | 'stats'>('home');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Initial load and health check
  useEffect(() => {
    const init = async () => {
      const online = await checkBackendConnection();
      setIsBackendOnline(online);
      const data = await fetchHistory();
      setHistory(data);
    };
    init();

    const interval = setInterval(async () => {
      const online = await checkBackendConnection();
      setIsBackendOnline(online);
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
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ["Title", "Timestamp", "Category", "Bias Score", "Sensationalism %", "Tonality", "Summary"];
    const rows = history.map(item => [
      `"${item.title.replace(/"/g, '""')}"`,
      new Date(item.timestamp).toISOString(),
      item.category,
      item.biasScore,
      item.sensationalismScore,
      `"${item.tonality.replace(/"/g, '""')}"`,
      `"${item.summary.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `veribias_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goHome = () => {
    setView('home');
    setSelectedResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <button 
            onClick={goHome}
            className="flex items-center gap-2 group transition-all hover:opacity-80 focus:outline-none"
            aria-label="Return to home screen"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <i className="fas fa-newspaper text-xl"></i>
            </div>
            <div className="text-left">
              <h1 className="serif text-2xl font-bold tracking-tight text-gray-900 leading-none">VeriBias</h1>
            </div>
          </button>
          
          <div className="flex gap-2 sm:gap-4">
            <button 
              onClick={() => setView('home')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <i className="fas fa-search sm:mr-2"></i>
              <span className="hidden sm:inline">Analyze</span>
            </button>
            <button 
              onClick={() => setView('stats')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'stats' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <i className="fas fa-chart-line sm:mr-2"></i>
              <span className="hidden sm:inline">Statistics</span>
            </button>
            <button 
              onClick={exportToCSV}
              disabled={history.length === 0}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-transparent hover:border-blue-100"
              title="Download History as CSV"
            >
              <i className="fas fa-download sm:mr-2"></i>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {view === 'home' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-8">
              <ArticleAnalyzer onResult={handleNewResult} />
              <HistoryList 
                history={history} 
                onDelete={handleDelete} 
                onSelect={setSelectedResult} 
              />
            </div>

            <div className="lg:col-span-8 h-full min-h-[600px]">
              {selectedResult ? (
                <ResultView 
                  result={selectedResult} 
                  onClose={() => setSelectedResult(null)} 
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center h-full flex flex-col justify-center items-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <i className="fas fa-file-alt text-7xl text-blue-600 relative"></i>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4 serif">Transparency in Journalism</h2>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    VeriBias uses advanced AI to decode the linguistic nudges that shape our public perception. 
                    Analyze any news article to uncover hidden bias patterns.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 serif">Aggregated Insights</h2>
                <p className="text-gray-500">Holistic overview of news bias trends</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">Total Scans: {history.length}</span>
              </div>
            </div>
            <BiasDashboard data={history} />
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <button 
              onClick={goHome}
              className="flex items-center gap-2 mb-2 group hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <i className="fas fa-newspaper text-sm"></i>
              </div>
              <h2 className="text-xl font-bold text-white serif">VeriBias</h2>
            </button>
            <p className="text-xs italic text-slate-500">
              Detecting the bias you weren't meant to see.
            </p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} VeriBias News Analysis. For informational and research purposes only.
            </p>
            <div className="flex justify-center md:justify-end gap-6 mt-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Documentation</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
