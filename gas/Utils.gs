// ============================================================
// Utils.gs — 共通ユーティリティ
// ============================================================

/**
 * UUID v4 生成
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * SHA-256ハッシュ生成（パスワード保存用）
 */
function hashPassword(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

/**
 * パスワード検証
 */
function verifyPassword(plain, hash) {
  return hashPassword(plain) === hash;
}

/**
 * 紹介コード生成（英大文字6文字）
 */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * ISO日時文字列を返す
 */
function nowIso() {
  return new Date().toISOString();
}

/**
 * JSONレスポンスを返す（CORS対応: text/plain）
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 成功レスポンス
 */
function ok(data) {
  return jsonResponse({ ok: true, data: data || null });
}

/**
 * エラーレスポンス
 */
function error(message, code) {
  return jsonResponse({ ok: false, error: message, code: code || 'ERROR' });
}

/**
 * 日本時間の現在日時を YYYY-MM-DD 形式で返す
 */
function todayJst() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return Utilities.formatDate(jst, 'Asia/Tokyo', 'yyyy-MM-dd');
}

/**
 * 月キーを返す (YYYY-MM)
 */
function monthKey(dateStr) {
  return (dateStr || nowIso()).slice(0, 7);
}
