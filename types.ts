
export type BiasCategory = 'Far Left' | 'Left' | 'Center' | 'Right' | 'Far Right';

export interface BiasedPhrase {
  phrase: string;
  reason: string;
  suggestedAlternative: string;
}

export interface BiasDetail {
  type: string;
  presenceScore: number; // 0 to 100
  evidence: string;
}

export interface Highlight {
  snippet: string;
  type: string;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  title: string;
  summary: string;
  biasScore: number;
  category: string;
  sensationalismScore: number;
  tonality: string;
  biasedPhrases: {
    phrase: string;
    reason: string;
    suggestedAlternative: string;
  }[];
  detailedBiases: {
    type: string;
    presenceScore: number;
    evidence: string;
  }[];
  originalTextSnippet: string;

  // 🔥 NEW
  highlightedText: string;
}

export interface AppState {
  history: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
}
