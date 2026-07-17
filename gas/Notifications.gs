// ============================================================
// Notifications.gs — メール通知（GmailApp）
// ============================================================
// 全てのメールはGoogleアカウントのGmailから送信されます。
// 送信元は GAS を実行するGoogleアカウントのメールアドレスになります。

/**
 * テンプレートを取得してプレースホルダを置換する
 */
function renderTemplate(templateKey, variables) {
  // まずSheetsのテンプレートを確認
  const ss = getSpreadsheet('SETTINGS');
  const sheet = getOrCreateSheet(ss, 'notification_templates', ['key', 'subject', 'body', 'updatedAt']);
  const tmpl = findRow(sheet, r => r.key === templateKey);

  if (!tmpl || !tmpl.subject) {
    // シートにテンプレートがない場合はデフォルトを使用
    return null;
  }

  let subject = tmpl.subject;
  let body = tmpl.body;

  Object.entries(variables).forEach(([k, v]) => {
    const re = new RegExp('\\{' + k + '\\}', 'g');
    subject = subject.replace(re, v || '');
    body = body.replace(re, v || '');
  });

  return { subject, body };
}

/**
 * メール送信の共通関数
 */
function sendMail(to, subject, body) {
  if (!to || !to.includes('@')) return;
  GmailApp.sendEmail(to, subject, body, {
    name: CONFIG.STUDIO_NAME,
    replyTo: CONFIG.STUDIO_EMAIL,
  });
}

// ---------- 各通知関数 ----------

/**
 * 申請受付（紹介者宛）
 */
function sendApplicationReceivedMail(partner) {
  const vars = {
    name: partner.name,
    studio_email: CONFIG.STUDIO_EMAIL,
  };
  const tmpl = renderTemplate('application_received', vars);
  if (!tmpl) {
    // デフォルトメール
    sendMail(partner.email,
      `【${CONFIG.STUDIO_NAME}】紹介パートナー登録申請を受け付けました`,
      `${partner.name} 様\n\nご申請ありがとうございます。審査完了後、改めてご連絡いたします（3〜5営業日）。\n\n${CONFIG.STUDIO_NAME}`
    );
    return;
  }
  sendMail(partner.email, tmpl.subject, tmpl.body);
}

/**
 * 新規申請通知（管理者宛）
 */
function sendApplicationNotifyMail(partner) {
  const vars = {
    name: partner.name,
    email: partner.email,
    phone: partner.phone,
    area: partner.area,
    partner_type: partner.partnerType === 'individual' ? '個人' : '法人',
    created_at: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    admin_url: CONFIG.ADMIN_URL + '/partners',
  };
  const tmpl = renderTemplate('application_notify', vars);
  if (!tmpl) {
    sendMail(CONFIG.ADMIN_EMAIL,
      `【En Link】新規パートナー申請: ${partner.name}`,
      `新規申請\n名前: ${partner.name}\nメール: ${partner.email}\nエリア: ${partner.area}\n\n${CONFIG.ADMIN_URL}/partners`
    );
    return;
  }
  sendMail(CONFIG.ADMIN_EMAIL, tmpl.subject, tmpl.body);
}

/**
 * 承認通知（紹介者宛）
 */
function sendApprovedMail(partner) {
  const baseUrl = CONFIG.LP_URL;
  const referralUrl = partner.referralCode
    ? `${baseUrl}?ref=${partner.referralCode}`
    : CONFIG.LP_URL;

  const vars = {
    name: partner.name,
    referral_code: partner.referralCode || '',
    referral_url: referralUrl,
    partner_url: CONFIG.PARTNER_URL + '/dashboard',
  };
  const tmpl = renderTemplate('approved', vars);
  if (!tmpl) {
    sendMail(partner.email,
      `【${CONFIG.STUDIO_NAME}】紹介パートナー登録が承認されました`,
      `${partner.name} 様\n\n承認されました。\n\n紹介コード: ${partner.referralCode}\n紹介リンク: ${referralUrl}\n\n${CONFIG.STUDIO_NAME}`
    );
    return;
  }
  sendMail(partner.email, tmpl.subject, tmpl.body);
}

/**
 * 否認通知（紹介者宛）
 */
function sendRejectedMail(partner) {
  const vars = {
    name: partner.name,
    studio_email: CONFIG.STUDIO_EMAIL,
  };
  const tmpl = renderTemplate('rejected', vars);
  if (!tmpl) {
    sendMail(partner.email,
      `【${CONFIG.STUDIO_NAME}】紹介パートナー申請の審査結果について`,
      `${partner.name} 様\n\n誠に残念ながら、今回はご希望に沿うことができない結果となりました。\n\n${CONFIG.STUDIO_NAME}`
    );
    return;
  }
  sendMail(partner.email, tmpl.subject, tmpl.body);
}

/**
 * 相談申込受付（顧客宛）
 */
function sendInquiryReceivedMail(referral) {
  const vars = {
    customer_name: referral.customerName,
    preferred_date1: referral.preferredDate1,
    consultation_method: referral.consultationMethod,
    studio_email: CONFIG.STUDIO_EMAIL,
  };
  const tmpl = renderTemplate('inquiry_received', vars);
  if (!tmpl) {
    sendMail(referral.customerEmail,
      `【${CONFIG.STUDIO_NAME}】無料相談のお申込みを受け付けました`,
      `${referral.customerName} 様\n\n相談申込を受け付けました。2〜3営業日以内にご連絡いたします。\n\n${CONFIG.STUDIO_NAME}`
    );
    return;
  }
  sendMail(referral.customerEmail, tmpl.subject, tmpl.body);
}

/**
 * 相談申込通知（管理者宛）
 */
function sendInquiryNotifyMail(referral) {
  const vars = {
    customer_name: referral.customerName,
    customer_email: referral.customerEmail,
    customer_phone: referral.customerPhone || '—',
    preferred_date1: referral.preferredDate1 || '—',
    preferred_date2: referral.preferredDate2 || '—',
    consultation_method: referral.consultationMethod || '—',
    proposal_timing: referral.proposalTiming || '—',
    referral_code: referral.referralCode || '直接',
    utm_source: referral.utmSource || 'direct',
    created_at: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    admin_url: CONFIG.ADMIN_URL + '/referrals',
  };
  const tmpl = renderTemplate('inquiry_notify', vars);
  if (!tmpl) {
    sendMail(CONFIG.ADMIN_EMAIL,
      `【En Link】新規相談申込: ${referral.customerName}`,
      `相談申込\n顧客: ${referral.customerName}\nメール: ${referral.customerEmail}\n第1希望: ${referral.preferredDate1}\n\n${CONFIG.ADMIN_URL}/referrals`
    );
    return;
  }
  sendMail(CONFIG.ADMIN_EMAIL, tmpl.subject, tmpl.body);
}

/**
 * 報酬確定通知（紹介者宛）
 */
function sendRewardConfirmedMail(partner, referral) {
  const now = new Date();
  const paymentMonth = `${now.getFullYear()}年${now.getMonth() + 2}月`;

  const vars = {
    name: partner.name,
    customer_name: referral.customerName,
    reward_amount: (referral.rewardAmount || 0).toLocaleString(),
    payment_month: paymentMonth,
    partner_url: CONFIG.PARTNER_URL + '/payment',
  };
  const tmpl = renderTemplate('reward_confirmed', vars);
  if (!tmpl) {
    sendMail(partner.email,
      `【${CONFIG.STUDIO_NAME}】報酬が確定しました`,
      `${partner.name} 様\n\n報酬が確定しました。\n対象: ${referral.customerName}様\n報酬額: ¥${(referral.rewardAmount || 0).toLocaleString()}\n\n${CONFIG.STUDIO_NAME}`
    );
    return;
  }
  sendMail(partner.email, tmpl.subject, tmpl.body);
}
