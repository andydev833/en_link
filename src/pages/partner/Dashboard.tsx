import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';
import { PartnerLayout } from '../../components/layout';
import { StatusBadge, QRCodeCard, CopyButton, StatCard, ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { Link, Check, BanknoteIcon } from 'lucide-react';

export default function PartnerDashboard() {
  const { getCurrentPartner, getBankAccount } = usePartnerStore();
  const { getReferralsByPartner } = useReferralStore();
  const { toasts, addToast, removeToast } = useToast();

  const partner = getCurrentPartner();
  if (!partner) return null;

  const isApproved = partner.status === 'approved';
  const referrals = partner.id ? getReferralsByPartner(partner.id) : [];

  const baseUrl = window.location.origin;
  const referralUrl = isApproved && partner.referralCode
    ? `${baseUrl}/propose?ref=${partner.referralCode}`
    : '';

  const stats = {
    total: referrals.length,
    inquiry: referrals.length,
    contracted: referrals.filter((r) =>
      ['paid', 'approved', 'reward_confirmed', 'reward_paid'].includes(r.status)
    ).length,
    unconfirmedReward: referrals
      .filter((r) => r.rewardStatus === 'unconfirmed')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
    confirmedReward: referrals
      .filter((r) => r.rewardStatus === 'confirmed')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
    paidReward: referrals
      .filter((r) => r.rewardStatus === 'paid')
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
  };

  const bankAccount = getBankAccount(partner.id);

  const lineTemplate = `プロポーズを考えている人向けに、撮影や当日の流れまで相談できるスタジオがあるので共有します。
いきなり申込ではなく、まずは相談からできるので、必要なら見てみてください。
${referralUrl}`;

  return (
    <PartnerLayout>
      <div className="partner-content">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* ヘッダー */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              マイページ
            </h1>
            <StatusBadge status={partner.status} />
          </div>
          <p className="page-subtitle">
            ようこそ、{partner.name}さん。
          </p>
        </div>

        {/* 審査中メッセージ */}
        {!isApproved && (
          <div
            style={{
              padding: '1.5rem 2rem',
              background: 'var(--color-pending-bg)',
              border: '1px solid var(--color-pending-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-pending)' }}>
              {partner.status === 'pending' ? '現在、審査中です' : partner.status === 'rejected' ? '審査結果：否認' : '停止中'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {partner.status === 'pending'
                ? '紹介パートナー登録の審査中です。承認後、紹介リンクが発行されます。今しばらくお待ちください。'
                : partner.status === 'rejected'
                ? '申し訳ございません。今回の審査は否認となりました。詳細はメールにてご確認ください。'
                : 'アカウントが一時停止されています。詳細はスタジオうえじまでお問い合わせください。'}
            </p>
          </div>
        )}

        {/* 紹介リンクセクション（承認済みのみ） */}
        {isApproved && partner.referralCode && (
          <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--color-accent-light)' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Link size={16} style={{ color: 'var(--color-accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    fontWeight: 500,
                  }}
                >
                  あなた専用の紹介リンク
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                このリンクを共有するだけで紹介できます
              </p>
            </div>

            <div className="copy-field" style={{ marginBottom: '0.75rem' }}>
              <div className="copy-field-text">{referralUrl}</div>
              <CopyButton
                text={referralUrl}
                label="コピー"
                onCopied={() => addToast('リンクをコピーしました', 'success')}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: '0.375rem 0.875rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                紹介コード: {partner.referralCode}
              </div>
            </div>
          </div>
        )}

        {/* 2カラム: QRコード＋紹介文 */}
        {isApproved && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* QRコード */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">QRコード</span>
              </div>
              <QRCodeCard url={referralUrl} size={140} />
            </div>

            {/* 紹介文 */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">紹介文テンプレート（LINE用）</span>
                <CopyButton
                  text={lineTemplate}
                  label="コピー"
                  onCopied={() => addToast('紹介文をコピーしました', 'success')}
                />
              </div>
              <div
                style={{
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.9,
                  whiteSpace: 'pre-wrap',
                  minHeight: '120px',
                  border: '1px solid var(--color-border)',
                }}
              >
                {lineTemplate}
              </div>
              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.location.href = '/partner/materials'}
                >
                  他のテンプレートを見る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 統計 */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard label="紹介総件数" value={stats.total} sub="件" />
          <StatCard label="成約件数" value={stats.contracted} sub="件" />
          <StatCard
            label="未確定報酬"
            value={`¥${stats.unconfirmedReward.toLocaleString()}`}
          />
          <StatCard
            label="確定報酬"
            value={`¥${stats.confirmedReward.toLocaleString()}`}
          />
          <StatCard
            label="支払済み報酬"
            value={`¥${stats.paidReward.toLocaleString()}`}
          />
        </div>

        {/* 振込先状況 */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BanknoteIcon size={16} style={{ color: 'var(--color-accent)' }} />
              <span className="card-title">振込先情報</span>
            </div>
          </div>
          {bankAccount ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: 'var(--color-approved-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-approved-border)',
              }}
            >
              <Check size={16} style={{ color: 'var(--color-approved)' }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {bankAccount.bankName} {bankAccount.branchName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  {bankAccount.accountType === 'ordinary' ? '普通' : '当座'} {bankAccount.accountNumber}
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => window.location.href = '/partner/payment'}
              >
                編集
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                報酬確定後、支払い前までに振込先の登録が必要です。
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => window.location.href = '/partner/payment'}
              >
                振込先を登録する
              </button>
            </div>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
}
