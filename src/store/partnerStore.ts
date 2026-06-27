import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Partner, PartnerBankAccount } from '../types';
import { DUMMY_PARTNERS, DUMMY_BANK_ACCOUNTS } from '../data/dummyData';

interface PartnerState {
  partners: Partner[];
  bankAccounts: PartnerBankAccount[];
  currentPartnerId: string | null;
  isPartnerLoggedIn: boolean;

  // Auth
  partnerLogin: (email: string, password: string) => Partner | null;
  partnerLogout: () => void;

  // CRUD
  addPartner: (partner: Partner) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  approvePartner: (id: string) => void;
  rejectPartner: (id: string) => void;
  suspendPartner: (id: string) => void;
  reapprovePartner: (id: string) => void;

  // Bank accounts
  saveBankAccount: (account: PartnerBankAccount) => void;
  getBankAccount: (partnerId: string) => PartnerBankAccount | undefined;

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

      addPartner: (partner) => {
        set((s) => ({ partners: [...s.partners, partner] }));
      },

      updatePartner: (id, updates) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      approvePartner: (id) => {
        const code = `REF${Math.random().toString(36).toUpperCase().slice(2, 8)}`;
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'approved',
                  referralCode: p.referralCode || code,
                  approvedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      rejectPartner: (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'rejected',
                  rejectedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      suspendPartner: (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'suspended',
                  suspendedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      reapprovePartner: (id) => {
        set((s) => ({
          partners: s.partners.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: 'approved',
                  approvedAt: new Date().toISOString(),
                  suspendedAt: undefined,
                  rejectedAt: undefined,
                }
              : p
          ),
        }));
      },

      saveBankAccount: (account) => {
        set((s) => {
          const existing = s.bankAccounts.find(
            (b) => b.partnerId === account.partnerId
          );
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
      },

      getBankAccount: (partnerId) => {
        return get().bankAccounts.find((b) => b.partnerId === partnerId);
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
