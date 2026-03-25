import React, { useState } from 'react';
import { runAnalysis } from '../services/apiService';
import { AnalysisResult } from '../types';

interface ArticleAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

type Model = "gemini" | "claude";

const ArticleAnalyzer: React.FC<ArticleAnalyzerProps> = ({ onResult }) => {
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [model,   setModel]   = useState<Model>('gemini');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await runAnalysis(content, title || 'Untitled Article', model);
      onResult(result);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Check your API key or backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="p-6 bg-slate-900 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-microscope text-blue-400"></i>
          New Analysis
        </h2>
        <p className="text-slate-400 text-sm mt-1">Paste article text below to detect bias</p>
      </div>

      <div className="p-6 space-y-4">

        {/* Model selector — two clean tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["gemini", "claude"] as Model[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  model === m
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {m === 'gemini' ? 'Gemini 2.5 Flash' : 'Claude Sonnet'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article Title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Breaking News: The Economic Shift..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Content */}
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

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
            loading || !content.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Analysing with {model === 'gemini' ? 'Gemini' : 'Claude'}...
            </>
          ) : (
            <>
              <i className="fas fa-bolt" />
              Run Analysis
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default ArticleAnalyzer;