// ============================================================
// Analytics.gs — LP分析・集計クエリ
// ============================================================

/**
 * 全体サマリー取得
 * payload: { token, startDate?, endDate? }
 */
function getAnalyticsSummary(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const filtered = filterByDateRange(events, payload.startDate, payload.endDate);

  const pageViews    = filtered.filter(e => e.eventType === 'page_view').length;
  const uniqueVisits = filtered.filter(e => e.eventType === 'unique_visit' || e.isUnique === 'TRUE').length;
  const ctaClicks    = filtered.filter(e => e.eventType === 'cta_click').length;
  const formViews    = filtered.filter(e => e.eventType === 'form_view').length;
  const formStarts   = filtered.filter(e => e.eventType === 'form_start').length;
  const formSubmits  = filtered.filter(e => e.eventType === 'form_submit').length;
  const formAbandons = filtered.filter(e => e.eventType === 'form_abandon').length;

  return ok({
    pageViews,
    uniqueVisits,
    ctaClicks,
    ctaClickRate: uniqueVisits > 0 ? Math.round(ctaClicks / uniqueVisits * 100) : 0,
    formViews,
    formStarts,
    formSubmits,
    formAbandons,
    formCvr: uniqueVisits > 0 ? Math.round(formSubmits / uniqueVisits * 100) : 0,
    formStartRate: formViews > 0 ? Math.round(formStarts / formViews * 100) : 0,
    formCompleteRate: formStarts > 0 ? Math.round(formSubmits / formStarts * 100) : 0,
  });
}

/**
 * 日別アクセス推移
 * payload: { token, days? } (default: 30)
 */
function getDailyAccessTrend(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const days = Number(payload.days) || 30;

  // 過去N日分
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const filtered = events.filter(e => new Date(e.occurredAt) >= startDate);

  // 日別集計
  const byDay = {};
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { date: key, pageViews: 0, uniqueVisits: 0, formSubmits: 0 };
  }

  filtered.forEach(e => {
    const day = e.occurredAt.slice(0, 10);
    if (!byDay[day]) return;
    if (e.eventType === 'page_view') byDay[day].pageViews++;
    if (e.eventType === 'unique_visit' || e.isUnique === 'TRUE') byDay[day].uniqueVisits++;
    if (e.eventType === 'form_submit') byDay[day].formSubmits++;
  });

  return ok(Object.values(byDay));
}

/**
 * 流入元別CVR
 * payload: { token, startDate?, endDate? }
 */
function getSourceAnalytics(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const filtered = filterByDateRange(events, payload.startDate, payload.endDate);

  const sources = {};
  filtered.forEach(e => {
    const src = e.utmSource || 'direct';
    if (!sources[src]) sources[src] = { source: src, visits: 0, submits: 0 };
    if (e.eventType === 'unique_visit' || e.isUnique === 'TRUE') sources[src].visits++;
    if (e.eventType === 'form_submit') sources[src].submits++;
  });

  const result = Object.values(sources).map(s => ({
    ...s,
    cvr: s.visits > 0 ? Math.round(s.submits / s.visits * 100) : 0,
  }));

  result.sort((a, b) => b.visits - a.visits);
  return ok(result);
}

/**
 * 紹介者別CVR
 * payload: { token, startDate?, endDate? }
 */
function getPartnerAnalytics(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const filtered = filterByDateRange(events, payload.startDate, payload.endDate);

  const partnerSheet = getPartnerSheet();
  const partners = sheetToObjects(partnerSheet);

  const codes = {};
  filtered.filter(e => e.referralCode).forEach(e => {
    const code = e.referralCode;
    if (!codes[code]) codes[code] = { referralCode: code, visits: 0, submits: 0 };
    if (e.eventType === 'unique_visit' || e.isUnique === 'TRUE') codes[code].visits++;
    if (e.eventType === 'form_submit') codes[code].submits++;
  });

  const result = Object.values(codes).map(c => {
    const partner = partners.find(p => p.referralCode === c.referralCode);
    return {
      ...c,
      partnerName: partner ? partner.name : '不明',
      cvr: c.visits > 0 ? Math.round(c.submits / c.visits * 100) : 0,
    };
  });

  result.sort((a, b) => b.visits - a.visits);
  return ok(result);
}

/**
 * デバイス別アクセス
 * payload: { token, startDate?, endDate? }
 */
function getDeviceAnalytics(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const filtered = filterByDateRange(events, payload.startDate, payload.endDate);

  const visits = filtered.filter(e => e.eventType === 'unique_visit' || e.isUnique === 'TRUE');
  const devices = {};
  visits.forEach(e => {
    const d = e.device || 'desktop';
    devices[d] = (devices[d] || 0) + 1;
  });

  const total = Object.values(devices).reduce((s, n) => s + n, 0);
  const result = Object.entries(devices).map(([name, value]) => ({
    name,
    value,
    percent: total > 0 ? Math.round(value / total * 100) : 0,
  }));

  return ok(result);
}

/**
 * セクション別閲覧率
 * payload: { token, startDate?, endDate? }
 */
function getSectionViewAnalytics(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const sheet = getLpEventSheet();
  const events = sheetToObjects(sheet);
  const filtered = filterByDateRange(events, payload.startDate, payload.endDate);

  const totalVisits = filtered.filter(e => e.eventType === 'unique_visit' || e.isUnique === 'TRUE').length;
  const sectionViews = filtered.filter(e => e.eventType === 'section_view' && e.sectionKey);

  const sections = {};
  sectionViews.forEach(e => {
    const key = e.sectionKey;
    sections[key] = (sections[key] || 0) + 1;
  });

  const result = Object.entries(sections).map(([section, views]) => ({
    section,
    views,
    rate: totalVisits > 0 ? Math.round(views / totalVisits * 100) : 0,
  }));

  result.sort((a, b) => b.rate - a.rate);
  return ok(result);
}

// ---------- ヘルパー ----------

function filterByDateRange(events, startDate, endDate) {
  return events.filter(e => {
    if (startDate && e.occurredAt < startDate) return false;
    if (endDate && e.occurredAt > endDate + 'T23:59:59') return false;
    return true;
  });
}
