import React, { useEffect, useState } from "react";
import { getSavedSnippets, deleteSavedSnippet } from "../services/aiService";
import type { SnippetResponse } from "../services/aiService";
import { useEditorStore } from "../store/editorStore";
import { useUiStore } from "../store/uiStore";
import { 
  Bookmark, Search, Trash2, Terminal, Copy, Check, Calendar, 
  ArrowLeft, RefreshCw, CodeXml
} from "lucide-react";

interface SavedSnippetsProps {
  onBack: () => void;
}

export const SavedSnippets: React.FC<SavedSnippetsProps> = ({ onBack }) => {
  const { setCode, setLanguage, setIsOpened } = useEditorStore();
  const { showToast } = useUiStore();

  const [snippets, setSnippets] = useState<SnippetResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSnippets = async () => {
    setLoading(true);
    try {
      const data = await getSavedSnippets();
      setSnippets(data);
    } catch (err) {
      showToast("Failed to fetch saved snippets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this snippet?")) {
      try {
        await deleteSavedSnippet(id);
        setSnippets(snippets.filter((s) => s.id !== id));
        showToast("Snippet deleted successfully", "success");
      } catch (err) {
        showToast("Failed to delete snippet", "error");
      }
    }
  };

  const handleCopy = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoadInEditor = (code: string, language: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCode(code);
    setLanguage(language);
    setIsOpened(true);
    showToast(`Loaded snippet into Monaco Editor (${language})`, "success");
  };

  const filteredSnippets = snippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.language.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-dark-950/20 relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-100/40 dark:bg-dark-950/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 text-slate-550 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 rounded-xl transition-all cursor-pointer"
            title="Back to Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Saved Code Snippets</h1>
          </div>
        </div>
        <button
          onClick={fetchSnippets}
          className="p-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 text-slate-550 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Refresh Snippets"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-dark-800 flex gap-4 bg-slate-100/10 dark:bg-dark-950/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search snippets by title or programming language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25"
          />
        </div>
      </div>

      {/* Grid List content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-dark-950/5">
        {loading && snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500 text-sm">
            <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span>Loading saved snippets...</span>
          </div>
        ) : filteredSnippets.length === 0 ? (
          <div className="text-center py-20 max-w-sm mx-auto flex flex-col items-center gap-4">
            <div className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-400 dark:text-slate-500">
              <CodeXml className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No snippets found</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                {searchQuery ? "No snippets matched your search query." : "Save snippets generated from chats to view them here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSnippets.map((snippet) => (
              <div
                key={snippet.id}
                onClick={(e) => handleLoadInEditor(snippet.code, snippet.language, e)}
                className="glass-card border border-slate-200/80 dark:border-dark-800 rounded-xl p-5 hover:border-brand-500/20 hover:bg-slate-100/40 dark:hover:bg-dark-850/30 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.99] flex flex-col gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-brand-600 dark:text-brand-400 font-mono uppercase bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {snippet.language}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleCopy(snippet.code, snippet.id, e)}
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-slate-800 rounded-lg text-slate-550 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedId === snippet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => handleLoadInEditor(snippet.code, snippet.language, e)}
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-slate-800 rounded-lg text-slate-550 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 cursor-pointer"
                      title="Load into Monaco"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(snippet.id, e)}
                      className="p-1.5 hover:bg-black/5 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                      title="Delete Snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate">{snippet.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-dark-950 p-3 rounded-lg border border-slate-200 dark:border-dark-800 flex-1 overflow-hidden max-h-36">
                  <pre className="text-xs font-mono text-slate-650 dark:text-slate-400 truncate">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
