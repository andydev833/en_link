import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Menu } from '../types';
import { DUMMY_MENUS } from '../data/dummyData';

interface MenuState {
  menus: Menu[];
  addMenu: (menu: Menu) => void;
  updateMenu: (id: string, updates: Partial<Menu>) => void;
  toggleActive: (id: string) => void;
  getMenuBySlug: (slug: string) => Menu | undefined;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      menus: DUMMY_MENUS,

      addMenu: (menu) => {
        set((s) => ({ menus: [...s.menus, menu] }));
      },

      updateMenu: (id, updates) => {
        set((s) => ({
          menus: s.menus.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },

      toggleActive: (id) => {
        set((s) => ({
          menus: s.menus.map((m) =>
            m.id === id ? { ...m, isActive: !m.isActive } : m
          ),
        }));
      },

      getMenuBySlug: (slug) => {
        return get().menus.find((m) => m.slug === slug);
      },
    }),
    { name: 'enlink-menus' }
  )
);
