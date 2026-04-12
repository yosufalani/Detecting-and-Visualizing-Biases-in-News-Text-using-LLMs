import React, { useState } from 'react';
import { runAnalysis } from '../services/apiService';
import { AnalysisResult } from '../types';

interface ArticleAnalyzerProps {
  onResult: (result: AnalysisResult) => void;
}

type Model = 'gemini' | 'claude';

const ArticleAnalyzer: React.FC<ArticleAnalyzerProps> = ({ onResult }) => {
  const [title,   setTitle]   = useState('');
  const [source,  setSource]  = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [model,   setModel]   = useState<Model>('gemini');

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await runAnalysis(content, title || 'Untitled Article', model, source);
      onResult(result);
      setTitle('');
      setSource('');
      setContent('');
    } catch {
      setError('Analysis failed. Check your API key and backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">

      {/* Title + Source side by side */}
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Article title (optional)"
          className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300 bg-white"
        />
        <input
          type="text"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Source (e.g. BBC)"
          className="w-36 px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300 bg-white"
        />
      </div>

      {/* Article text */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Paste the full article text here..."
        className="w-full h-48 px-4 py-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors resize-none placeholder:text-gray-300 bg-white"
      />

      {/* Model selector + button */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs shrink-0">
          {(['gemini', 'claude'] as Model[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setModel(m)}
              className={`px-3 py-2 font-medium transition-colors ${
                model === m
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-400 hover:text-gray-700'
              }`}
            >
              {m === 'gemini' ? 'Gemini' : 'Claude'}
            </button>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
            loading || !content.trim()
              ? 'bg-gray-200 cursor-not-allowed text-gray-400'
              : 'bg-gray-900 hover:bg-gray-700'
          }`}
        >
          {loading ? `Analysing with ${model === 'gemini' ? 'Gemini' : 'Claude'}...` : 'Run Analysis'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

    </div>
  );
};

export default ArticleAnalyzer;