// ============================================================
// Calendar.gs — Googleカレンダー連携
// ============================================================

/**
 * 相談予定をGoogleカレンダーに登録する
 * payload: { token, referralId, scheduledAt, customerName, consultationMethod, memo? }
 */
function createCalendarEvent(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  const scheduledDate = new Date(payload.scheduledAt);
  const endDate = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // 1時間後

  const title = `【相談】${payload.customerName} 様 (${payload.consultationMethod || '対面'})`;
  const description = [
    `En Link 相談予約`,
    `顧客名: ${payload.customerName}`,
    `相談方法: ${payload.consultationMethod || '—'}`,
    payload.memo ? `メモ: ${payload.memo}` : '',
    '',
    `案件ID: ${payload.referralId}`,
    `管理画面: ${CONFIG.ADMIN_URL}/referrals/${payload.referralId}`,
  ].filter(Boolean).join('\n');

  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.createEvent(title, scheduledDate, endDate, {
      description: description,
      location: payload.location || CONFIG.STUDIO_NAME,
    });

    // 案件のステータスを更新
    const sheet = getReferralSheet();
    updateRowById(sheet, payload.referralId, {
      status: 'scheduled',
      consultationScheduledAt: payload.scheduledAt,
      updatedAt: nowIso(),
    }, REFERRAL_HEADERS);

    return ok({
      eventId: event.getId(),
      eventUrl: event.getHtmlLink(),
      message: 'カレンダーに登録しました',
    });
  } catch (e) {
    Logger.log('カレンダー登録エラー: ' + e.message);
    return error('カレンダーへの登録に失敗しました: ' + e.message, 'CALENDAR_ERROR');
  }
}

/**
 * カレンダーイベントを更新する
 * payload: { token, eventId, scheduledAt?, title?, memo? }
 */
function updateCalendarEvent(payload) {
  const session = verifySession(payload.token);
  if (!session || session.role !== 'admin') return error('認証が必要です', 'UNAUTHORIZED');

  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(payload.eventId);
    if (!event) return error('カレンダーイベントが見つかりません', 'NOT_FOUND');

    if (payload.scheduledAt) {
      const newDate = new Date(payload.scheduledAt);
      const endDate = new Date(newDate.getTime() + 60 * 60 * 1000);
      event.setTime(newDate, endDate);
    }
    if (payload.title) event.setTitle(payload.title);
    if (payload.memo) event.setDescription(payload.memo);

    return ok({ message: 'カレンダーイベントを更新しました' });
  } catch (e) {
    return error('カレンダーの更新に失敗しました: ' + e.message, 'CALENDAR_ERROR');
  }
}
