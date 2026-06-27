// ============================================================
// 型定義 — En Link
// ============================================================

export type PartnerType = 'individual' | 'business';

export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ReferralStatus =
  | 'inquiry'
  | 'scheduling'
  | 'scheduled'
  | 'consulted'
  | 'paid'
  | 'approved'
  | 'reward_confirmed'
  | 'reward_paid'
  | 'lost'
  | 'excluded';

export type RewardStatus = 'unconfirmed' | 'confirmed' | 'paid' | 'excluded';

export type RewardType = 'fixed' | 'percentage' | 'tiered';

export type AccountType = 'ordinary' | 'current';

export type ConsultationMethod = 'in_person' | 'online';

export type ExcludeReason =
  | 'existing_customer'
  | 'already_inquired'
  | 'out_of_menu'
  | 'expired'
  | 'cancelled'
  | 'duplicate'
  | 'self_referral'
  | 'same_household'
  | 'same_company'
  | 'fraud_suspected'
  | 'other';

// ============================================================
// Partner（紹介者）
// ============================================================
export interface Partner {
  id: string;
  partnerType: PartnerType;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  area: string;
  businessCategory?: string;
  customerSegment?: string;
  status: PartnerStatus;
  referralCode?: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  memo?: string;
  passwordHash: string; // MVP: plain text
  notes?: string;
}

export interface PartnerBankAccount {
  id: string;
  partnerId: string;
  bankName: string;
  branchName: string;
  accountType: AccountType;
  accountNumber: string;
  accountHolder: string;
  invoiceRegistrationNumber?: string;
  needsInvoice?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Menu（紹介対象メニュー）
// ============================================================
export interface Menu {
  id: string;
  menuName: string;
  slug: string;
  isActive: boolean;
  isReferralTarget: boolean;
  lpUrl?: string;
  rewardType: RewardType;
  fixedRewardAmount?: number;
  percentageRate?: number;
  consultationFee: number;
  consultationFeeEnabled: boolean;
  consultationFeeCreditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Referral（紹介案件）
// ============================================================
export interface Referral {
  id: string;
  partnerId?: string; // undefined = direct (no referral)
  menuId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerArea?: string;
  proposalTiming?: string;
  budgetRange?: string;
  consultationMethod?: ConsultationMethod;
  consultationPreferredDate1?: string;
  consultationPreferredDate2?: string;
  consultationContent?: string;
  status: ReferralStatus;
  contractAmount?: number;
  rewardAmount?: number;
  rewardStatus: RewardStatus;
  referredAt: string;
  consultationScheduledAt?: string;
  consultedAt?: string;
  contractedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  excludeReason?: ExcludeReason;
  adminMemo?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Reward（報酬）
// ============================================================
export interface Reward {
  id: string;
  referralId: string;
  partnerId: string;
  menuId: string;
  contractAmount: number;
  rewardType: RewardType;
  rewardAmount: number;
  status: RewardStatus;
  confirmedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// ReferralClick（クリック計測）
// ============================================================
export interface ReferralClick {
  id: string;
  partnerId: string;
  menuId: string;
  referralCode: string;
  clickedAt: string;
}

// ============================================================
// Settings（基本設定）
// ============================================================
export interface Settings {
  siteName: string;
  referralExpiryDays: number;
  defaultRewardAmount: number;
  notificationEmail: string;
  referralProgramDescription: string;
  snsDisclosureText: string;
}

// ============================================================
// Auth
// ============================================================
export interface AuthState {
  adminLoggedIn: boolean;
  partnerLoggedIn: boolean;
  currentPartnerId?: string;
}
