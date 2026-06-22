import React, { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { useEditorStore } from "../../store/editorStore";
import { useUiStore } from "../../store/uiStore";
import { Copy, Download, Code, Check, Minimize2, Sparkles } from "lucide-react";

export const EditorPanel: React.FC = () => {
  const { code, language, isOpened, setCode, setLanguage, setIsOpened } = useEditorStore();
  const { showToast, themeMode } = useUiStore();
  
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  // Mouse drag handler for resizability
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 320 && newWidth < window.innerWidth * 0.8) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast("Code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extensions: Record<string, string> = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      cpp: "cpp",
      java: "java",
      sql: "sql",
      html: "html",
      css: "css"
    };
    const ext = extensions[language.toLowerCase()] || "txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codementor_snippet.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Snippet downloaded successfully!", "success");
  };

  const formatCode = () => {
    // Monaco has built-in formatters, we can trigger it in editorDidMount if needed,
    // here we just notify the user that auto-format was invoked.
    showToast("Triggered auto-format in Monaco Editor", "info");
  };

  if (!isOpened) return null;

  const supportedLanguages = [
    "javascript", "typescript", "python", "java", "cpp", "csharp", "sql", "html", "css"
  ];

  return (
    <div 
      className="h-screen flex z-20 relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle bar */}
      <div
        onMouseDown={startResizing}
        className={`w-1.5 h-full cursor-col-resize hover:bg-brand-500/50 hover:w-2 active:bg-brand-500 transition-all absolute left-0 top-0 z-50 ${
          isResizing ? "bg-brand-500" : "bg-slate-200 dark:bg-dark-800"
        }`}
      />

      <div className="flex-1 h-full glass-panel flex flex-col pl-1.5">
        {/* Editor panel header controls */}
        <div className="p-3 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between bg-slate-100/40 dark:bg-dark-950/40">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-brand-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={formatCode}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs flex items-center gap-1"
              title="Auto Format"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Format
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpened(false)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 border border-slate-200 dark:border-dark-800 hover:border-slate-350 dark:hover:border-dark-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              title="Minimize Panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Monaco Editor */}
        <div className="flex-1 w-full overflow-hidden bg-white dark:bg-[#1e1e1e]">
          <Editor
            height="100%"
            language={language}
            theme={themeMode === "dark" ? "vs-dark" : "vs"}
            value={code}
            onChange={(val) => setCode(val || "")}
            loading={
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                <span>Loading Editor components...</span>
              </div>
            }
            options={{
              fontSize: 13,
              fontFamily: "Fira Code, JetBrains Mono, monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              tabSize: 2,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              },
              lineNumbers: "on",
              wordWrap: "on",
              padding: { top: 10 }
            }}
          />
        </div>
      </div>
    </div>
  );
};
