import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../data/dummyData';

interface SettingsState {
  settings: Settings;
  isAdminLoggedIn: boolean;
  updateSettings: (updates: Partial<Settings>) => void;
  adminLogin: (email: string, password: string) => boolean;
  adminLogout: () => void;
}

const ADMIN_EMAIL = 'admin@ueji.jp';
const ADMIN_PASSWORD = 'admin1234';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isAdminLoggedIn: false,

      updateSettings: (updates) => {
        set((s) => ({ settings: { ...s.settings, ...updates } }));
      },

      adminLogin: (email, password) => {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          set({ isAdminLoggedIn: true });
          return true;
        }
        return false;
      },

      adminLogout: () => {
        set({ isAdminLoggedIn: false });
      },
    }),
    { name: 'enlink-settings' }
  )
);
