import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "./authStore";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  intent?: string;
  language?: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  isPinned: boolean;
  messageCount: number;
  createdAt: string;
}

interface ChatState {
  chats: ChatHistoryItem[];
  activeChatId: string | null;
  activeMessages: Message[];
  isStreaming: boolean;
  searchQuery: string;
  abortController: AbortController | null;
  isLoading: boolean;
  error: string | null;
  
  fetchHistory: (search?: string) => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createNewChat: () => void;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  togglePinChat: (chatId: string, isPinned: boolean) => Promise<void>;
  sendMessage: (prompt: string, systemPrompt?: string) => Promise<void>;
  cancelStreaming: () => void;
  setSearchQuery: (query: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  activeMessages: [],
  isStreaming: false,
  searchQuery: "",
  abortController: null,
  isLoading: false,
  error: null,

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchHistory(query);
  },

  fetchHistory: async (search) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    
    set({ isLoading: true });
    try {
      const url = search 
        ? `${API_URL}/api/chat/history?search=${encodeURIComponent(search)}`
        : `${API_URL}/api/chat/history`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const chats = response.data.map((c: any) => ({
        id: c.id || c._id,
        title: c.title,
        isPinned: c.isPinned,
        messageCount: c.messageCount,
        createdAt: c.createdAt
      }));
      
      set({ chats, isLoading: false });
    } catch (err: any) {
      set({ error: "Failed to fetch conversation history.", isLoading: false });
    }
  },

  selectChat: async (chatId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // If we select the same chat, don't refetch
    if (get().activeChatId === chatId && get().activeMessages.length > 0) return;

    set({ isLoading: true, activeChatId: chatId, activeMessages: [] });
    try {
      const response = await axios.get(`${API_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ 
        activeMessages: response.data.messages, 
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: "Failed to retrieve conversation details.", isLoading: false });
    }
  },

  createNewChat: () => {
    set({
      activeChatId: null,
      activeMessages: [],
      error: null
    });
  },

  deleteChat: async (chatId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
        activeMessages: state.activeChatId === chatId ? [] : state.activeMessages
      }));
    } catch (err: any) {
      set({ error: "Failed to delete conversation." });
    }
  },

  renameChat: async (chatId, title) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/api/chat/${chatId}`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({
        chats: state.chats.map((c) => c.id === chatId ? { ...c, title } : c)
      }));
    } catch (err: any) {
      set({ error: "Failed to rename conversation." });
    }
  },

  togglePinChat: async (chatId, isPinned) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/api/chat/${chatId}`,
        { isPinned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      set((state) => ({
        chats: state.chats.map((c) => c.id === chatId ? { ...c, isPinned } : c)
      }));
      // Refetch history to apply sort
      get().fetchHistory(get().searchQuery);
    } catch (err: any) {
      set({ error: "Failed to toggle pin state." });
    }
  },

  sendMessage: async (prompt, systemPrompt) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const controller = new AbortController();
    set({ isStreaming: true, abortController: controller, error: null });

    // Append user message immediately
    const userMsg: Message = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString()
    };
    
    set((state) => ({
      activeMessages: [...state.activeMessages, userMsg]
    }));

    // Add placeholder assistant message for streaming
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      activeMessages: [...state.activeMessages, assistantMsg]
    }));

    try {
      const activeChatId = get().activeChatId;
      const queryParams = new URLSearchParams({
        prompt,
        ...(activeChatId && { chatId: activeChatId }),
        ...(systemPrompt && { systemPrompt })
      });

      const response = await fetch(`${API_URL}/api/chat/stream?${queryParams}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = "";
      let parsedChatId = activeChatId;

      if (reader) {
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last partial line in buffer
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
                if (currentEvent === "chatId") {
                  parsedChatId = parsed.chatId;
                  set({ activeChatId: parsedChatId });
                } else if (currentEvent === "message") {
                  streamedResponse += parsed.token || "";
                  
                  // Update the placeholder message content
                  set((state) => {
                    const messages = [...state.activeMessages];
                    if (messages.length > 0) {
                      messages[messages.length - 1] = {
                        ...messages[messages.length - 1],
                        content: streamedResponse
                      };
                    }
                    return { activeMessages: messages };
                  });
                } else if (currentEvent === "error") {
                  set({ error: parsed.detail || "Error streaming response." });
                }
              } catch (e) {
                // Ignore partial JSON parse errors
              }
            }
          }
        }
      }
      
      // Generation finished successfully, refresh sidebar history
      set({ isStreaming: false, abortController: null });
      get().fetchHistory(get().searchQuery);
      
    } catch (err: any) {
      if (err.name === "AbortError") {
        logger.info("Generation cancelled by user.");
      } else {
        set({ error: err.message || "Failed to receive response from assistant." });
      }
      set({ isStreaming: false, abortController: null });
      get().fetchHistory(get().searchQuery);
    }
  },

  cancelStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isStreaming: false, abortController: null });
    }
  }
}));

const logger = {
  info: (msg: string) => console.log(`[ChatStore] ${msg}`)
};
