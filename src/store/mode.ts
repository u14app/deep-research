import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResearchMode = 'general' | 'professional';

interface ModeState {
  mode: ResearchMode;
  setMode: (mode: ResearchMode) => void;
  isGeneralMode: () => boolean;
  isProfessionalMode: () => boolean;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'general',

      setMode: (mode) => set({ mode }),

      isGeneralMode: () => get().mode === 'general',

      isProfessionalMode: () => get().mode === 'professional',
    }),
    {
      name: 'research-mode-storage',
    }
  )
);
