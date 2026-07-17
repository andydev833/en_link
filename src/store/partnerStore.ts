// ============================================================
// Partner ストア — En Link MAX版
// GAS APIを優先し、未設定時はダミーデータにフォールバック
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Partner, PartnerBankAccount } from '../types';
import { DUMMY_PARTNERS, DUMMY_BANK_ACCOUNTS } from '../data/dummyData';
import { callGas, isGasConfigured } from '../lib/gasApi';

interface PartnerState {
  partners: Partner[];
  bankAccounts: PartnerBankAccount[];
  currentPartnerId: string | null;
  isPartnerLoggedIn: boolean;
  isLoading: boolean;

  // Auth（GAS未設定時のフォールバック用）
  partnerLogin: (email: string, password: string) => Partner | null;
  partnerLogout: () => void;

  // データ取得
  fetchPartners: () => Promise<void>;
  fetchPartnerDetail: (partnerId: string) => Promise<Partner | null>;

  // CRUD
  registerPartner: (data: Omit<Partner, 'id' | 'createdAt' | 'status' | 'referralCode'>) => Promise<boolean>;
  addPartner: (partner: Partner) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  approvePartner: (id: string) => Promise<void>;
  rejectPartner: (id: string) => Promise<void>;
  suspendPartner: (id: string) => Promise<void>;
  reapprovePartner: (id: string) => Promise<void>;

  // Bank accounts
  saveBankAccount: (account: PartnerBankAccount) => Promise<void>;
  getBankAccount: (partnerId: string) => PartnerBankAccount | undefined;
  fetchBankAccount: (partnerId: string) => Promise<PartnerBankAccount | null>;

  // Getters
  getCurrentPartner: () => Partner | null;
  getPartnerByCode: (code: string) => Partner | undefined;
  getPartnerById: (id: string) => Partner | undefined;
}

export const usePartnerStore = create<PartnerState>()(
  persist(
    (set, get) => ({
      partners: DUMMY_PARTNERS,
      bankAccounts: DUMMY_BANK_ACCOUNTS,
      currentPartnerId: null,
      isPartnerLoggedIn: false,
      isLoading: false,

      // ローカルフォールバック用ログイン（GAS未設定時）
      partnerLogin: (email, password) => {
        const partner = get().partners.find(
          (p) => p.email === email && p.passwordHash === password
        );
        if (partner) {
          set({ currentPartnerId: partner.id, isPartnerLoggedIn: true });
          return partner;
        }
        return null;
      },

      partnerLogout: () => {
        set({ currentPartnerId: null, isPartnerLoggedIn: false });
      },

      fetchPartners: async () => {
        if (!isGasConfigured()) return;
        set({ isLoading: true });
        const res = await callGas<Partner[]>('getPartners', {});
        if (res.success && res.data) {
          set({ partners: res.data });
        }
        set({ isLoading: false });
      },

      fetchPartnerDetail: async (partnerId) => {
        if (!isGasConfigured()) {
          return get().partners.find((p) => p.id === partnerId) || null;
        }
        const res = await callGas<Partner>('getPartnerDetail', { partnerId });
        if (res.success && res.data) {
          // ローカルキャッシュも更新
          set((s) => ({
            partners: s.partners.some((p) => p.id === partnerId)
              ? s.partners.map((p) => (p.id === partnerId ? res.data! : p))
              : [...s.partners, res.data!],
          }));
          return res.data;
        }
        return null;
      },

      registerPartner: async (data) => {
        if (!isGasConfigured()) {
          // フォールバック：ローカルに追加
          const newPartner: Partner = {
            ...data,
            id: `p_${Date.now()}`,
            status: 'pending',
            createdAt: new Date().toISOString(),
            passwordHash: data.passwordHash,
          };
          set((s) => ({ partners: [...s.partners, newPartner] }));
          return true;
        }
        const res = await callGas<{ partnerId: string }>('registerPartner', data);
        return res.success;
      },

      addPartner: (partner) => {
        set((s) => ({ partners: [...s.partners, partner] }));
      },

      updatePartner: (id, updates) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
        if (isGasConfigured()) {
          callGas('updatePartner', { partnerId: id, updates });
        }
      },

      approvePartner: async (id) => {
        const code = `REF${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
        // ローカル即時反映
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? { ...p, status: 'approved', referralCode: p.referralCode || code, approvedAt: new Date().toISOString() }
              : p
          ),
        }));
        if (isGasConfigured()) {
          await callGas('approvePartner', { partnerId: id });
        }
      },

      rejectPartner: async (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? { ...p, status: 'rejected', rejectedAt: new Date().toISOString() }
              : p
          ),
        }));
        if (isGasConfigured()) {
          await callGas('rejectPartner', { partnerId: id });
        }
      },

      suspendPartner: async (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? { ...p, status: 'suspended', suspendedAt: new Date().toISOString() }
              : p
          ),
        }));
        if (isGasConfigured()) {
          await callGas('suspendPartner', { partnerId: id });
        }
      },

      reapprovePartner: async (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? { ...p, status: 'approved', approvedAt: new Date().toISOString(), suspendedAt: undefined, rejectedAt: undefined }
              : p
          ),
        }));
        if (isGasConfigured()) {
          await callGas('approvePartner', { partnerId: id });
        }
      },

      saveBankAccount: async (account) => {
        // ローカル即時反映
        set((s) => {
          const existing = s.bankAccounts.find((b) => b.partnerId === account.partnerId);
          if (existing) {
            return {
              bankAccounts: s.bankAccounts.map((b) =>
                b.partnerId === account.partnerId
                  ? { ...account, updatedAt: new Date().toISOString() }
                  : b
              ),
            };
          }
          return { bankAccounts: [...s.bankAccounts, account] };
        });
        if (isGasConfigured()) {
          await callGas('updatePartnerBankAccount', account as unknown as Record<string, unknown>);
        }
      },

      getBankAccount: (partnerId) => {
        return get().bankAccounts.find((b) => b.partnerId === partnerId);
      },

      fetchBankAccount: async (partnerId) => {
        if (!isGasConfigured()) {
          return get().bankAccounts.find((b) => b.partnerId === partnerId) || null;
        }
        const res = await callGas<PartnerBankAccount>('getPartnerBankAccount', { partnerId });
        if (res.success && res.data) {
          set((s) => {
            const existing = s.bankAccounts.find((b) => b.partnerId === partnerId);
            if (existing) {
              return {
                bankAccounts: s.bankAccounts.map((b) =>
                  b.partnerId === partnerId ? res.data! : b
                ),
              };
            }
            return { bankAccounts: [...s.bankAccounts, res.data!] };
          });
          return res.data;
        }
        return null;
      },

      getCurrentPartner: () => {
        const id = get().currentPartnerId;
        if (!id) return null;
        return get().partners.find((p) => p.id === id) || null;
      },

      getPartnerByCode: (code) => {
        return get().partners.find((p) => p.referralCode === code);
      },

      getPartnerById: (id) => {
        return get().partners.find((p) => p.id === id);
      },
    }),
    { name: 'enlink-partners' }
  )
);
