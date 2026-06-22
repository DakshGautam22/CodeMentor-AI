import React, { useEffect, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { useEditorStore } from "../../store/editorStore";
import { 
  Plus, MessageSquare, Trash2, Edit2, Check, X, Pin, PinOff, 
  Search, Bookmark, Settings, LogOut, ChevronLeft, ChevronRight, User, Terminal
} from "lucide-react";

interface SidebarProps {
  onShowProfile: () => void;
  onShowSettings: () => void;
  onShowSnippets: () => void;
  activeTab: "chat" | "snippets";
  setActiveTab: (tab: "chat" | "snippets") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onShowProfile, 
  onShowSettings, 
  onShowSnippets,
  activeTab,
  setActiveTab
}) => {
  const { user, logout } = useAuthStore();
  const { 
    chats, activeChatId, fetchHistory, 
    selectChat, createNewChat, deleteChat, renameChat, togglePinChat, setSearchQuery 
  } = useChatStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { toggleOpened: toggleEditor, isOpened: editorOpened } = useEditorStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      await renameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteChat(id);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePinChat(id, !isPinned);
  };

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-40 p-2 glass-panel hover:bg-dark-800 border border-dark-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all shadow-xl"
        title="Expand Sidebar"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-80 h-screen glass-panel border-r border-dark-800 flex flex-col z-30 transition-all duration-300 relative flex-shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            CodeMentor AI
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-white/5 border border-transparent hover:border-dark-800 rounded-lg text-slate-400 hover:text-slate-200"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex flex-col gap-2">
        <button
          onClick={() => {
            setActiveTab("chat");
            createNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 px-4 font-medium shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-dark-900 border border-dark-800 rounded-lg mt-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === "chat" 
                ? "bg-dark-800 text-slate-100 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Chats
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("snippets");
              onShowSnippets();
            }}
            className={`py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === "snippets" 
                ? "bg-dark-800 text-slate-100 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Snippets
            </span>
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        <>
          {/* Search bar */}
          <div className="px-4 mb-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-7 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-900/50 border border-dark-800/80 rounded-xl text-sm placeholder:text-slate-500"
            />
          </div>

          {/* History Scroll List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No chats found
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = activeChatId === chat.id;
                const isEditing = editingId === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      isActive
                        ? "bg-brand-500/10 border-brand-500/20 text-brand-300"
                        : "border-transparent hover:bg-dark-850 hover:border-dark-800/50 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      {chat.isPinned ? (
                        <Pin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 rotate-45" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-slate-500 group-hover:text-slate-400 flex-shrink-0" />
                      )}

                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveRename(chat.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 w-full min-w-0"
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-dark-950 border border-brand-500/50 text-slate-100 text-xs rounded-md px-1.5 py-0.5 w-full focus:outline-none"
                            autoFocus
                          />
                          <button type="submit" className="p-0.5 hover:bg-brand-500/20 rounded text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={handleCancelRename} className="p-0.5 hover:bg-white/5 rounded text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <span className="text-sm truncate font-medium">
                          {chat.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (only show when not editing) */}
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleTogglePin(chat.id, chat.isPinned, e)}
                          className="p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-slate-300"
                          title={chat.isPinned ? "Unpin Chat" : "Pin Chat"}
                        >
                          {chat.isPinned ? (
                            <PinOff className="w-3.5 h-3.5" />
                          ) : (
                            <Pin className="w-3.5 h-3.5 rotate-45" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleStartRename(chat.id, chat.title, e)}
                          className="p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-slate-300"
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(chat.id, e)}
                          className="p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-rose-400"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-2 text-sm text-slate-400">
          <p className="text-xs text-slate-500 text-center py-4">Click Snippets at the top tab to view and manage saved snippets.</p>
        </div>
      )}

      {/* Footer / User Profile section */}
      <div className="mt-auto border-t border-dark-800 p-3 bg-dark-950/40 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div 
            onClick={onShowProfile}
            className="flex items-center gap-2.5 p-1.5 hover:bg-white/5 rounded-xl cursor-pointer transition-colors min-w-0 flex-1 mr-2"
          >
            <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center flex-shrink-0 text-brand-400">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onShowSettings}
              className="p-1.5 hover:bg-white/5 border border-transparent hover:border-dark-800 rounded-lg text-slate-400 hover:text-slate-200"
              title="Assistant Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 hover:bg-rose-950/15 border border-transparent hover:border-rose-900/10 rounded-lg text-slate-400 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toggle Editor Shortcut */}
        <button
          onClick={toggleEditor}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
            editorOpened 
              ? "bg-brand-500/15 border-brand-500/30 text-brand-400" 
              : "bg-dark-900 border-dark-800 text-slate-400 hover:bg-dark-850 hover:text-slate-300"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          {editorOpened ? "Hide Editor Panel" : "Show Editor Panel"}
        </button>
      </div>
    </aside>
  );
};
