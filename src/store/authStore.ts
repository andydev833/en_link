// ============================================================
// 認証ストア — En Link MAX版
// 管理者・紹介者両方の認証状態を管理
// GAS_URLが設定されていない場合はダミーログインにフォールバック
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { callGas, isGasConfigured } from '../lib/gasApi';

// ダミー認証情報（GAS未設定時のフォールバック）
const DUMMY_ADMIN_EMAIL = 'admin@ueji.jp';
const DUMMY_ADMIN_PASSWORD = 'admin1234';

export interface AuthSession {
  userId: string;
  role: 'admin' | 'partner';
  token?: string;
  expiresAt?: string;
}

interface AuthState {
  // 管理者
  isAdminLoggedIn: boolean;
  adminSession: AuthSession | null;

  // 紹介者
  isPartnerLoggedIn: boolean;
  partnerSession: AuthSession | null;
  currentPartnerId: string | null;

  // 管理者認証
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;

  // 紹介者認証
  partnerLogin: (email: string, password: string) => Promise<{ success: boolean; partnerId?: string; error?: string }>;
  partnerLogout: () => void;

  // セッション確認
  getCurrentPartnerId: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAdminLoggedIn: false,
      adminSession: null,
      isPartnerLoggedIn: false,
      partnerSession: null,
      currentPartnerId: null,

      adminLogin: async (email, password) => {
        if (!isGasConfigured()) {
          // GAS未設定時はダミー認証
          if (email === DUMMY_ADMIN_EMAIL && password === DUMMY_ADMIN_PASSWORD) {
            const session: AuthSession = {
              userId: 'admin',
              role: 'admin',
              token: 'dummy-admin-token',
            };
            set({ isAdminLoggedIn: true, adminSession: session });
            return true;
          }
          return false;
        }

        const res = await callGas<{ token: string; userId: string }>('loginAdmin', { email, password });
        if (res.success && res.data) {
          const session: AuthSession = {
            userId: res.data.userId,
            role: 'admin',
            token: res.data.token,
          };
          set({ isAdminLoggedIn: true, adminSession: session });
          return true;
        }
        return false;
      },

      adminLogout: () => {
        set({ isAdminLoggedIn: false, adminSession: null });
      },

      partnerLogin: async (email, password) => {
        if (!isGasConfigured()) {
          // GAS未設定時はpartnerStoreのダミーデータで認証
          return { success: false, error: 'GAS_URL_NOT_SET' };
        }

        const res = await callGas<{ token: string; partnerId: string }>('loginPartner', { email, password });
        if (res.success && res.data) {
          const session: AuthSession = {
            userId: res.data.partnerId,
            role: 'partner',
            token: res.data.token,
          };
          set({
            isPartnerLoggedIn: true,
            partnerSession: session,
            currentPartnerId: res.data.partnerId,
          });
          return { success: true, partnerId: res.data.partnerId };
        }
        return { success: false, error: res.error || 'ログインに失敗しました' };
      },

      partnerLogout: () => {
        set({ isPartnerLoggedIn: false, partnerSession: null, currentPartnerId: null });
      },

      getCurrentPartnerId: () => {
        return get().currentPartnerId;
      },
    }),
    { name: 'enlink-auth' }
  )
);
