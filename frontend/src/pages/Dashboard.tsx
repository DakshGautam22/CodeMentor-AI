import React, { useState } from "react";
import { Sidebar } from "../components/Layout/Sidebar";
import { ChatArea } from "../components/Chat/ChatArea";
import { EditorPanel } from "../components/Editor/EditorPanel";
import { SavedSnippets } from "./SavedSnippets";
import { Profile } from "./Profile";
import { Toast } from "../components/Common/Toast";
import { useUiStore } from "../store/uiStore";
import { Settings, Sparkles, X, Terminal } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { themeMode, showToast } = useUiStore();

  const [activeTab, setActiveTab] = useState<"chat" | "snippets">("chat");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Custom system prompt configuration saved in session
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Assistant settings updated", "success");
    setShowSettingsModal(false);
  };

  return (
    <div className={`h-screen w-screen flex bg-dark-950 overflow-hidden font-sans ${themeMode}`}>
      {/* Toast Alert */}
      <Toast />

      {/* Left Sidebar */}
      <Sidebar 
        onShowProfile={() => setShowProfileModal(true)}
        onShowSettings={() => setShowSettingsModal(true)}
        onShowSnippets={() => setActiveTab("snippets")}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Area (Chat or Snippets) */}
      <main className="flex-1 h-full flex overflow-hidden">
        {activeTab === "chat" ? (
          <ChatArea />
        ) : (
          <SavedSnippets onBack={() => setActiveTab("chat")} />
        )}
      </main>

      {/* Right Monaco Editor Panel */}
      <EditorPanel />

      {/* Profile Settings Modal Overlay */}
      {showProfileModal && (
        <Profile onClose={() => setShowProfileModal(false)} />
      )}

      {/* Assistant System settings modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md glass-panel rounded-2xl border border-dark-800 shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-dark-800 flex items-center justify-between bg-dark-950/40">
              <div className="flex items-center gap-2 text-brand-400">
                <Settings className="w-5 h-5 animate-spin-slow" />
                <h2 className="font-semibold text-slate-100">Assistant Configuration</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-white/5 border border-dark-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveSettings} className="p-6 space-y-4">
              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" /> AI Engine Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default - High Speed)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Precision coding reviews)</option>
                </select>
              </div>

              {/* Custom System Instruction prompt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Custom System Prompt
                </label>
                <textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="Inject system guidelines (e.g. 'Use functional programming principles, write types for Python...')"
                  className="w-full h-28 bg-dark-900 border border-dark-800 rounded-xl px-3 py-2 text-sm text-slate-200 resize-none"
                />
                <p className="text-[10px] text-slate-500">
                  Custom guidelines dictate how Gemini responds. Leave blank to use CodeMentor's high-performance default prompt.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 justify-end pt-4 border-t border-dark-800">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="py-2.5 px-4 bg-dark-900 border border-dark-800 hover:border-dark-700 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20 active:scale-[0.98]"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
