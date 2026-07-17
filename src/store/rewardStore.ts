// ============================================================
// 報酬・月次管理ストア — En Link MAX版
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { callGas, isGasConfigured } from '../lib/gasApi';
import type { RewardStatus } from '../types';

export interface Reward {
  rewardId: string;
  referralId: string;
  partnerId: string;
  menuId: string;
  rewardAmount: number;
  rewardStatus: RewardStatus | 'unpaid' | 'scheduled' | 'hold';
  closingMonth: string; // YYYY-MM
  paymentDueDate?: string;
  paidAt?: string;
  paymentMemo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyRewardSummary {
  summaryId: string;
  closingMonth: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  totalContractCount: number;
  totalRewardAmount: number;
  paymentStatus: 'unpaid' | 'scheduled' | 'paid' | 'hold' | 'excluded';
  paymentDueDate?: string;
  paidAt?: string;
  csvExportedAt?: string;
  // 振込先情報
  bankName?: string;
  bankCode?: string;
  branchName?: string;
  branchCode?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountHolderKana?: string;
}

interface RewardStoreState {
  rewards: Reward[];
  monthlySummaries: MonthlyRewardSummary[];
  selectedMonth: string; // YYYY-MM
  isLoading: boolean;

  setSelectedMonth: (month: string) => void;
  fetchRewards: () => Promise<void>;
  fetchMonthlyRewards: (month: string) => Promise<void>;
  updatePaymentStatus: (summaryId: string, status: MonthlyRewardSummary['paymentStatus'], paidAt?: string) => Promise<void>;
  setPaymentDueDate: (summaryId: string, date: string) => Promise<void>;
  exportCsv: (month: string) => Promise<void>;
  markRewardPaid: (id: string) => void; // referralId版（既存互換）
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const useRewardStore = create<RewardStoreState>()(
  persist(
    (set, get) => ({
      rewards: [],
      monthlySummaries: [],
      selectedMonth: getCurrentMonth(),
      isLoading: false,

      setSelectedMonth: (month) => set({ selectedMonth: month }),

      fetchRewards: async () => {
        if (!isGasConfigured()) return;
        set({ isLoading: true });
        const res = await callGas<Reward[]>('getRewards', {});
        if (res.success && res.data) {
          set({ rewards: res.data });
        }
        set({ isLoading: false });
      },

      fetchMonthlyRewards: async (month) => {
        if (!isGasConfigured()) return;
        set({ isLoading: true, selectedMonth: month });
        const res = await callGas<MonthlyRewardSummary[]>('getMonthlyRewards', { closingMonth: month });
        if (res.success && res.data) {
          set({ monthlySummaries: res.data });
        }
        set({ isLoading: false });
      },

      updatePaymentStatus: async (summaryId, status, paidAt) => {
        // ローカル即時反映
        set((s) => ({
          monthlySummaries: s.monthlySummaries.map((m) =>
            m.summaryId === summaryId
              ? { ...m, paymentStatus: status, paidAt: paidAt || m.paidAt }
              : m
          ),
        }));
        if (isGasConfigured()) {
          await callGas('updatePaymentStatus', { summaryId, status, paidAt });
        }
      },

      setPaymentDueDate: async (summaryId, date) => {
        set((s) => ({
          monthlySummaries: s.monthlySummaries.map((m) =>
            m.summaryId === summaryId ? { ...m, paymentDueDate: date } : m
          ),
        }));
        if (isGasConfigured()) {
          await callGas('updatePaymentStatus', { summaryId, paymentDueDate: date });
        }
      },

      exportCsv: async (month) => {
        const summaries = get().monthlySummaries.filter((m) => m.closingMonth === month);
        if (isGasConfigured()) {
          await callGas('exportRewardCsv', { closingMonth: month });
          // csvExportedAt 更新
          const now = new Date().toISOString();
          set((s) => ({
            monthlySummaries: s.monthlySummaries.map((m) =>
              m.closingMonth === month ? { ...m, csvExportedAt: now } : m
            ),
          }));
        }
        // ローカルCSV出力（フォールバック兼用）
        const rows = summaries.map((m) => ({
          対象年月: m.closingMonth,
          紹介者ID: m.partnerId,
          紹介者名: m.partnerName,
          メールアドレス: m.partnerEmail,
          金融機関名: m.bankName || '—',
          金融機関コード: m.bankCode || '—',
          支店名: m.branchName || '—',
          支店コード: m.branchCode || '—',
          口座種別: m.accountType || '—',
          口座番号: m.accountNumber || '—',
          口座名義: m.accountHolder || '—',
          口座名義カナ: m.accountHolderKana || '—',
          成約件数: m.totalContractCount,
          支払金額: m.totalRewardAmount,
          支払予定日: m.paymentDueDate || '—',
        }));
        const { default: Papa } = await import('papaparse');
        const csv = Papa.unparse(rows);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rewards_${month}.csv`;
        link.click();
      },

      markRewardPaid: (id) => {
        // referralIdベースの旧互換メソッド
        set((s) => ({
          rewards: s.rewards.map((r) =>
            r.referralId === id
              ? { ...r, rewardStatus: 'paid', paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r
          ),
        }));
      },
    }),
    { name: 'enlink-rewards' }
  )
);
