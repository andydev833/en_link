// ============================================================
// Code.gs — メインエントリーポイント（doPost / doGet）
// ============================================================
// このファイルがGASのメインファイルです。
// すべてのHTTPリクエストをここで受け取り、各処理ファイルに振り分けます。

/**
 * POSTリクエストのエントリーポイント
 * リクエストボディ: JSON { action: string, payload: Object }
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload = {} } = body;

    Logger.log(`[${new Date().toISOString()}] action: ${action}`);

    return routeAction(action, payload);
  } catch (err) {
    Logger.log('doPost エラー: ' + err.message + '\n' + err.stack);
    return error('サーバーエラーが発生しました: ' + err.message, 'SERVER_ERROR');
  }
}

/**
 * GETリクエストのエントリーポイント（公開エンドポイント用）
 * ?action=getLpContents のような形式でも受け取れる
 */
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    const payload = {};

    // クエリパラメータをpayloadとして使用
    Object.keys(e.parameter).forEach(k => {
      if (k !== 'action') payload[k] = e.parameter[k];
    });

    if (action === 'getLpContents') {
      return getLpContents(payload);
    }

    // デフォルト: ヘルスチェック
    return ok({ status: 'ok', timestamp: nowIso() });
  } catch (err) {
    return error('サーバーエラー: ' + err.message, 'SERVER_ERROR');
  }
}

/**
 * actionをルーティングする
 */
function routeAction(action, payload) {
  switch (action) {

    // --- 認証 ---
    case 'loginAdmin':              return loginAdmin(payload);
    case 'loginPartner':            return loginPartner(payload);
    case 'logout':                  return logoutUser(payload);
    case 'changeAdminPassword':     return changeAdminPassword(payload);

    // --- 紹介者管理 ---
    case 'registerPartner':         return registerPartner(payload);
    case 'getPartners':             return getPartners(payload);
    case 'getPartnerDashboard':     return getPartnerDashboard(payload);
    case 'approvePartner':          return approvePartner(payload);
    case 'rejectPartner':           return rejectPartner(payload);
    case 'suspendPartner':          return suspendPartner(payload);
    case 'reapprovePartner':        return reapprovePartner(payload);
    case 'updatePartnerMemo':       return updatePartnerMemo(payload);
    case 'updatePartnerBankAccount': return updatePartnerBankAccount(payload);
    case 'getPartnerBankAccount':   return getPartnerBankAccount(payload);

    // --- 紹介案件管理 ---
    case 'createReferralInquiry':   return createReferralInquiry(payload);
    case 'getReferrals':            return getReferrals(payload);
    case 'getReferralDetail':       return getReferralDetail(payload);
    case 'updateReferralStatus':    return updateReferralStatus(payload);
    case 'excludeReferral':         return excludeReferral(payload);
    case 'updateReferralMemo':      return updateReferralMemo(payload);
    case 'setContractAmount':       return setContractAmount(payload);
    case 'approveReward':           return approveReward(payload);
    case 'markRewardPaid':          return markRewardPaid(payload);

    // --- LP計測 ---
    case 'trackLpEvent':            return trackLpEvent(payload);
    case 'trackLpEventBatch':       return trackLpEventBatch(payload);

    // --- LP分析 ---
    case 'getAnalyticsSummary':     return getAnalyticsSummary(payload);
    case 'getDailyAccessTrend':     return getDailyAccessTrend(payload);
    case 'getSourceAnalytics':      return getSourceAnalytics(payload);
    case 'getPartnerAnalytics':     return getPartnerAnalytics(payload);
    case 'getDeviceAnalytics':      return getDeviceAnalytics(payload);
    case 'getSectionViewAnalytics': return getSectionViewAnalytics(payload);

    // --- CMS・設定 ---
    case 'getLpContents':           return getLpContents(payload);
    case 'getLpContentsForAdmin':   return getLpContentsForAdmin(payload);
    case 'updateLpContent':         return updateLpContent(payload);
    case 'getSystemSettings':       return getSystemSettings(payload);
    case 'updateSystemSettings':    return updateSystemSettings(payload);
    case 'getNotificationTemplates': return getNotificationTemplates(payload);
    case 'updateNotificationTemplate': return updateNotificationTemplate(payload);

    // --- Googleカレンダー ---
    case 'createCalendarEvent':     return createCalendarEvent(payload);
    case 'updateCalendarEvent':     return updateCalendarEvent(payload);

    // --- 未知のアクション ---
    default:
      Logger.log('未知のaction: ' + action);
      return error(`未知のアクション: ${action}`, 'UNKNOWN_ACTION');
  }
}

/**
 * 初期セットアップ関数
 * GASスクリプトエディタから手動で一度だけ実行してください
 */
function setup() {
  Logger.log('=== En Link GAS セットアップ開始 ===');

  try {
    // 各スプレッドシートのシートを初期化
    ['PARTNERS', 'REFERRALS', 'SETTINGS', 'LP_EVENTS', 'SESSIONS'].forEach(key => {
      try {
        const ss = getSpreadsheet(key);
        Logger.log(`✓ ${key}: ${ss.getName()}`);
      } catch (e) {
        Logger.log(`✗ ${key}: ${e.message}`);
      }
    });

    // 紹介者シート初期化
    const partnerSheet = getPartnerSheet();
    Logger.log(`紹介者シート行数: ${partnerSheet.getLastRow()}`);

    // 管理者認証情報初期化
    const ss = getSpreadsheet('SETTINGS');
    const credSheet = getOrCreateSheet(ss, 'admin_credentials', ['email', 'passwordHash', 'updatedAt']);
    const existing = findRow(credSheet, r => r.email === CONFIG.ADMIN_EMAIL);
    if (!existing) {
      appendRow(credSheet, {
        email: CONFIG.ADMIN_EMAIL,
        passwordHash: hashPassword('admin1234'),
        updatedAt: nowIso(),
      }, ['email', 'passwordHash', 'updatedAt']);
      Logger.log('✓ 管理者認証情報を初期化しました（パスワード: admin1234）');
    }

    // CMSコンテンツ初期化
    getLpContents({});
    Logger.log('✓ CMSコンテンツを初期化しました');

    Logger.log('=== セットアップ完了 ===');
  } catch (e) {
    Logger.log('セットアップエラー: ' + e.message);
  }
}
