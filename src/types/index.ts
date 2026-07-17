// ============================================================
// 型定義 — En Link MAX版
// ============================================================

export type PartnerType = 'individual' | 'business';

export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type ReferralStatus =
  | 'inquiry'
  | 'scheduling'
  | 'scheduled'
  | 'consulted'
  | 'proposed'      // 提案/見積提示済み
  | 'contracted'    // 成約/決済確認済み
  | 'paid'          // 旧互換
  | 'approved'      // 旧互換
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

export type IntroductionChannel = 'store' | 'sns' | 'line' | 'existing_customer' | 'business_partner' | 'other';

// ============================================================
// Partner（紹介者）— MAX版
// ============================================================
export interface Partner {
  id: string;
  partnerType?: PartnerType;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  area: string;
  businessCategory?: string;
  businessType?: string;        // 業種
  customerSegment?: string;
  mainArea?: string;            // 主な紹介エリア
  introductionChannels?: IntroductionChannel[]; // 紹介チャネル
  websiteUrl?: string;
  instagramAccount?: string;
  status: PartnerStatus;
  referralCode?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  memo?: string;
  notes?: string;
  passwordHash: string;
  // 同意フラグ
  agreedTerms?: boolean;
  agreedAdPolicy?: boolean;
  agreedAntiSocial?: boolean;
}

// ============================================================
// PartnerBankAccount — MAX版（要件定義書 14.3）
// ============================================================
export interface PartnerBankAccount {
  id?: string;
  partnerId: string;
  bankName: string;
  bankCode?: string;
  branchName: string;
  branchCode?: string;
  accountType: AccountType;
  accountNumber: string;
  accountHolder: string;
  accountHolderKana?: string;
  invoiceRegistrationNumber?: string;
  needsInvoice?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Menu（紹介対象メニュー）— MAX版
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
  consultationFeeEnabled: boolean;       // isPaidConsultation
  consultationFeeCreditable: boolean;   // isConsultationFeeDeductible
  isRewardTarget?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Referral（紹介案件）— MAX版
// ============================================================
export interface Referral {
  id: string;
  partnerId?: string;
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
  inquiryMessage?: string;
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
  // UTM/流入元
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  // Googleカレンダー
  calendarEventId?: string;
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
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  deviceType?: string;
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
// Auth（後方互換）
// ============================================================
export interface AuthState {
  adminLoggedIn: boolean;
  partnerLoggedIn: boolean;
  currentPartnerId?: string;
}
