// ============================================================
// Auth.gs — 認証処理（管理者・紹介者）
// ============================================================

const SESSION_HEADERS = ['token', 'userId', 'role', 'email', 'createdAt', 'expiresAt'];

function getSessionSheet() {
  const ss = getSpreadsheet('SESSIONS');
  return getOrCreateSheet(ss, 'sessions', SESSION_HEADERS);
}

// ---------- 管理者ログイン ----------

/**
 * 管理者ログイン
 * payload: { email, password }
 */
function loginAdmin(payload) {
  const { email, password } = payload;

  // 管理者は設定値で照合（シート不要）
  if (email !== CONFIG.ADMIN_EMAIL) {
    return error('メールアドレスまたはパスワードが正しくありません', 'INVALID_CREDENTIALS');
  }
  // パスワード検証 (初回はプレーンテキスト比較、以降ハッシュ)
  const ss = getSpreadsheet('SETTINGS');
  const settingsSheet = getOrCreateSheet(ss, 'admin_credentials', ['email', 'passwordHash', 'updatedAt']);
  let credentials = findRow(settingsSheet, r => r.email === email);

  if (!credentials) {
    // 初期設定: デフォルトパスワードで登録
    const defaultHash = hashPassword('admin1234');
    appendRow(settingsSheet, { email, passwordHash: defaultHash, updatedAt: nowIso() }, ['email', 'passwordHash', 'updatedAt']);
    credentials = { email, passwordHash: defaultHash };
  }

  if (!verifyPassword(password, credentials.passwordHash)) {
    return error('メールアドレスまたはパスワードが正しくありません', 'INVALID_CREDENTIALS');
  }

  const token = createSession('admin', email, 'admin');
  return ok({ token, role: 'admin', email });
}

// ---------- 紹介者ログイン ----------

/**
 * 紹介者ログイン
 * payload: { email, password }
 */
function loginPartner(payload) {
  const { email, password } = payload;

  const ss = getSpreadsheet('PARTNERS');
  const sheet = getOrCreateSheet(ss, 'partners', PARTNER_HEADERS);
  const partner = findRow(sheet, r => r.email === email && r.deletedAt === '');

  if (!partner) {
    return error('メールアドレスまたはパスワードが正しくありません', 'INVALID_CREDENTIALS');
  }

  if (!verifyPassword(password, String(partner.passwordHash))) {
    return error('メールアドレスまたはパスワードが正しくありません', 'INVALID_CREDENTIALS');
  }

  if (partner.status === 'rejected') {
    return error('このアカウントは否認されています', 'ACCOUNT_REJECTED');
  }
  if (partner.status === 'suspended') {
    return error('このアカウントは停止されています', 'ACCOUNT_SUSPENDED');
  }

  const token = createSession(partner.id, email, 'partner');
  return ok({ token, role: 'partner', email, partnerId: partner.id, status: partner.status });
}

// ---------- セッション管理 ----------

/**
 * セッショントークンを作成して保存する
 */
function createSession(userId, email, role) {
  const token = generateUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  const sheet = getSessionSheet();
  appendRow(sheet, {
    token,
    userId: String(userId),
    role,
    email,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }, SESSION_HEADERS);
  return token;
}

/**
 * トークンを検証する
 * @returns {Object|null} { userId, role, email } or null
 */
function verifySession(token) {
  if (!token) return null;
  const sheet = getSessionSheet();
  const session = findRow(sheet, r => r.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  return { userId: session.userId, role: session.role, email: session.email };
}

/**
 * ログアウト（セッション削除）
 * payload: { token }
 */
function logoutUser(payload) {
  const { token } = payload;
  const sheet = getSessionSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const tokenCol = headers.indexOf('token');

  for (let i = 1; i < data.length; i++) {
    if (data[i][tokenCol] === token) {
      sheet.deleteRow(i + 1);
      return ok({ message: 'ログアウトしました' });
    }
  }
  return ok({ message: 'セッションが見つかりませんでした' });
}

/**
 * パスワード変更
 * payload: { token, currentPassword, newPassword }
 */
function changeAdminPassword(payload) {
  const { token, currentPassword, newPassword } = payload;
  const session = verifySession(token);
  if (!session || session.role !== 'admin') {
    return error('認証が必要です', 'UNAUTHORIZED');
  }

  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'admin_credentials', ['email', 'passwordHash', 'updatedAt']);
  const credentials = findRow(sheet, r => r.email === session.email);

  if (!credentials || !verifyPassword(currentPassword, credentials.passwordHash)) {
    return error('現在のパスワードが正しくありません', 'INVALID_CREDENTIALS');
  }

  updateRowById(sheet, session.email, {
    passwordHash: hashPassword(newPassword),
    updatedAt: nowIso(),
  }, ['email', 'passwordHash', 'updatedAt']);

  return ok({ message: 'パスワードを変更しました' });
}
