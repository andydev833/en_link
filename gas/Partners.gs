// ============================================================
// Partners.gs — 紹介者管理
// ============================================================

const PARTNER_HEADERS = [
  'id', 'partnerType', 'name', 'companyName', 'email', 'phone', 'area',
  'businessCategory', 'businessType', 'customerSegment', 'instagramAccount',
  'introductionChannels', 'status', 'referralCode', 'passwordHash',
  'memo', 'adminMemo', 'notes',
  'agreedTerms', 'agreedAdPolicy', 'agreedAntiSocial',
  'createdAt', 'approvedAt', 'rejectedAt', 'suspendedAt', 'deletedAt',
];

const BANK_HEADERS = [
  'id', 'partnerId', 'bankName', 'bankCode', 'branchName', 'branchCode',
  'accountType', 'accountNumber', 'accountHolder', 'accountHolderKana',
  'invoiceRegistrationNumber', 'updatedAt',
];

function getPartnerSheet() {
  const ss = getSpreadsheet('PARTNERS');
  return getOrCreateSheet(ss, 'partners', PARTNER_HEADERS);
}

function getBankSheet() {
  const ss = getSpreadsheet('PARTNERS');
  return getOrCreateSheet(ss, 'bank_accounts', BANK_HEADERS);
}

// ---------- 登録 ----------

/**
 * 紹介者登録申請
 * payload: { partnerType, name, companyName?, email, phone, area, businessCategory?,
 *            businessType?, customerSegment?, instagramAccount?, introductionChannels?,
 *            notes?, password, agreedTerms, agreedAdPolicy, agreedAntiSocial }
 */
function registerPartner(payload) {
  const sheet = getPartnerSheet();

  // メールアドレスの重複チェック
  const existing = findRow(sheet, r => r.email === payload.email && r.deletedAt === '');
  if (existing) {
    return error('このメールアドレスはすでに登録されています', 'DUPLICATE_EMAIL');
  }

  const id = generateUUID();
  const partner = {
    id,
    partnerType:           payload.partnerType || 'individual',
    name:                  payload.name,
    companyName:           payload.companyName || '',
    email:                 payload.email,
    phone:                 payload.phone,
    area:                  payload.area,
    businessCategory:      payload.businessCategory || '',
    businessType:          payload.businessType || '',
    customerSegment:       payload.customerSegment || '',
    instagramAccount:      payload.instagramAccount || '',
    introductionChannels:  Array.isArray(payload.introductionChannels)
                             ? payload.introductionChannels.join(',')
                             : (payload.introductionChannels || ''),
    status:                'pending',
    referralCode:          '',
    passwordHash:          hashPassword(payload.password),
    memo:                  payload.notes || '',
    adminMemo:             '',
    notes:                 payload.notes || '',
    agreedTerms:           payload.agreedTerms ? 'TRUE' : 'FALSE',
    agreedAdPolicy:        payload.agreedAdPolicy ? 'TRUE' : 'FALSE',
    agreedAntiSocial:      payload.agreedAntiSocial ? 'TRUE' : 'FALSE',
    createdAt:             nowIso(),
    approvedAt:            '',
    rejectedAt:            '',
    suspendedAt:           '',
    deletedAt:             '',
  };

  appendRow(sheet, partner, PARTNER_HEADERS);

  // 通知メール送信
  try {
    sendApplicationReceivedMail(partner);
    sendApplicationNotifyMail(partner);
  } catch (e) {
    Logger.log('メール送信エラー: ' + e.message);
  }

  return ok({ id, message: '登録申請を受け付けました' });
}

// ---------- 一覧・詳細 ----------

/**
 * 紹介者一覧取得
 * payload: { token, status? }
 */
function getPartners(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  let partners = sheetToObjects(sheet).filter(p => p.deletedAt === '');

  if (payload.status) {
    partners = partners.filter(p => p.status === payload.status);
  }

  return ok(partners.map(formatPartner));
}

/**
 * 紹介者詳細取得（紹介者本人用）
 * payload: { token }
 */
function getPartnerDashboard(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'partner') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  const partner = findRowById(sheet, session.userId);
  if (!partner) return error('紹介者が見つかりません', 'NOT_FOUND');

  const bankSheet = getBankSheet();
  const bank = findRow(bankSheet, r => r.partnerId === session.userId) || null;

  return ok({ partner: formatPartner(partner), bankAccount: bank });
}

// ---------- 審査操作 ----------

/**
 * 承認
 * payload: { token, partnerId }
 */
function approvePartner(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  const partner = findRowById(sheet, payload.partnerId);
  if (!partner) return error('紹介者が見つかりません', 'NOT_FOUND');

  // 紹介コード生成（一意チェック付き）
  let code = generateReferralCode();
  let attempts = 0;
  while (findRow(sheet, r => r.referralCode === code) && attempts < 10) {
    code = generateReferralCode();
    attempts++;
  }

  updateRowById(sheet, payload.partnerId, {
    status: 'approved',
    referralCode: code,
    approvedAt: nowIso(),
  }, PARTNER_HEADERS);

  const updatedPartner = findRowById(sheet, payload.partnerId);

  // 承認メール送信
  try {
    sendApprovedMail(formatPartner(updatedPartner));
  } catch (e) {
    Logger.log('承認メール送信エラー: ' + e.message);
  }

  return ok({ message: '承認しました', referralCode: code });
}

/**
 * 否認
 * payload: { token, partnerId, reason? }
 */
function rejectPartner(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  updateRowById(sheet, payload.partnerId, {
    status: 'rejected',
    rejectedAt: nowIso(),
  }, PARTNER_HEADERS);

  const updatedPartner = findRowById(sheet, payload.partnerId);
  try {
    sendRejectedMail(formatPartner(updatedPartner));
  } catch (e) {
    Logger.log('否認メール送信エラー: ' + e.message);
  }

  return ok({ message: '否認しました' });
}

/**
 * 停止
 * payload: { token, partnerId }
 */
function suspendPartner(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  updateRowById(sheet, payload.partnerId, {
    status: 'suspended',
    suspendedAt: nowIso(),
  }, PARTNER_HEADERS);

  return ok({ message: '停止しました' });
}

/**
 * 再承認
 * payload: { token, partnerId }
 */
function reapprovePartner(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  updateRowById(sheet, payload.partnerId, {
    status: 'approved',
    approvedAt: nowIso(),
    rejectedAt: '',
    suspendedAt: '',
  }, PARTNER_HEADERS);

  return ok({ message: '再承認しました' });
}

/**
 * 管理メモ更新
 * payload: { token, partnerId, adminMemo }
 */
function updatePartnerMemo(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getPartnerSheet();
  updateRowById(sheet, payload.partnerId, { adminMemo: payload.adminMemo }, PARTNER_HEADERS);
  return ok({ message: '更新しました' });
}

// ---------- 振込先情報 ----------

/**
 * 振込先情報登録・更新（紹介者本人）
 * payload: { token, bankName, bankCode, branchName, branchCode,
 *            accountType, accountNumber, accountHolder, accountHolderKana,
 *            invoiceRegistrationNumber? }
 */
function updatePartnerBankAccount(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'partner') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getBankSheet();
  const existing = findRow(sheet, r => r.partnerId === session.userId);

  const bankData = {
    id:                       existing ? existing.id : generateUUID(),
    partnerId:                session.userId,
    bankName:                 payload.bankName,
    bankCode:                 payload.bankCode || '',
    branchName:               payload.branchName,
    branchCode:               payload.branchCode || '',
    accountType:              payload.accountType,
    accountNumber:            payload.accountNumber,
    accountHolder:            payload.accountHolder,
    accountHolderKana:        payload.accountHolderKana || '',
    invoiceRegistrationNumber: payload.invoiceRegistrationNumber || '',
    updatedAt:                nowIso(),
  };

  if (existing) {
    updateRowById(sheet, existing.id, bankData, BANK_HEADERS);
  } else {
    appendRow(sheet, bankData, BANK_HEADERS);
  }

  return ok({ message: '振込先情報を保存しました' });
}

/**
 * 振込先情報取得（管理者）
 * payload: { token, partnerId }
 */
function getPartnerBankAccount(payload) {
  const session = verifySession(payload.token);
  if (!session) return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getBankSheet();
  const targetId = session.role === 'admin' ? payload.partnerId : session.userId;
  const bank = findRow(sheet, r => r.partnerId === targetId) || null;
  return ok(bank);
}

// ---------- ヘルパー ----------

/**
 * パートナーオブジェクトをフロントエンド用に整形
 */
function formatPartner(p) {
  return {
    id: p.id,
    partnerType: p.partnerType,
    name: p.name,
    companyName: p.companyName || undefined,
    email: p.email,
    phone: p.phone,
    area: p.area,
    businessCategory: p.businessCategory || undefined,
    businessType: p.businessType || undefined,
    customerSegment: p.customerSegment || undefined,
    instagramAccount: p.instagramAccount || undefined,
    introductionChannels: p.introductionChannels
      ? p.introductionChannels.split(',').filter(Boolean)
      : undefined,
    status: p.status,
    referralCode: p.referralCode || undefined,
    memo: p.adminMemo || p.memo || undefined,
    agreedTerms: p.agreedTerms === 'TRUE',
    agreedAdPolicy: p.agreedAdPolicy === 'TRUE',
    agreedAntiSocial: p.agreedAntiSocial === 'TRUE',
    createdAt: p.createdAt,
    approvedAt: p.approvedAt || undefined,
  };
}
