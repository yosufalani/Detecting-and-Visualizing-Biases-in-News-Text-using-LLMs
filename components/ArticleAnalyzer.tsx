
import React, { useState } from 'react';
import { runAnalysis } from '../services/apiService';
import { AnalysisResult } from '../types';

interface ArticleAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

const ArticleAnalyzer: React.FC<ArticleAnalyzerProps> = ({ onResult }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError('');
    try {
      const result = await runAnalysis(content, title || 'Scanned Article');
      onResult(result);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Check your API key or Backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 bg-slate-900 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-microscope text-blue-400"></i>
          New Analysis
        </h2>
        <p className="text-slate-400 text-sm mt-1">Paste article text below to detect bias</p>
      </div>

      <form onSubmit={handleAnalyze} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Breaking News: The Economic Shift..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Article Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste the full text of the article here..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-bolt"></i>
              Run Deep Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ArticleAnalyzer;
