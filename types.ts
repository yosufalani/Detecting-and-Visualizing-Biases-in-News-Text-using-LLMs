export type BiasCategory = 'Far Left' | 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right' | 'Far Right';

export interface BiasedPhrase {
  phrase: string;
  reason: string;
  suggestedAlternative: string;
}

export interface BiasDetail {
  type: string;
  presenceScore: number; // 0 to 100
  evidence: string;
  confidence?: number;
  phrases?: BiasedPhrase[];
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

  // biasScore now carries the real -100 to +100 political direction value
  biasScore: number;

  // category now reflects actual left/right label from direction prompt
  category: string;

  // direction details
  directionLabel: string;
  directionConfidence: number;

  sensationalismScore: number;
  tonality: string;
  biasedPhrases: BiasedPhrase[];
  detailedBiases: BiasDetail[];
  originalTextSnippet: string;
  highlightedText: string;
  framingScore: number;
  confidence: number;
  strengths: string[];
}

export interface AppState {
  history: AnalysisResult[];
  isAnalyzing: boolean;
  error: string | null;
}