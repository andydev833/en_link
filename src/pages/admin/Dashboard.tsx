import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, StatCard } from '../../components/ui';
import { Users, FileText, DollarSign, AlertCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { partners } = usePartnerStore();
  const { referrals } = useReferralStore();

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const pendingPartners = partners.filter((p) => p.status === 'pending');
  const approvedPartners = partners.filter((p) => p.status === 'approved');

  const monthReferrals = referrals.filter(
    (r) => r.createdAt.startsWith(thisMonth)
  );
  const monthContracted = referrals.filter(
    (r) =>
      r.contractedAt?.startsWith(thisMonth) &&
      ['paid', 'approved', 'reward_confirmed', 'reward_paid'].includes(r.status)
  );
  const monthContractAmount = monthContracted.reduce(
    (sum, r) => sum + (r.contractAmount || 0),
    0
  );

  const pendingApproval = referrals.filter((r) => r.status === 'paid');
  const pendingPayment = referrals.filter((r) => r.rewardStatus === 'confirmed');
  const confirmedRewardTotal = pendingPayment.reduce(
    (sum, r) => sum + (r.rewardAmount || 0),
    0
  );
  const unconfirmedReward = referrals
    .filter((r) => r.rewardStatus === 'unconfirmed')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  const recentReferrals = referrals
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const STATUS_MAP: Record<string, string> = {
    pending: '審査中',
    approved: '承認済み',
    rejected: '否認',
    suspended: '停止中',
    inquiry: '問い合わせ',
    scheduling: '相談調整中',
    scheduled: '相談予定',
    consulted: '相談実施済み',
    paid: '決済完了',
    approved_r: '承認済み',
    reward_confirmed: '報酬確定',
    reward_paid: '支払済み',
    lost: '失注',
    excluded: '対象外',
  };

  return (
    <AdminLayout title="ダッシュボード">
      {/* 要対応アラート */}
      {(pendingPartners.length > 0 || pendingApproval.length > 0 || pendingPayment.length > 0) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          {pendingPartners.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: 'var(--color-pending-bg)',
                border: '1px solid var(--color-pending-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/admin/partners?status=pending')}
            >
              <AlertCircle size={16} style={{ color: 'var(--color-pending)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>
                <strong>{pendingPartners.length}件</strong>の紹介者申請が審査待ちです
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>確認する →</span>
            </div>
          )}
          {pendingApproval.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: 'var(--color-approved-bg)',
                border: '1px solid var(--color-approved-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/admin/referrals?status=paid')}
            >
              <Clock size={16} style={{ color: 'var(--color-approved)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>
                <strong>{pendingApproval.length}件</strong>の案件が決済完了・承認待ちです
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>確認する →</span>
            </div>
          )}
          {pendingPayment.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-light)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/admin/rewards')}
            >
              <DollarSign size={16} style={{ color: 'var(--color-accent-dark)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>
                <strong>¥{confirmedRewardTotal.toLocaleString()}</strong> の支払待ち報酬があります（{pendingPayment.length}件）
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>確認する →</span>
            </div>
          )}
        </div>
      )}

      {/* 統計カード */}
      <div className="stats-grid stats-grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          label="承認待ち紹介者"
          value={pendingPartners.length}
          sub="件"
          icon={<Users size={18} />}
        />
        <StatCard
          label="承認済み紹介者"
          value={approvedPartners.length}
          sub="件"
          icon={<Users size={18} />}
        />
        <StatCard
          label="今月の相談申込"
          value={monthReferrals.length}
          sub="件"
          icon={<FileText size={18} />}
        />
        <StatCard
          label="今月の成約数"
          value={monthContracted.length}
          sub="件"
          icon={<FileText size={18} />}
        />
        <StatCard
          label="今月の成約金額"
          value={`¥${monthContractAmount.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="未確定報酬"
          value={`¥${unconfirmedReward.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="支払待ち報酬"
          value={`¥${confirmedRewardTotal.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* 下部2カラム */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* 最近の紹介案件 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">最近の紹介案件</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/referrals')}
            >
              すべて見る
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentReferrals.map((r) => {
              const partner = partners.find((p) => p.id === r.partnerId);
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: '1px solid var(--color-border-light)',
                  }}
                  onClick={() => navigate(`/admin/referrals/${r.id}`)}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {r.customerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {partner ? partner.name : '直接申込'} •{' '}
                      {new Date(r.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              );
            })}
          </div>
        </div>

        {/* 承認待ち紹介者 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">承認待ち紹介者</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/admin/partners')}
            >
              すべて見る
            </button>
          </div>
          {pendingPartners.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-text-tertiary)',
              }}
            >
              承認待ちはありません
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingPartners.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: '1px solid var(--color-border-light)',
                  }}
                  onClick={() => navigate(`/admin/partners/${p.id}`)}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {p.companyName || p.businessCategory || '個人'} •{' '}
                      {new Date(p.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/partners/${p.id}`);
                    }}
                  >
                    審査する
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
