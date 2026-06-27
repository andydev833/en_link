import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, ToastContainer, Modal, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft } from 'lucide-react';
import type { ExcludeReason } from '../../types';

const EXCLUDE_REASONS: { value: ExcludeReason; label: string }[] = [
  { value: 'existing_customer', label: '既存顧客' },
  { value: 'already_inquired', label: '既存問い合わせ済み' },
  { value: 'out_of_menu', label: '対象メニュー外' },
  { value: 'expired', label: '有効期限切れ' },
  { value: 'cancelled', label: 'キャンセル' },
  { value: 'duplicate', label: '重複紹介' },
  { value: 'self_referral', label: '自己紹介' },
  { value: 'same_household', label: '同一世帯' },
  { value: 'same_company', label: '同一法人内' },
  { value: 'fraud_suspected', label: '不正の疑い' },
  { value: 'other', label: 'その他' },
];

export default function AdminReferralDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    referrals,
    updateStatus,
    setContractAmount,
    markPaid,
    approveReward,
    markRewardPaid,
    excludeReferral,
    updateMemo,
    updateSchedule,
    markConsulted,
  } = useReferralStore();
  const { partners, getBankAccount } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();

  const referral = referrals.find((r) => r.id === id);
  const partner = referral?.partnerId ? partners.find((p) => p.id === referral.partnerId) : null;
  const bankAccount = partner ? getBankAccount(partner.id) : null;

  const [contractAmountInput, setContractAmountInput] = useState(
    referral?.contractAmount?.toString() || ''
  );
  const [memo, setMemo] = useState(referral?.adminMemo || '');
  const [scheduleDate, setScheduleDate] = useState(referral?.consultationScheduledAt?.split('T')[0] || '');
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [excludeReason, setExcludeReason] = useState<ExcludeReason>('other');
  const [excludeMemo, setExcludeMemo] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);

  if (!referral) {
    return (
      <AdminLayout title="案件詳細">
        <div>案件が見つかりません</div>
      </AdminLayout>
    );
  }

  const canApproveReward = referral.status === 'paid' && referral.rewardStatus === 'unconfirmed';
  const canMarkPaid = ['consulted', 'scheduling', 'scheduled'].includes(referral.status) || referral.status === 'inquiry';
  const canMarkRewardPaid = referral.rewardStatus === 'confirmed';

  const handleContractAmountSave = () => {
    const amount = parseInt(contractAmountInput.replace(/,/g, ''));
    if (isNaN(amount) || amount < 0) {
      addToast('有効な金額を入力してください', 'error');
      return;
    }
    setContractAmount(referral.id, amount);
    addToast('成約金額を保存しました', 'success');
  };

  const handleMarkPaid = () => {
    markPaid(referral.id);
    addToast('決済完了に変更しました', 'success');
    setConfirmPaid(false);
  };

  const handleApproveReward = () => {
    approveReward(referral.id);
    addToast('報酬を確定しました', 'success');
    setConfirmApprove(false);
  };

  const handleMarkRewardPaid = () => {
    markRewardPaid(referral.id);
    addToast('支払済みに変更しました', 'success');
  };

  const handleExclude = () => {
    excludeReferral(referral.id, excludeReason, excludeMemo);
    addToast('対象外に変更しました', 'info');
    setShowExcludeModal(false);
  };

  const handleScheduleSave = () => {
    if (!scheduleDate) return;
    updateSchedule(referral.id, scheduleDate + 'T00:00:00Z');
    addToast('相談予定日を保存しました', 'success');
  };

  const handleMemoSave = () => {
    updateMemo(referral.id, memo);
    addToast('メモを保存しました', 'success');
  };

  return (
    <AdminLayout title="案件詳細">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* パンくず */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/admin/referrals')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={14} />
          案件一覧に戻る
        </button>
      </div>

      {/* ヘッダー */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400 }}>
              {referral.customerName}
            </h1>
            <StatusBadge status={referral.status} />
            <StatusBadge status={referral.rewardStatus} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
            紹介日: {new Date(referral.referredAt).toLocaleDateString('ja-JP')}
            {partner && ` ・ 紹介者: ${partner.name}`}
          </div>
        </div>

        {/* アクションボタン群 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {referral.status === 'inquiry' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { updateStatus(referral.id, 'scheduling'); addToast('相談調整中に変更しました', 'success'); }}
            >
              相談調整中へ
            </button>
          )}
          {referral.status === 'scheduled' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { markConsulted(referral.id); addToast('相談実施済みに変更しました', 'success'); }}
            >
              相談実施済みへ
            </button>
          )}
          {canMarkPaid && (
            <button
              className="btn btn-accent btn-sm"
              onClick={() => setConfirmPaid(true)}
            >
              決済完了にする
            </button>
          )}
          {canApproveReward && (
            <button
              className="btn btn-accent btn-sm"
              onClick={() => setConfirmApprove(true)}
              style={{ background: 'var(--color-accent)', color: 'var(--color-text-primary)' }}
            >
              ✓ 承認して報酬確定
            </button>
          )}
          {canMarkRewardPaid && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleMarkRewardPaid}
            >
              支払済みにする
            </button>
          )}
          {!['excluded', 'lost', 'reward_paid'].includes(referral.status) && (
            <>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => { updateStatus(referral.id, 'lost'); addToast('失注に変更しました', 'info'); }}
              >
                失注
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowExcludeModal(true)}
              >
                対象外
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* 顧客情報 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">顧客情報</span>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-item-label">氏名</div>
              <div className="detail-item-value">{referral.customerName}</div>
            </div>
            <div>
              <div className="detail-item-label">メールアドレス</div>
              <div className="detail-item-value" style={{ fontSize: '0.8rem' }}>{referral.customerEmail}</div>
            </div>
            <div>
              <div className="detail-item-label">電話番号</div>
              <div className="detail-item-value">{referral.customerPhone}</div>
            </div>
            <div>
              <div className="detail-item-label">エリア</div>
              <div className="detail-item-value">{referral.customerArea || '—'}</div>
            </div>
            <div>
              <div className="detail-item-label">プロポーズ予定</div>
              <div className="detail-item-value">{referral.proposalTiming || '—'}</div>
            </div>
            <div>
              <div className="detail-item-label">予算感</div>
              <div className="detail-item-value">{referral.budgetRange || '—'}</div>
            </div>
            <div>
              <div className="detail-item-label">相談方法</div>
              <div className="detail-item-value">
                {referral.consultationMethod === 'in_person' ? '対面' : referral.consultationMethod === 'online' ? 'オンライン' : '—'}
              </div>
            </div>
            <div>
              <div className="detail-item-label">第1希望日</div>
              <div className="detail-item-value">
                {referral.consultationPreferredDate1
                  ? new Date(referral.consultationPreferredDate1).toLocaleDateString('ja-JP')
                  : '—'}
              </div>
            </div>
          </div>
          {referral.consultationContent && (
            <div style={{ marginTop: '1rem' }}>
              <div className="detail-item-label" style={{ marginBottom: '0.375rem' }}>相談内容</div>
              <div
                style={{
                  padding: '0.75rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                }}
              >
                {referral.consultationContent}
              </div>
            </div>
          )}
        </div>

        {/* 案件情報 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 相談予定日 */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">相談予定日</span>
              <button className="btn btn-secondary btn-sm" onClick={handleScheduleSave}>
                保存
              </button>
            </div>
            <input
              className="form-input"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
            {referral.consultedAt && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                相談実施日: {new Date(referral.consultedAt).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>

          {/* 報酬・成約 */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">成約・報酬情報</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                className="form-input"
                placeholder="成約金額（円）"
                value={contractAmountInput}
                onChange={(e) => setContractAmountInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleContractAmountSave}>
                保存
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>報酬額</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem' }}>
                  {referral.rewardAmount ? `¥${referral.rewardAmount.toLocaleString()}` : '—'}
                </div>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>報酬ステータス</div>
                <StatusBadge status={referral.rewardStatus} />
              </div>
            </div>
            {referral.approvedAt && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                報酬確定日: {new Date(referral.approvedAt).toLocaleDateString('ja-JP')}
              </div>
            )}
            {referral.paidAt && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                支払日: {new Date(referral.paidAt).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>

          {/* 紹介者情報 */}
          {partner && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">紹介者情報</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/partners/${partner.id}`)}>
                  詳細 →
                </button>
              </div>
              <div className="detail-grid">
                <div>
                  <div className="detail-item-label">氏名</div>
                  <div className="detail-item-value">{partner.name}</div>
                </div>
                <div>
                  <div className="detail-item-label">振込先</div>
                  <div className="detail-item-value">
                    {bankAccount ? (
                      <span style={{ color: 'var(--color-approved)', fontSize: '0.8rem' }}>登録済み</span>
                    ) : (
                      <span style={{ color: 'var(--color-pending)', fontSize: '0.8rem' }}>未登録</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 管理メモ */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">管理メモ</span>
          <button className="btn btn-secondary btn-sm" onClick={handleMemoSave}>
            保存
          </button>
        </div>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder="管理者用メモ"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        {referral.excludeReason && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-rejected)' }}>
            対象外理由: {EXCLUDE_REASONS.find((r) => r.value === referral.excludeReason)?.label || referral.excludeReason}
          </div>
        )}
      </div>

      {/* 対象外モーダル */}
      <Modal
        isOpen={showExcludeModal}
        onClose={() => setShowExcludeModal(false)}
        title="対象外にする"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowExcludeModal(false)}>
              キャンセル
            </button>
            <button className="btn btn-danger" onClick={handleExclude}>
              対象外にする
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">対象外理由 <span className="required">*</span></label>
          <select
            className="form-select"
            value={excludeReason}
            onChange={(e) => setExcludeReason(e.target.value as ExcludeReason)}
          >
            {EXCLUDE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">補足メモ</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={excludeMemo}
            onChange={(e) => setExcludeMemo(e.target.value)}
            placeholder="対象外にする詳細理由（任意）"
          />
        </div>
      </Modal>

      {/* 報酬確定確認 */}
      <ConfirmDialog
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={handleApproveReward}
        title="報酬確定の確認"
        message={`${referral.customerName}の案件の報酬（¥${(referral.rewardAmount || 0).toLocaleString()}）を確定してよろしいですか？\n\n確定後は取り消せません。`}
        confirmLabel="承認して確定"
        confirmVariant="accent"
      />

      {/* 決済完了確認 */}
      <ConfirmDialog
        isOpen={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        onConfirm={handleMarkPaid}
        title="決済完了の確認"
        message="顧客の本契約決済が完了しましたか？この操作を行うと、次のステップで報酬確定が可能になります。"
        confirmLabel="決済完了にする"
        confirmVariant="primary"
      />
    </AdminLayout>
  );
}
