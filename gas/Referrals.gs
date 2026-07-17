// ============================================================
// Referrals.gs — 紹介案件・相談申込管理
// ============================================================

const REFERRAL_HEADERS = [
  'id', 'partnerId', 'referralCode', 'menuId',
  'customerName', 'customerEmail', 'customerPhone',
  'preferredDate1', 'preferredDate2', 'preferredDate3',
  'consultationMethod', 'proposalTiming', 'message',
  'status', 'rewardStatus', 'rewardAmount', 'contractAmount',
  'adminMemo', 'excludeReason', 'excludeMemo',
  'utmSource', 'utmMedium', 'utmCampaign', 'utmContent',
  'consultationScheduledAt', 'consultedAt',
  'approvedAt', 'paidAt', 'rewardPaidAt',
  'referredAt', 'createdAt', 'updatedAt', 'deletedAt',
];

function getReferralSheet() {
  const ss = getSpreadsheet('REFERRALS');
  return getOrCreateSheet(ss, 'referrals', REFERRAL_HEADERS);
}

// ---------- 相談申込 ----------

/**
 * 相談申込（フロントエンドのフォームから）
 * payload: { referralCode?, menuId, customerName, customerEmail, customerPhone,
 *            preferredDate1, preferredDate2?, preferredDate3?, consultationMethod,
 *            proposalTiming?, message?, utmSource?, utmMedium?, utmCampaign?, utmContent? }
 */
function createReferralInquiry(payload) {
  const sheet = getReferralSheet();

  // 紹介コードからパートナーを特定
  let partnerId = '';
  if (payload.referralCode) {
    const partnerSheet = getPartnerSheet();
    const partner = findRow(partnerSheet, p =>
      p.referralCode === payload.referralCode && p.status === 'approved'
    );
    if (partner) partnerId = partner.id;
  }

  const id = generateUUID();
  const defaultRewardAmount = getSystemSetting('defaultRewardAmount') || CONFIG.DEFAULT_REWARD_AMOUNT;

  const referral = {
    id,
    partnerId,
    referralCode:            payload.referralCode || '',
    menuId:                  payload.menuId || 'propose',
    customerName:            payload.customerName,
    customerEmail:           payload.customerEmail,
    customerPhone:           payload.customerPhone || '',
    preferredDate1:          payload.preferredDate1 || '',
    preferredDate2:          payload.preferredDate2 || '',
    preferredDate3:          payload.preferredDate3 || '',
    consultationMethod:      payload.consultationMethod || '',
    proposalTiming:          payload.proposalTiming || '',
    message:                 payload.message || '',
    status:                  'inquiry',
    rewardStatus:            'unconfirmed',
    rewardAmount:            partnerId ? Number(defaultRewardAmount) : 0,
    contractAmount:          '',
    adminMemo:               '',
    excludeReason:           '',
    excludeMemo:             '',
    utmSource:               payload.utmSource || '',
    utmMedium:               payload.utmMedium || '',
    utmCampaign:             payload.utmCampaign || '',
    utmContent:              payload.utmContent || '',
    consultationScheduledAt: '',
    consultedAt:             '',
    approvedAt:              '',
    paidAt:                  '',
    rewardPaidAt:            '',
    referredAt:              nowIso(),
    createdAt:               nowIso(),
    updatedAt:               nowIso(),
    deletedAt:               '',
  };

  appendRow(sheet, referral, REFERRAL_HEADERS);

  // メール通知
  try {
    sendInquiryReceivedMail(referral);
    sendInquiryNotifyMail(referral);
  } catch (e) {
    Logger.log('相談申込メール送信エラー: ' + e.message);
  }

  return ok({ id, message: '相談申込を受け付けました' });
}

// ---------- 一覧・詳細 ----------

/**
 * 案件一覧取得（管理者）
 * payload: { token, status?, partnerId?, limit? }
 */
function getReferrals(payload) {
  const session = verifySession(payload.token);
  if (!session) return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  let referrals = sheetToObjects(sheet).filter(r => r.deletedAt === '');

  if (session.role === 'partner') {
    // 紹介者は自分の案件のみ
    referrals = referrals.filter(r => r.partnerId === session.userId);
  } else if (payload.partnerId) {
    referrals = referrals.filter(r => r.partnerId === payload.partnerId);
  }

  if (payload.status) {
    referrals = referrals.filter(r => r.status === payload.status);
  }

  // 新しい順
  referrals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return ok(referrals.map(formatReferral));
}

/**
 * 案件詳細取得（管理者）
 * payload: { token, referralId }
 */
function getReferralDetail(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  const referral = findRowById(sheet, payload.referralId);
  if (!referral) return error('案件が見つかりません', 'NOT_FOUND');
  return ok(formatReferral(referral));
}

// ---------- ステータス更新 ----------

/**
 * ステータス更新
 * payload: { token, referralId, status, scheduledAt?, contractAmount? }
 */
function updateReferralStatus(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  const referral = findRowById(sheet, payload.referralId);
  if (!referral) return error('案件が見つかりません', 'NOT_FOUND');

  const updates = {
    status: payload.status,
    updatedAt: nowIso(),
  };

  // ステータス別の処理
  switch (payload.status) {
    case 'scheduled':
      if (payload.scheduledAt) updates.consultationScheduledAt = payload.scheduledAt;
      break;
    case 'consulted':
      updates.consultedAt = nowIso();
      break;
    case 'paid':
      updates.paidAt = nowIso();
      if (payload.contractAmount) {
        updates.contractAmount = Number(payload.contractAmount);
      }
      break;
  }

  updateRowById(sheet, payload.referralId, updates, REFERRAL_HEADERS);
  return ok({ message: 'ステータスを更新しました' });
}

/**
 * 対象外設定
 * payload: { token, referralId, excludeReason, excludeMemo? }
 */
function excludeReferral(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  updateRowById(sheet, payload.referralId, {
    status: 'excluded',
    rewardStatus: 'excluded',
    excludeReason: payload.excludeReason,
    excludeMemo: payload.excludeMemo || '',
    updatedAt: nowIso(),
  }, REFERRAL_HEADERS);

  return ok({ message: '対象外に設定しました' });
}

/**
 * 管理メモ更新
 * payload: { token, referralId, memo }
 */
function updateReferralMemo(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  updateRowById(sheet, payload.referralId, {
    adminMemo: payload.memo,
    updatedAt: nowIso(),
  }, REFERRAL_HEADERS);

  return ok({ message: 'メモを更新しました' });
}

/**
 * 成約金額設定
 * payload: { token, referralId, contractAmount }
 */
function setContractAmount(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  updateRowById(sheet, payload.referralId, {
    contractAmount: Number(payload.contractAmount),
    updatedAt: nowIso(),
  }, REFERRAL_HEADERS);

  return ok({ message: '成約金額を設定しました' });
}

// ---------- 報酬確定 ----------

/**
 * 報酬確定（成約→報酬確定済み）
 * payload: { token, referralId }
 */
function approveReward(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  const referral = findRowById(sheet, payload.referralId);
  if (!referral) return error('案件が見つかりません', 'NOT_FOUND');
  if (referral.status !== 'paid') return error('決済完了の案件のみ報酬確定できます', 'INVALID_STATUS');

  updateRowById(sheet, payload.referralId, {
    rewardStatus: 'confirmed',
    approvedAt: nowIso(),
    updatedAt: nowIso(),
  }, REFERRAL_HEADERS);

  // 報酬確定メール送信
  try {
    const partnerSheet = getPartnerSheet();
    const partner = findRowById(partnerSheet, referral.partnerId);
    if (partner) {
      sendRewardConfirmedMail(formatPartner(partner), formatReferral(referral));
    }
  } catch (e) {
    Logger.log('報酬確定メール送信エラー: ' + e.message);
  }

  return ok({ message: '報酬を確定しました' });
}

/**
 * 報酬支払済み設定
 * payload: { token, referralId }
 */
function markRewardPaid(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getReferralSheet();
  updateRowById(sheet, payload.referralId, {
    rewardStatus: 'paid',
    rewardPaidAt: nowIso(),
    updatedAt: nowIso(),
  }, REFERRAL_HEADERS);

  return ok({ message: '支払済みに変更しました' });
}

// ---------- ヘルパー ----------

function formatReferral(r) {
  return {
    id: r.id,
    partnerId: r.partnerId || undefined,
    referralCode: r.referralCode || undefined,
    menuId: r.menuId,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    customerPhone: r.customerPhone || undefined,
    preferredDate1: r.preferredDate1 || undefined,
    preferredDate2: r.preferredDate2 || undefined,
    consultationMethod: r.consultationMethod || undefined,
    proposalTiming: r.proposalTiming || undefined,
    message: r.message || undefined,
    status: r.status,
    rewardStatus: r.rewardStatus,
    rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : undefined,
    contractAmount: r.contractAmount ? Number(r.contractAmount) : undefined,
    adminMemo: r.adminMemo || undefined,
    excludeReason: r.excludeReason || undefined,
    excludeMemo: r.excludeMemo || undefined,
    utmSource: r.utmSource || undefined,
    utmMedium: r.utmMedium || undefined,
    utmCampaign: r.utmCampaign || undefined,
    consultationScheduledAt: r.consultationScheduledAt || undefined,
    consultedAt: r.consultedAt || undefined,
    approvedAt: r.approvedAt || undefined,
    paidAt: r.paidAt || undefined,
    referredAt: r.referredAt,
    createdAt: r.createdAt,
  };
}

/**
 * システム設定値取得
 */
function getSystemSetting(key) {
  try {
    const ss = getSpreadsheet('SETTINGS');
    const sheet = getOrCreateSheet(ss, 'system_settings', ['key', 'value', 'updatedAt']);
    const row = findRow(sheet, r => r.key === key);
    return row ? row.value : null;
  } catch (e) {
    return null;
  }
}
