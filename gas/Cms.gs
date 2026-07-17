// ============================================================
// Cms.gs — LPコンテンツCMS管理
// ============================================================

const CMS_HEADERS = ['key', 'value', 'type', 'label', 'updatedAt', 'updatedBy'];

function getCmsSheet() {
  const ss = getSpreadsheet('SETTINGS');
  return getOrCreateSheet(ss, 'lp_contents', CMS_HEADERS);
}

// デフォルトコンテンツ
const DEFAULT_LP_CONTENTS = [
  { key: 'hero_title',         type: 'text',     label: 'ヒーロータイトル',       value: 'プロポーズに、物語を。' },
  { key: 'hero_subtitle',      type: 'text',     label: 'ヒーローサブタイトル',   value: 'スタジオうえじのプロポーズ撮影・演出サポート' },
  { key: 'hero_cta_text',      type: 'text',     label: 'ヒーローCTAテキスト',   value: 'まずは無料で相談する' },
  { key: 'price_start',        type: 'text',     label: '料金（開始）',            value: '¥80,000〜' },
  { key: 'price_full',         type: 'text',     label: '料金（フルパッケージ）', value: '¥120,000〜' },
  { key: 'studio_name',        type: 'text',     label: 'スタジオ名',             value: 'スタジオうえじ' },
  { key: 'studio_location',    type: 'text',     label: '所在地',                 value: '奈良県' },
  { key: 'faq_1_q',            type: 'text',     label: 'FAQ①Q',                 value: '当日の流れを教えてください' },
  { key: 'faq_1_a',            type: 'textarea', label: 'FAQ①A',                 value: 'まずは無料相談から。当日の演出・撮影の流れをご説明します。' },
  { key: 'faq_2_q',            type: 'text',     label: 'FAQ②Q',                 value: '場所はどこですか？' },
  { key: 'faq_2_a',            type: 'textarea', label: 'FAQ②A',                 value: '奈良・大阪・京都対応可能です。まずはご相談ください。' },
  { key: 'thanks_title',       type: 'text',     label: '申込完了タイトル',       value: 'ありがとうございます！' },
  { key: 'thanks_body',        type: 'textarea', label: '申込完了本文',           value: '相談申込を受け付けました。2〜3営業日以内にご連絡いたします。' },
  { key: 'hero_image_url',     type: 'image',    label: 'ヒーロー画像URL',        value: '' },
  { key: 'chapel_image_url',   type: 'image',    label: 'チャペル画像URL',        value: '' },
  { key: 'surprise_image_url', type: 'image',    label: 'サプライズ画像URL',      value: '' },
];

/**
 * LPコンテンツを全件取得
 * payload: {} (公開エンドポイント・認証不要)
 */
function getLpContents(payload) {
  const sheet = getCmsSheet();
  const rows = sheetToObjects(sheet);

  // シートが空の場合はデフォルト値を初期化して返す
  if (rows.length === 0) {
    const now = nowIso();
    DEFAULT_LP_CONTENTS.forEach(item => {
      appendRow(sheet, { ...item, updatedAt: now, updatedBy: 'system' }, CMS_HEADERS);
    });
    return ok(DEFAULT_LP_CONTENTS.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {}));
  }

  const contents = {};
  rows.forEach(r => { contents[r.key] = r.value; });
  return ok(contents);
}

/**
 * LPコンテンツ一覧（管理者用・メタ情報付き）
 * payload: { token }
 */
function getLpContentsForAdmin(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getCmsSheet();
  const rows = sheetToObjects(sheet);

  if (rows.length === 0) {
    return ok(DEFAULT_LP_CONTENTS);
  }

  return ok(rows);
}

/**
 * LPコンテンツ更新
 * payload: { token, key, value }
 */
function updateLpContent(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getCmsSheet();
  const existing = findRow(sheet, r => r.key === payload.key);

  const updates = {
    value: payload.value,
    updatedAt: nowIso(),
    updatedBy: session.email,
  };

  if (existing) {
    // keyカラムをIDとして更新
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyCol = headers.indexOf('key');
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyCol] === payload.key) {
        Object.keys(updates).forEach(k => {
          const col = headers.indexOf(k);
          if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[k]);
        });
        break;
      }
    }
  } else {
    const defaults = DEFAULT_LP_CONTENTS.find(d => d.key === payload.key);
    appendRow(sheet, {
      key: payload.key,
      value: payload.value,
      type: defaults ? defaults.type : 'text',
      label: defaults ? defaults.label : payload.key,
      ...updates,
    }, CMS_HEADERS);
  }

  return ok({ message: 'コンテンツを更新しました' });
}

/**
 * システム設定（一般設定）の取得・更新
 * payload: { token, settings?: Object }
 */
function getSystemSettings(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'system_settings', ['key', 'value', 'updatedAt']);
  const rows = sheetToObjects(sheet);

  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return ok(settings);
}

function updateSystemSettings(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'system_settings', ['key', 'value', 'updatedAt']);
  const now = nowIso();

  Object.entries(payload.settings || {}).forEach(([key, value]) => {
    const existing = findRow(sheet, r => r.key === key);
    if (existing) {
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const keyCol = headers.indexOf('key');
      for (let i = 1; i < data.length; i++) {
        if (data[i][keyCol] === key) {
          sheet.getRange(i + 1, headers.indexOf('value') + 1).setValue(value);
          sheet.getRange(i + 1, headers.indexOf('updatedAt') + 1).setValue(now);
          break;
        }
      }
    } else {
      appendRow(sheet, { key, value, updatedAt: now }, ['key', 'value', 'updatedAt']);
    }
  });

  return ok({ message: '設定を保存しました' });
}

/**
 * 通知テンプレート取得
 * payload: { token }
 */
function getNotificationTemplates(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'notification_templates', ['key', 'subject', 'body', 'updatedAt']);
  const rows = sheetToObjects(sheet);
  const templates = {};
  rows.forEach(r => { templates[r.key] = { subject: r.subject, body: r.body }; });
  return ok(templates);
}

/**
 * 通知テンプレート更新
 * payload: { token, key, subject, body }
 */
function updateNotificationTemplate(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'notification_templates', ['key', 'subject', 'body', 'updatedAt']);
  const existing = findRow(sheet, r => r.key === payload.key);
  const now = nowIso();

  if (existing) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const keyCol = headers.indexOf('key');
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyCol] === payload.key) {
        sheet.getRange(i + 1, headers.indexOf('subject') + 1).setValue(payload.subject);
        sheet.getRange(i + 1, headers.indexOf('body') + 1).setValue(payload.body);
        sheet.getRange(i + 1, headers.indexOf('updatedAt') + 1).setValue(now);
        break;
      }
    }
  } else {
    appendRow(sheet, { key: payload.key, subject: payload.subject, body: payload.body, updatedAt: now },
      ['key', 'subject', 'body', 'updatedAt']);
  }

  return ok({ message: 'テンプレートを更新しました' });
}
