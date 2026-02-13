/**
 * 主题状态管理
 */
import { create } from 'zustand';
import { Appearance } from 'react-native';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: Appearance.getColorScheme() === 'dark',

  toggleTheme: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
  },

  setDarkMode: (dark) => {
    set({ isDarkMode: dark });
  },
}));
