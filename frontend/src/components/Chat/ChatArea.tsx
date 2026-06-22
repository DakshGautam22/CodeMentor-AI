import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore } from "../../store/chatStore";
import { useEditorStore } from "../../store/editorStore";
import { useUiStore } from "../../store/uiStore";
import { saveCodeSnippet, requestCodeReview } from "../../services/aiService";
import { 
  Send, Square, Sparkles, Paperclip, Copy, Check, 
  Terminal, ShieldAlert, Cpu, HelpCircle, Code, RefreshCw, Bookmark, X
} from "lucide-react";

export const ChatArea: React.FC = () => {
  const { 
    activeMessages, isStreaming, error, sendMessage, cancelStreaming 
  } = useChatStore();
  
  const { setCode, setLanguage, setIsOpened } = useEditorStore();
  const { showToast } = useUiStore();

  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; language: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const messagesCount = activeMessages.length;

  // Smooth scroll to bottom when a new message is added
  useEffect(() => {
    if (messagesCount > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShouldAutoScroll(true);
    }
  }, [messagesCount]);

  // Keep content scrolled to bottom during streaming (using instant 'auto' to prevent jitter)
  useEffect(() => {
    if (isStreaming && shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [activeMessages, isStreaming, shouldAutoScroll]);

  // Detect when user manually scrolls up to pause auto-scrolling
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if user is near the bottom (within 150px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    let finalPrompt = input;
    if (attachedFile) {
      finalPrompt = `I have uploaded a file named \`${attachedFile.name}\` (${attachedFile.language}):\n\n\`\`\`${attachedFile.language}\n${attachedFile.content}\n\`\`\`\n\n${input}`;
    }

    setInput("");
    setAttachedFile(null);
    await sendMessage(finalPrompt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const nameMap: Record<string, string> = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      cpp: "cpp",
      h: "cpp",
      java: "java",
      sql: "sql",
      html: "html",
      css: "css",
      txt: "plaintext"
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: text,
        language: nameMap[extension] || "plaintext"
      });
      showToast(`Attached file: ${file.name}`, "success");
    };
    reader.readAsText(file);
    
    // Clear input value to allow uploading same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRegenerate = () => {
    // Find the last user message to regenerate
    const userMessages = activeMessages.filter(m => m.role === "user");
    if (userMessages.length > 0) {
      const lastUserPrompt = userMessages[userMessages.length - 1].content;
      sendMessage(lastUserPrompt);
    }
  };

  // Reusable custom code block renderer for ReactMarkdown
  const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [auditing, setAuditing] = useState(false);

    const copyToClipboard = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast("Code copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    };

    const loadIntoMonaco = () => {
      setCode(code);
      setLanguage(language);
      setIsOpened(true);
      showToast(`Loaded into Monaco Editor (${language})`, "success");
    };

    const handleSaveSnippet = async () => {
      try {
        await saveCodeSnippet(`Snippet: ${language}`, language, code);
        setSaved(true);
        showToast("Snippet saved successfully!", "success");
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        showToast("Failed to save snippet", "error");
      }
    };

    const handleAuditCode = async () => {
      setAuditing(true);
      showToast("Starting code audit...", "info");
      try {
        const review = await requestCodeReview(code, language);
        setCode(JSON.stringify(review.report, null, 2));
        setLanguage("json");
        setIsOpened(true);
        showToast(`Audit complete! Score: ${review.report.score}/100. Results loaded in editor.`, "success");
      } catch (err) {
        showToast("Failed to audit code", "error");
      } finally {
        setAuditing(false);
      }
    };

    return (
      <div className="my-4 border border-dark-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-dark-900 px-4 py-2 border-b border-dark-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold font-mono text-[10px] uppercase text-brand-400 tracking-wider">
            {language}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleAuditCode} 
              disabled={auditing}
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-brand-400 flex items-center gap-1"
              title="Audit Code Quality"
            >
              <Cpu className={`w-3.5 h-3.5 ${auditing ? "animate-spin" : ""}`} />
              <span>Audit</span>
            </button>
            <button 
              onClick={handleSaveSnippet} 
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-emerald-400 flex items-center gap-1"
              title="Save Snippet"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>
            <button 
              onClick={loadIntoMonaco} 
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-brand-400 flex items-center gap-1"
              title="Load into Editor"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button 
              onClick={copyToClipboard} 
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-brand-400"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="bg-dark-950 p-4 overflow-x-auto">
          <pre className="text-sm font-mono text-slate-300">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    );
  };

  const QuickStartCard: React.FC<{ 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    prompt: string 
  }> = ({ title, description, icon, prompt }) => {
    return (
      <div
        onClick={() => setInput(prompt)}
        className="glass-card border border-dark-800 rounded-xl p-4 hover:border-brand-500/30 hover:bg-dark-850/40 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98] group flex flex-col gap-2"
      >
        <div className="p-2 w-9 h-9 rounded-lg bg-dark-900 text-brand-400 group-hover:bg-brand-500/10 transition-colors flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-dark-950/20 relative">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6"
      >
        {activeMessages.length === 0 ? (
          /* Dashboard Landing State */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-10">
            <div className="text-center mb-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 glowing-glow">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                What can I build for you today?
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                I am your CodeMentor AI Coding Assistant. Generate, document, review, debug, or optimize algorithms instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QuickStartCard
                title="Explain Binary Search"
                description="Learn theoretical algorithms step-by-step."
                icon={<HelpCircle className="w-4 h-4" />}
                prompt="Explain the Binary Search algorithm and teach me how to analyze its Big O complexities."
              />
              <QuickStartCard
                title="Debug a Python Function"
                description="Find logical errors or edge case bugs."
                icon={<ShieldAlert className="w-4 h-4" />}
                prompt="Find the bug in this Python snippet:\n```python\ndef average(scores):\n  return sum(scores) / len(scores)\n```"
              />
              <QuickStartCard
                title="Generate REST API"
                description="Create modern backend services quickly."
                icon={<Code className="w-4 h-4" />}
                prompt="Generate a clean FastAPI REST endpoint with pydantic schemas to register a user."
              />
              <QuickStartCard
                title="Optimize SQL Query"
                description="Speed up indexes or slow execution joins."
                icon={<Cpu className="w-4 h-4" />}
                prompt="Optimize this SQL query for execution performance:\n```sql\nSELECT * FROM users WHERE active = true ORDER BY name;\n```"
              />
            </div>
          </div>
        ) : (
          /* Conversation bubbles */
          <div className="max-w-3xl mx-auto space-y-6">
            {activeMessages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex gap-4 ${isUser ? "justify-end animate-fade-in-up" : "animate-fade-in-up"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/25 flex items-center justify-center flex-shrink-0 text-brand-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-brand-500 text-white rounded-tr-none"
                        : "glass-card text-slate-200 border border-dark-800 rounded-tl-none markdown-body"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap font-medium">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeStr = String(children).replace(/\n$/, "");
                            const isInline = !match;
                            return !isInline ? (
                              <CodeBlock code={codeStr} language={match[1]} />
                            ) : (
                              <code className={`${className} bg-dark-900 border border-dark-800 rounded px-1.5 py-0.5 text-xs text-brand-300 font-mono`} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}

                    {/* Timestamp */}
                    <div className="text-[9px] text-slate-500 mt-2 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-dark-850 border border-dark-850 flex items-center justify-center flex-shrink-0 text-slate-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* SSE typing bubble */}
            {isStreaming && activeMessages[activeMessages.length - 1]?.content === "" && (
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/25 flex items-center justify-center flex-shrink-0 text-brand-400">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="glass-card text-slate-400 px-5 py-3 rounded-2xl rounded-tl-none border border-dark-800 flex items-center gap-1">
                  <span className="text-xs">Thinking</span>
                  <div className="typing-indicator flex items-center mt-1 ml-1">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-4 bg-rose-950/15 border border-rose-900/35 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Generation Error:</span> {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar section */}
      <div className="p-4 bg-dark-950/40 border-t border-dark-800/80">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex flex-col gap-2 relative">
          
          {/* File Attachment indicator pill */}
          {attachedFile && (
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/25 rounded-lg px-2.5 py-1 text-xs text-brand-400 max-w-fit animate-fade-in-up">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="font-medium truncate max-w-[180px]">{attachedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setAttachedFile(null)} 
                className="hover:text-rose-400 transition-colors ml-1 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".py,.js,.ts,.cpp,.h,.java,.sql,.html,.css,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-dark-900 border border-dark-800 hover:border-dark-700 text-slate-400 hover:text-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
              title="Attach Code File (.py, .js, .cpp, etc.)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a coding question or paste your code..."
                disabled={isStreaming}
                className="w-full pl-4 pr-12 py-3 bg-dark-900 border border-dark-800 rounded-xl text-sm placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
              />
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={cancelStreaming}
                  className="absolute right-2 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-all active:scale-95 shadow-md shadow-rose-500/20 flex items-center justify-center"
                  title="Cancel Generation"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && !attachedFile}
                  className="absolute right-2 p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-brand-500 disabled:scale-100 disabled:shadow-none hover:scale-105 active:scale-95 shadow-lg shadow-brand-500/20 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Helper toolbar for active chats */}
          {activeMessages.length > 0 && !isStreaming && (
            <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 mt-1">
              <span>CodeMentor uses Google Gemini API</span>
              <button 
                type="button" 
                onClick={handleRegenerate}
                className="hover:text-brand-400 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate last response
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
