
import { BiasCategory } from './types';

export const BIAS_COLORS: Record<BiasCategory, string> = {
  'Far Left': '#1e40af', // Blue 800
  'Left': '#3b82f6',    // Blue 500
  'Center': '#10b981',  // Emerald 500
  'Right': '#ef4444',   // Red 500
  'Far Right': '#991b1b', // Red 800
};

export const STORAGE_KEY = 'veribias_analysis_history';
