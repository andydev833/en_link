// ============================================================
// LP計測・CMS ストア — En Link MAX版
// ============================================================

import { create } from 'zustand';
import { callGas, isGasConfigured } from '../lib/gasApi';

// -------------------------------------------------------
// LP イベント
// -------------------------------------------------------
export type LpEventType =
  | 'page_view'
  | 'unique_visit'
  | 'section_view'
  | 'cta_click'
  | 'form_view'
  | 'form_start'
  | 'form_submit'
  | 'form_abandon';

export interface LpEventPayload {
  eventType: LpEventType;
  sectionKey?: string;
  pageId?: string;
  menuId?: string;
  partnerId?: string;
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  deviceType?: string;
  sessionId?: string;
  visitorId?: string;
}

// -------------------------------------------------------
// CMS コンテンツ
// -------------------------------------------------------
export type ContentType = 'text' | 'textarea' | 'image' | 'rich_text';

export interface LpContent {
  contentId: string;
  pageId: string;
  sectionId?: string;
  fieldKey: string;
  fieldLabel: string;
  contentType: ContentType;
  contentValue: string;
  imageUrl?: string;
  isActive: boolean;
  updatedAt: string;
}

// -------------------------------------------------------
// デフォルトCMSコンテンツ（GAS未設定時）
// -------------------------------------------------------
const DEFAULT_LP_CONTENTS: LpContent[] = [
  { contentId: 'c1', pageId: 'propose', fieldKey: 'hero_title', fieldLabel: 'メインコピー', contentType: 'text', contentValue: '一生に一度の瞬間を、\n特別な場所で。', isActive: true, updatedAt: '' },
  { contentId: 'c2', pageId: 'propose', fieldKey: 'hero_subtitle', fieldLabel: 'サブコピー', contentType: 'textarea', contentValue: '奈良・大阪を中心に、式場チャペルで叶えるプロポーズ演出。\n撮影だけでなく、花束・指輪を渡すタイミング・当日の流れまで、事前にご相談いただけます。', isActive: true, updatedAt: '' },
  { contentId: 'c3', pageId: 'propose', fieldKey: 'cta_text', fieldLabel: 'CTAボタン文言', contentType: 'text', contentValue: 'まずは無料で相談する', isActive: true, updatedAt: '' },
  { contentId: 'c4', pageId: 'propose', fieldKey: 'hero_image', fieldLabel: 'ファーストビュー画像URL', contentType: 'image', contentValue: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600', isActive: true, updatedAt: '' },
  { contentId: 'c5', pageId: 'propose', fieldKey: 'chapel_title', fieldLabel: 'チャペル訴求タイトル', contentType: 'text', contentValue: '式場チャペルで、\n特別なプロポーズを。', isActive: true, updatedAt: '' },
  { contentId: 'c6', pageId: 'propose', fieldKey: 'chapel_body', fieldLabel: 'チャペル訴求文', contentType: 'textarea', contentValue: '奈良・大阪の指定式場チャペルをご利用いただけます。雨天でも屋内で実施でき、当日の流れを事前にご一緒に整理します。', isActive: true, updatedAt: '' },
  { contentId: 'c7', pageId: 'propose', fieldKey: 'surprise_title', fieldLabel: 'サプライズ演出タイトル', contentType: 'text', contentValue: 'サプライズに気づかれにくい\n自然な演出を設計します。', isActive: true, updatedAt: '' },
  { contentId: 'c8', pageId: 'propose', fieldKey: 'surprise_body', fieldLabel: 'サプライズ演出説明文', contentType: 'textarea', contentValue: 'モデル撮影という体で自然に呼び出せます。花束・指輪を渡すタイミングから、入場からプロポーズまでの流れを一緒に作ります。', isActive: true, updatedAt: '' },
  { contentId: 'c9', pageId: 'propose', fieldKey: 'price_base', fieldLabel: '料金（基本）', contentType: 'text', contentValue: '80,000', isActive: true, updatedAt: '' },
  { contentId: 'c10', pageId: 'propose', fieldKey: 'price_note', fieldLabel: '料金注意書き', contentType: 'textarea', contentValue: '上記は撮影料金のみの目安です。チャペル利用、花束、演出内容、オプション、撮影内容により総額は変動します。詳細・お見積りは無料相談後にご案内します。', isActive: true, updatedAt: '' },
  { contentId: 'c11', pageId: 'propose', fieldKey: 'thanks_title', fieldLabel: '申込完了タイトル', contentType: 'text', contentValue: 'ありがとうございます', isActive: true, updatedAt: '' },
  { contentId: 'c12', pageId: 'propose', fieldKey: 'thanks_body', fieldLabel: '申込完了メッセージ', contentType: 'textarea', contentValue: 'ご相談のお申込みを受け付けました。\nスタジオうえじより、2〜3営業日以内にメールまたはお電話でご連絡します。', isActive: true, updatedAt: '' },
  { contentId: 'c13', pageId: 'propose', fieldKey: 'partner_template_line', fieldLabel: '紹介テンプレート（LINE用）', contentType: 'textarea', contentValue: 'プロポーズを考えている方に、ぜひご紹介したいサービスがあります。式場チャペルでのプロポーズ演出・撮影の相談ができるスタジオです。花束や当日の流れまで一緒に相談できて、特別な瞬間を作れます。よかったら見てみてください👇', isActive: true, updatedAt: '' },
];

// -------------------------------------------------------
// ストア
// -------------------------------------------------------
interface LpStore {
  contents: LpContent[];
  isLoadingContents: boolean;
  sessionId: string;
  visitorId: string;

  // CMS
  fetchContents: (pageId?: string) => Promise<void>;
  getContent: (fieldKey: string) => string;
  updateContent: (contentId: string, value: string) => Promise<boolean>;

  // 計測
  trackEvent: (payload: LpEventPayload) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// セッション・ビジターIDはストアの外で管理
function getOrCreateId(key: string): string {
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = generateId();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export const useLpStore = create<LpStore>()((set, get) => ({
  contents: DEFAULT_LP_CONTENTS,
  isLoadingContents: false,
  sessionId: getOrCreateId('enlink_session'),
  visitorId: (() => {
    let id = localStorage.getItem('enlink_visitor');
    if (!id) { id = generateId(); localStorage.setItem('enlink_visitor', id); }
    return id;
  })(),

  fetchContents: async (pageId = 'propose') => {
    if (!isGasConfigured()) return;
    set({ isLoadingContents: true });
    const res = await callGas<LpContent[]>('getLpContent', { pageId });
    if (res.success && res.data) {
      set({ contents: res.data });
    }
    set({ isLoadingContents: false });
  },

  getContent: (fieldKey) => {
    const content = get().contents.find((c) => c.fieldKey === fieldKey);
    return content?.contentValue ?? '';
  },

  updateContent: async (contentId, value) => {
    // ローカル即時反映
    set((s) => ({
      contents: s.contents.map((c) =>
        c.contentId === contentId
          ? { ...c, contentValue: value, updatedAt: new Date().toISOString() }
          : c
      ),
    }));
    if (!isGasConfigured()) return true;
    const res = await callGas('updateLpContent', { contentId, contentValue: value });
    return res.success;
  },

  trackEvent: (payload) => {
    const { sessionId, visitorId } = get();
    const enriched = {
      ...payload,
      sessionId,
      visitorId,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.slice(0, 100),
    };
    // 非同期でGASへ送信（失敗しても無視）
    if (isGasConfigured()) {
      callGas('trackLpEvent', enriched).catch(() => {});
    }
    // 開発時ログ
    if (import.meta.env.DEV) {
      console.log('[LP Event]', enriched);
    }
  },
}));
