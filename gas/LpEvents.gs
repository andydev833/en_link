// ============================================================
// LpEvents.gs — LP計測イベント書き込み
// ============================================================

const LP_EVENT_HEADERS = [
  'id', 'eventType', 'sessionId', 'referralCode', 'utmSource', 'utmMedium',
  'utmCampaign', 'sectionKey', 'device', 'isUnique', 'occurredAt',
];

function getLpEventSheet() {
  const ss = getSpreadsheet('LP_EVENTS');
  return getOrCreateSheet(ss, 'lp_events', LP_EVENT_HEADERS);
}

// ---------- イベント記録 ----------

/**
 * LPイベントを記録する
 * payload: { eventType, sessionId, referralCode?, utmSource?, utmMedium?,
 *            utmCampaign?, sectionKey?, device?, isUnique? }
 *
 * eventType: 'page_view' | 'unique_visit' | 'section_view' | 'cta_click'
 *           | 'form_view' | 'form_start' | 'form_submit' | 'form_abandon'
 */
function trackLpEvent(payload) {
  const sheet = getLpEventSheet();
  const event = {
    id:           generateUUID(),
    eventType:    payload.eventType,
    sessionId:    payload.sessionId || '',
    referralCode: payload.referralCode || '',
    utmSource:    payload.utmSource || 'direct',
    utmMedium:    payload.utmMedium || '',
    utmCampaign:  payload.utmCampaign || '',
    sectionKey:   payload.sectionKey || '',
    device:       payload.device || 'desktop',
    isUnique:     payload.isUnique ? 'TRUE' : 'FALSE',
    occurredAt:   nowIso(),
  };
  appendRow(sheet, event, LP_EVENT_HEADERS);
  return ok({ message: 'イベントを記録しました' });
}

// ---------- バッチ記録 ----------

/**
 * 複数イベントを一括記録する
 * payload: { events: Array<{...}> }
 */
function trackLpEventBatch(payload) {
  const sheet = getLpEventSheet();
  const events = Array.isArray(payload.events) ? payload.events : [];
  events.forEach(e => {
    const event = {
      id:           generateUUID(),
      eventType:    e.eventType,
      sessionId:    e.sessionId || '',
      referralCode: e.referralCode || '',
      utmSource:    e.utmSource || 'direct',
      utmMedium:    e.utmMedium || '',
      utmCampaign:  e.utmCampaign || '',
      sectionKey:   e.sectionKey || '',
      device:       e.device || 'desktop',
      isUnique:     e.isUnique ? 'TRUE' : 'FALSE',
      occurredAt:   e.occurredAt || nowIso(),
    };
    appendRow(sheet, event, LP_EVENT_HEADERS);
  });
  return ok({ message: `${events.length}件のイベントを記録しました` });
}
