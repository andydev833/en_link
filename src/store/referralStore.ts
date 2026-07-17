// ============================================================
// Referral ストア — En Link MAX版
// GAS APIを優先し、未設定時はダミーデータにフォールバック
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Referral, ReferralStatus, ExcludeReason } from '../types';
import { DUMMY_REFERRALS } from '../data/dummyData';
import { callGas, isGasConfigured } from '../lib/gasApi';
import { useMenuStore } from './menuStore';

interface ReferralState {
  referrals: Referral[];
  isLoading: boolean;

  // データ取得
  fetchReferrals: () => Promise<void>;
  fetchReferralDetail: (referralId: string) => Promise<Referral | null>;

  // CRUD
  addReferral: (referral: Referral) => void;
  createReferral: (data: Partial<Referral>) => Promise<string | null>;
  updateStatus: (id: string, status: ReferralStatus) => void;
  setContractAmount: (id: string, amount: number) => void;
  markPaid: (id: string) => Promise<void>;
  approveReward: (id: string) => Promise<void>;
  markRewardPaid: (id: string) => void;
  excludeReferral: (id: string, reason: ExcludeReason, memo?: string) => void;
  updateMemo: (id: string, memo: string) => Promise<void>;
  updateSchedule: (id: string, date: string) => void;
  markConsulted: (id: string) => void;

  // カレンダー連携
  createCalendarEvent: (referralId: string) => Promise<{ eventId: string; eventUrl?: string } | null>;

  // Getter
  getReferralsByPartner: (partnerId: string) => Referral[];
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referrals: DUMMY_REFERRALS,
      isLoading: false,

      fetchReferrals: async () => {
        if (!isGasConfigured()) return;
        set({ isLoading: true });
        const res = await callGas<Referral[]>('getReferrals', {});
        if (res.success && res.data) {
          set({ referrals: res.data });
        }
        set({ isLoading: false });
      },

      fetchReferralDetail: async (referralId) => {
        if (!isGasConfigured()) {
          return get().referrals.find((r) => r.id === referralId) || null;
        }
        const res = await callGas<Referral>('getReferralDetail', { referralId });
        if (res.success && res.data) {
          set((s) => ({
            referrals: s.referrals.some((r) => r.id === referralId)
              ? s.referrals.map((r) => (r.id === referralId ? res.data! : r))
              : [...s.referrals, res.data!],
          }));
          return res.data;
        }
        return null;
      },

      addReferral: (referral) => {
        set((s) => ({ referrals: [...s.referrals, referral] }));
      },

      createReferral: async (data) => {
        if (!isGasConfigured()) {
          const newReferral: Referral = {
            id: `r_${Date.now()}`,
            menuId: data.menuId || 'm1',
            customerName: data.customerName || '',
            customerEmail: data.customerEmail || '',
            customerPhone: data.customerPhone || '',
            status: 'inquiry',
            rewardStatus: 'unconfirmed',
            referredAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data,
          };
          set((s) => ({ referrals: [...s.referrals, newReferral] }));
          return newReferral.id;
        }
        const res = await callGas<{ referralId: string }>('createReferralInquiry', data);
        if (res.success && res.data) {
          return res.data.referralId;
        }
        return null;
      },

      updateStatus: (id, status) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
          ),
        }));
        if (isGasConfigured()) {
          callGas('updateReferralStatus', { referralId: id, status });
        }
      },

      setContractAmount: (id, amount) => {
        const menus = useMenuStore.getState().menus;
        const referral = get().referrals.find((r) => r.id === id);
        let rewardAmount = 0;
        if (referral) {
          const menu = menus.find((m) => m.id === referral.menuId);
          if (menu) {
            if (menu.rewardType === 'fixed') {
              rewardAmount = menu.fixedRewardAmount || 0;
            } else if (menu.rewardType === 'percentage') {
              rewardAmount = Math.floor(amount * ((menu.percentageRate || 0) / 100));
            }
          }
        }
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, contractAmount: amount, rewardAmount, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      markPaid: async (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, status: 'paid', contractedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
        if (isGasConfigured()) {
          await callGas('updateReferralStatus', { referralId: id, status: 'contracted' });
          // 報酬自動確定
          await callGas('createRewardOnContracted', { referralId: id });
        }
      },

      approveReward: async (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                ...r,
                status: 'reward_confirmed',
                rewardStatus: 'confirmed',
                approvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              : r
          ),
        }));
        if (isGasConfigured()) {
          await callGas('createRewardOnContracted', { referralId: id });
        }
      },

      markRewardPaid: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                ...r,
                status: 'reward_paid',
                rewardStatus: 'paid',
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              : r
          ),
        }));
        if (isGasConfigured()) {
          callGas('updatePaymentStatus', { referralId: id, status: 'paid' });
        }
      },

      excludeReferral: (id, reason, memo) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                ...r,
                status: 'excluded',
                rewardStatus: 'excluded',
                excludeReason: reason,
                adminMemo: memo || r.adminMemo,
                updatedAt: new Date().toISOString(),
              }
              : r
          ),
        }));
        if (isGasConfigured()) {
          callGas('updateReferralStatus', { referralId: id, status: 'excluded', excludeReason: reason, memo });
        }
      },

      updateMemo: async (id, memo) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, adminMemo: memo, updatedAt: new Date().toISOString() } : r
          ),
        }));
        if (isGasConfigured()) {
          await callGas('updateReferralMemo', { referralId: id, memo });
        }
      },

      updateSchedule: (id, date) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, status: 'scheduled', consultationScheduledAt: date, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
        if (isGasConfigured()) {
          callGas('updateReferralStatus', { referralId: id, status: 'scheduled', consultationScheduledAt: date });
        }
      },

      markConsulted: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, status: 'consulted', consultedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
        if (isGasConfigured()) {
          callGas('updateReferralStatus', { referralId: id, status: 'consulted' });
        }
      },

      createCalendarEvent: async (referralId) => {
        if (!isGasConfigured()) return null;
        const referral = get().referrals.find((r) => r.id === referralId);
        if (!referral) return null;
        const res = await callGas<{ eventId: string; eventUrl?: string }>('createCalendarEvent', {
          referralId,
          customerName: referral.customerName,
          customerPhone: referral.customerPhone,
          customerEmail: referral.customerEmail,
          consultationMethod: referral.consultationMethod,
          scheduledAt: referral.consultationScheduledAt,
          proposalTiming: referral.proposalTiming,
          adminMemo: referral.adminMemo,
        });
        if (res.success && res.data) {
          // calendarEventId を保存
          set((s) => ({
            referrals: s.referrals.map((r) =>
              r.id === referralId
                ? { ...r, calendarEventId: res.data!.eventId, updatedAt: new Date().toISOString() }
                : r
            ),
          }));
          return res.data;
        }
        return null;
      },

      getReferralsByPartner: (partnerId) => {
        return get().referrals.filter((r) => r.partnerId === partnerId);
      },
    }),
    { name: 'enlink-referrals' }
  )
);
