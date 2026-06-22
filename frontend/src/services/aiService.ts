import api from "./api";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ReviewIssue {
  type: string;
  severity: "high" | "medium" | "low";
  line: number;
  description: string;
}

export interface ReviewReport {
  score: number;
  summary: string;
  issues: ReviewIssue[];
  suggestions: string;
}

export interface CodeReviewResponse {
  id: string;
  code: string;
  language: string;
  report: ReviewReport;
  createdAt: string;
}

export interface SnippetResponse {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: string;
}

/**
 * Reusable utility to handle POST request SSE streams for text tasks (Generate, Explain, Debug, Optimize, Docs).
 */
export const runStreamingAiTask = async (
  endpoint: "generate-code" | "explain-code" | "debug-code" | "optimize-code" | "generate-docs",
  payload: { prompt?: string; code?: string; language: string },
  onToken: (token: string) => void,
  onError: (err: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const token = useAuthStore.getState().token;
  
  const response = await fetch(`${API_URL}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try { errJson = JSON.parse(errText); } catch { }
    throw new Error(errJson?.detail || `HTTP Error ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (reader) {
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "message";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("event:")) {
          currentEvent = trimmed.substring(6).trim();
        } else if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.substring(5).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === "message") {
              onToken(parsed.token || "");
            } else if (currentEvent === "error") {
              onError(parsed.detail || "Streaming error encountered.");
            }
          } catch (e) {
            // Wait for next buffer segment in case of partial JSON
          }
        }
      }
    }
  }
};

/**
 * Submits code for a structured quality review.
 */
export const requestCodeReview = async (code: string, language: string): Promise<CodeReviewResponse> => {
  const response = await api.post("/api/review-code", { code, language });
  const data = response.data;
  return {
    id: data.id || data._id,
    code: data.code,
    language: data.language,
    report: data.report,
    createdAt: data.createdAt
  };
};

/**
 * Retrieves the historical list of code reviews done by the user.
 */
export const getReviewsHistory = async (): Promise<CodeReviewResponse[]> => {
  const response = await api.get("/api/reviews");
  return response.data.map((r: any) => ({
    id: r.id || r._id,
    code: r.code,
    language: r.language,
    report: r.report,
    createdAt: r.createdAt
  }));
};

/**
 * Retrieves all saved code snippets.
 */
export const getSavedSnippets = async (): Promise<SnippetResponse[]> => {
  const response = await api.get("/api/snippets");
  return response.data.map((s: any) => ({
    id: s.id || s._id,
    title: s.title,
    language: s.language,
    code: s.code,
    createdAt: s.createdAt
  }));
};

/**
 * Saves a new snippet.
 */
export const saveCodeSnippet = async (title: string, language: string, code: string): Promise<SnippetResponse> => {
  const response = await api.post("/api/snippets", { title, language, code });
  const data = response.data;
  return {
    id: data.id || data._id,
    title: data.title,
    language: data.language,
    code: data.code,
    createdAt: data.createdAt
  };
};

/**
 * Deletes a saved snippet.
 */
export const deleteSavedSnippet = async (id: string): Promise<void> => {
  await api.delete(`/api/snippets/${id}`);
};
