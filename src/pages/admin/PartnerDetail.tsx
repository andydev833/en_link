import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, ToastContainer, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { ArrowLeft, Copy, Check } from 'lucide-react';

export default function AdminPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { partners, approvePartner, rejectPartner, suspendPartner, reapprovePartner, updatePartner, getBankAccount } = usePartnerStore();
  const { referrals } = useReferralStore();
  const { toasts, addToast, removeToast } = useToast();

  const partner = partners.find((p) => p.id === id);
  const bankAccount = id ? getBankAccount(id) : undefined;
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [memo, setMemo] = useState(partner?.memo || '');
  const [copied, setCopied] = useState(false);

  if (!partner) {
    return (
      <AdminLayout title="紹介者詳細">
        <div>紹介者が見つかりません</div>
      </AdminLayout>
    );
  }

  const pReferrals = referrals.filter((r) => r.partnerId === partner.id);
  const contracted = pReferrals.filter((r) =>
    ['paid', 'approved', 'reward_confirmed', 'reward_paid'].includes(r.status)
  );
  const totalReward = pReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
  const paidReward = pReferrals
    .filter((r) => r.rewardStatus === 'paid')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  const baseUrl = window.location.origin;
  const referralUrl = partner.referralCode
    ? `${baseUrl}/propose?ref=${partner.referralCode}`
    : '';

  const handleAction = (action: string) => {
    if (action === 'approve') { approvePartner(partner.id); addToast('承認しました', 'success'); }
    else if (action === 'reject') { rejectPartner(partner.id); addToast('否認しました', 'info'); }
    else if (action === 'suspend') { suspendPartner(partner.id); addToast('停止しました', 'info'); }
    else if (action === 'reapprove') { reapprovePartner(partner.id); addToast('再承認しました', 'success'); }
    setConfirmAction(null);
  };

  const saveMemo = () => {
    updatePartner(partner.id, { memo });
    addToast('メモを保存しました', 'success');
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ACTION_LABELS: Record<string, string> = {
    approve: '承認',
    reject: '否認',
    suspend: '停止',
    reapprove: '再承認',
  };

  return (
    <AdminLayout title="紹介者詳細">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* パンくず */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/admin/partners')}
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeft size={14} />
          紹介者一覧に戻る
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
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 400,
              }}
            >
              {partner.name}
            </h1>
            <StatusBadge status={partner.status} />
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {partner.partnerType === 'individual' ? '個人' : '法人'}
            </span>
          </div>
          {partner.companyName && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              {partner.companyName}
            </div>
          )}
        </div>

        {/* 操作ボタン */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {partner.status === 'pending' && (
            <>
              <button className="btn btn-accent" onClick={() => setConfirmAction('approve')}>
                承認する
              </button>
              <button className="btn btn-danger" onClick={() => setConfirmAction('reject')}>
                否認する
              </button>
            </>
          )}
          {partner.status === 'approved' && (
            <button className="btn btn-danger" onClick={() => setConfirmAction('suspend')}>
              停止する
            </button>
          )}
          {(partner.status === 'rejected' || partner.status === 'suspended') && (
            <button className="btn btn-secondary" onClick={() => setConfirmAction('reapprove')}>
              再承認する
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* 基本情報 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">基本情報</span>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-item-label">メールアドレス</div>
              <div className="detail-item-value">{partner.email}</div>
            </div>
            <div>
              <div className="detail-item-label">電話番号</div>
              <div className="detail-item-value">{partner.phone}</div>
            </div>
            <div>
              <div className="detail-item-label">活動エリア</div>
              <div className="detail-item-value">{partner.area}</div>
            </div>
            <div>
              <div className="detail-item-label">事業カテゴリ</div>
              <div className="detail-item-value">{partner.businessCategory || '—'}</div>
            </div>
            <div>
              <div className="detail-item-label">紹介できる顧客層</div>
              <div className="detail-item-value">{partner.customerSegment || '—'}</div>
            </div>
            <div>
              <div className="detail-item-label">登録日</div>
              <div className="detail-item-value">
                {new Date(partner.createdAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
            {partner.approvedAt && (
              <div>
                <div className="detail-item-label">承認日</div>
                <div className="detail-item-value">
                  {new Date(partner.approvedAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 成果サマリー */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">成果サマリー</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: '紹介件数', value: pReferrals.length },
              { label: '成約件数', value: contracted.length },
              { label: '成約率', value: `${pReferrals.length > 0 ? Math.round(contracted.length / pReferrals.length * 100) : 0}%` },
              { label: '報酬合計', value: `¥${totalReward.toLocaleString()}` },
              { label: '支払済み報酬', value: `¥${paidReward.toLocaleString()}` },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.875rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.375rem', letterSpacing: '0.04em' }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 紹介リンク */}
      {partner.referralCode && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">紹介コード・リンク</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.375rem' }}>紹介コード</div>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                }}
              >
                {partner.referralCode}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.375rem' }}>紹介リンク</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ flex: 1, fontSize: '0.8rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {referralUrl}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={copyLink}>
                  {copied ? <Check size={14} style={{ color: 'var(--color-approved)' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 振込先情報 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">振込先情報</span>
        </div>
        {bankAccount ? (
          <div className="detail-grid">
            <div>
              <div className="detail-item-label">銀行名</div>
              <div className="detail-item-value">{bankAccount.bankName}</div>
            </div>
            <div>
              <div className="detail-item-label">支店名</div>
              <div className="detail-item-value">{bankAccount.branchName}</div>
            </div>
            <div>
              <div className="detail-item-label">口座種別</div>
              <div className="detail-item-value">{bankAccount.accountType === 'ordinary' ? '普通' : '当座'}</div>
            </div>
            <div>
              <div className="detail-item-label">口座番号</div>
              <div className="detail-item-value">{bankAccount.accountNumber}</div>
            </div>
            <div>
              <div className="detail-item-label">口座名義</div>
              <div className="detail-item-value">{bankAccount.accountHolder}</div>
            </div>
            {bankAccount.invoiceRegistrationNumber && (
              <div>
                <div className="detail-item-label">インボイス番号</div>
                <div className="detail-item-value">{bankAccount.invoiceRegistrationNumber}</div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: '1rem',
              background: 'var(--color-pending-bg)',
              border: '1px solid var(--color-pending-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: 'var(--color-pending)',
            }}
          >
            振込先未登録
          </div>
        )}
      </div>

      {/* 紹介実績 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">紹介実績</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/referrals')}>
            一覧で見る
          </button>
        </div>
        {pReferrals.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
            紹介実績はありません
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>紹介日</th>
                <th>顧客名</th>
                <th>ステータス</th>
                <th>成約金額</th>
                <th>報酬</th>
              </tr>
            </thead>
            <tbody>
              {pReferrals.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/admin/referrals/${r.id}`)}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(r.referredAt).toLocaleDateString('ja-JP')}</td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.contractAmount ? `¥${r.contractAmount.toLocaleString()}` : '—'}</td>
                  <td>{r.rewardAmount ? `¥${r.rewardAmount.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 管理メモ */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">管理メモ</span>
          <button className="btn btn-secondary btn-sm" onClick={saveMemo}>
            保存
          </button>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="管理者用メモ（紹介者には表示されません）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleAction(confirmAction)}
        title={`${ACTION_LABELS[confirmAction || '']}の確認`}
        message={`${partner.name}さんを${ACTION_LABELS[confirmAction || '']}してよろしいですか？`}
        confirmLabel={ACTION_LABELS[confirmAction || ''] || '確認'}
        confirmVariant={['approve', 'reapprove'].includes(confirmAction || '') ? 'accent' : 'danger'}
      />
    </AdminLayout>
  );
}
