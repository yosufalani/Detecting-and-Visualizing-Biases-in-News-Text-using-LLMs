
import React from 'react';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

interface HistoryListProps {
  history: AnalysisResult[];
  onDelete: (id: string) => void;
  onSelect: (item: AnalysisResult) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onDelete, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Scan History</h3>
        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{history.length} items</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {history.sort((a, b) => b.timestamp - a.timestamp).map((item) => (
          <div 
            key={item.id} 
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => onSelect(item)}
          >
            <div className="flex justify-between items-start mb-2">
              <span 
                className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded"
                style={{ backgroundColor: `${BIAS_COLORS[item.category]}20`, color: BIAS_COLORS[item.category] }}
              >
                {item.category}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
            <h4 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <i className="far fa-calendar"></i>
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-fire-alt"></i>
                {item.sensationalismScore}% sensation
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
