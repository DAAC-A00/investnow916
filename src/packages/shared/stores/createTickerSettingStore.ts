import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TickerColorMode = 'global' | 'aisa' | 'nothing' | 'shadow';

interface TickerSettingState {
  tickerColorMode: TickerColorMode;
  setTickerColorMode: (mode: TickerColorMode) => void;
}

export const useTickerSettingStore = create<TickerSettingState>()(
  persist(
    (set) => ({
      tickerColorMode: 'global',
      setTickerColorMode: (mode) => set({ tickerColorMode: mode }),
    }),
    {
      name: 'ticker-setting-store',
    }
  )
);
