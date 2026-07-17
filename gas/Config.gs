// ============================================================
// Config.gs — スプレッドシートID・システム設定
// ============================================================
// 【設定必須】各シートのスプレッドシートIDを入力してください

const CONFIG = {
  // --- スプレッドシートID ---
  SPREADSHEET_ID: {
    PARTNERS:  'YOUR_PARTNERS_SPREADSHEET_ID',   // ①紹介者マスタ
    REFERRALS: 'YOUR_REFERRALS_SPREADSHEET_ID',  // ②紹介案件
    REWARDS:   'YOUR_REWARDS_SPREADSHEET_ID',    // ③報酬管理
    LP_EVENTS: 'YOUR_LP_EVENTS_SPREADSHEET_ID',  // ④LP計測
    SETTINGS:  'YOUR_SETTINGS_SPREADSHEET_ID',   // ⑤システム設定
    SESSIONS:  'YOUR_SESSIONS_SPREADSHEET_ID',   // ⑥セッション（認証）
  },

  // --- システム設定 ---
  STUDIO_NAME: 'スタジオうえじ',
  STUDIO_EMAIL: 'info@studio-ueji.com',
  ADMIN_EMAIL: 'admin@ueji.jp',
  SITE_BASE_URL: 'https://andydev833.github.io/en_link',
  ADMIN_URL: 'https://andydev833.github.io/en_link/admin',
  PARTNER_URL: 'https://andydev833.github.io/en_link/partner',
  LP_URL: 'https://andydev833.github.io/en_link/propose',

  // --- 認証設定 ---
  ADMIN_PASSWORD_HASH: 'pbkdf2_admin1234', // 変更必須: MD5(パスワード)
  SESSION_EXPIRY_HOURS: 24,

  // --- 報酬設定 ---
  DEFAULT_REWARD_AMOUNT: 30000,
  REFERRAL_EXPIRY_DAYS: 90,

  // --- Googleカレンダー設定 ---
  CALENDAR_ID: 'primary', // または特定のカレンダーID
};

/**
 * シートIDからSpreadsheetを取得するユーティリティ
 */
function getSpreadsheet(key) {
  const id = CONFIG.SPREADSHEET_ID[key];
  if (!id || id.startsWith('YOUR_')) {
    throw new Error(`スプレッドシートID "${key}" が設定されていません。Config.gsを確認してください。`);
  }
  return SpreadsheetApp.openById(id);
}
