import React from 'react';
import { AnalysisResult } from '../types';

interface HistoryListProps {
  history: AnalysisResult[];
  onDelete: (id: string) => void;
  onSelect: (item: AnalysisResult) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onDelete, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="divide-y divide-gray-100">
      {[...history].sort((a, b) => b.timestamp - a.timestamp).map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          className="py-3 flex items-center justify-between gap-3 cursor-pointer group hover:opacity-70 transition-opacity"
        >
          <div className="min-w-0">
            <p className="text-sm text-gray-800 truncate">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.timestamp).toLocaleDateString()}
              {item.source ? ` · ${item.source}` : ''}
              {item.category ? ` · ${item.category}` : ''}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
          >
            <i className="fas fa-trash-alt text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default HistoryList;