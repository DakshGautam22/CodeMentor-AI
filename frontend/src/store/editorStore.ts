import { create } from "zustand";

interface EditorState {
  code: string;
  language: string;
  theme: string; // 'vs-dark' or 'light'
  isOpened: boolean;
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
  setIsOpened: (open: boolean) => void;
  toggleOpened: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  code: `// Welcome to CodeMentor AI Editor\n// Select a language or click 'Load to Editor' from the chat area.\n\nfunction greet() {\n  console.log("Hello, developer!");\n}\n\ngreet();\n`,
  language: "javascript",
  theme: "vs-dark",
  isOpened: false,
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language: language.toLowerCase() }),
  setTheme: (theme) => set({ theme }),
  setIsOpened: (isOpened) => set({ isOpened }),
  toggleOpened: () => set((state) => ({ isOpened: !state.isOpened }))
}));
