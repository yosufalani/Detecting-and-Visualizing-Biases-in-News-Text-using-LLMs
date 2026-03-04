import { AnalysisResult } from "../types";
import { STORAGE_KEY } from "../constants";

const API_BASE = "/api";

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchHistory(): Promise<AnalysisResult[]> {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("Backend unavailable, falling back to LocalStorage");
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export async function runAnalysis(text: string, title: string): Promise<AnalysisResult> {

  // 1️⃣ Call Flask backend (NOT Google directly)
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, title }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  const rawResult = await response.json();

  const result: AnalysisResult = {
    ...rawResult,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    title: title || "Untitled Article",
    originalTextSnippet: text.slice(0, 200) + "..."
  };

  // 2️⃣ Persist to backend
  try {
    const saveResponse = await fetch(`${API_BASE}/analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });

    if (!saveResponse.ok) throw new Error("Backend save failed");
  } catch (e) {
    console.warn("Could not save to Flask backend. Saving to LocalStorage instead.");
    const currentHistory = await fetchHistory();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([result, ...currentHistory]));
  }

  return result;
}

export async function deleteAnalysis(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/analysis/${id}`, {
      method: "DELETE",
    });

    if (response.ok) return;
  } catch (e) {
    console.warn("Backend unavailable for deletion, updating LocalStorage");
  }

  const history = await fetchHistory();
  const filtered = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}