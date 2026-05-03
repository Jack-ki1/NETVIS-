import { create } from 'zustand';

interface UIState {
  activeModule: string;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  isAIChatOpen: boolean;
  setActiveModule: (module: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setAIChatOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'transformer',
  isSidebarOpen: true,
  theme: 'light',
  isAIChatOpen: false,
  setActiveModule: (module) => set({ activeModule: module }),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setAIChatOpen: (open) => set({ isAIChatOpen: open }),
}));
