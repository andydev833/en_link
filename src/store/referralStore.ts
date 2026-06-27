import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Referral, ReferralStatus, RewardStatus, ExcludeReason } from '../types';
import { DUMMY_REFERRALS } from '../data/dummyData';
import { useMenuStore } from './menuStore';

interface ReferralState {
  referrals: Referral[];
  addReferral: (referral: Referral) => void;
  updateStatus: (id: string, status: ReferralStatus) => void;
  setContractAmount: (id: string, amount: number) => void;
  markPaid: (id: string) => void;
  approveReward: (id: string) => void;
  markRewardPaid: (id: string) => void;
  excludeReferral: (id: string, reason: ExcludeReason, memo?: string) => void;
  updateMemo: (id: string, memo: string) => void;
  updateSchedule: (id: string, date: string) => void;
  markConsulted: (id: string) => void;
  getReferralsByPartner: (partnerId: string) => Referral[];
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referrals: DUMMY_REFERRALS,

      addReferral: (referral) => {
        set((s) => ({ referrals: [...s.referrals, referral] }));
      },

      updateStatus: (id, status) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? { ...r, status, updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },

      setContractAmount: (id, amount) => {
        // 報酬計算
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
              ? {
                  ...r,
                  contractAmount: amount,
                  rewardAmount,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      markPaid: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'paid',
                  contractedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      approveReward: (id) => {
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
      },

      updateMemo: (id, memo) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id ? { ...r, adminMemo: memo, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      updateSchedule: (id, date) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'scheduled',
                  consultationScheduledAt: date,
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      markConsulted: (id) => {
        set((s) => ({
          referrals: s.referrals.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'consulted',
                  consultedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      getReferralsByPartner: (partnerId) => {
        return get().referrals.filter((r) => r.partnerId === partnerId);
      },
    }),
    { name: 'enlink-referrals' }
  )
);
