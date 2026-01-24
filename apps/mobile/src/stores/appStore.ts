import { create } from 'zustand';
import { Report } from '@scamsight/shared';

interface AppState {
  // Settings
  reverseImageEnabled: boolean;
  analyticsEnabled: boolean;

  // Current analysis draft
  currentDraft: Partial<Report> | null;

  // Actions
  setReverseImageEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setCurrentDraft: (draft: Partial<Report> | null) => void;
  clearCurrentDraft: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  reverseImageEnabled: false,
  analyticsEnabled: false,
  currentDraft: null,

  // Actions
  setReverseImageEnabled: (enabled) => set({ reverseImageEnabled: enabled }),
  setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  clearCurrentDraft: () => set({ currentDraft: null }),
}));
