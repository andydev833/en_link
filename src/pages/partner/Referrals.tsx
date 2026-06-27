import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';
import { PartnerLayout } from '../../components/layout';
import { StatusBadge, EmptyState } from '../../components/ui';
import { FileText } from 'lucide-react';

export default function PartnerReferrals() {
  const { getCurrentPartner } = usePartnerStore();
  const { getReferralsByPartner } = useReferralStore();
  const partner = getCurrentPartner();
  if (!partner) return null;

  const referrals = getReferralsByPartner(partner.id);

  const menuName = (menuId: string) => menuId === 'm1' ? 'プロポーズ撮影' : menuId;

  return (
    <PartnerLayout>
      <div className="partner-content">
        <div className="page-header">
          <h1 className="page-title">紹介実績</h1>
          <p className="page-subtitle">あなたの紹介状況と報酬状況を確認できます。</p>
        </div>

        {referrals.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<FileText size={32} />}
              title="紹介実績がありません"
              description="紹介リンクを共有して、相談申込があると実績が表示されます。"
            />
          </div>
        ) : (
          <div className="table-container">
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '0.8rem',
                color: 'var(--color-text-tertiary)',
              }}
            >
              ※ お客様の個人情報はプライバシー保護のため非公開です
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>紹介日</th>
                    <th>対象メニュー</th>
                    <th>案件ステータス</th>
                    <th>報酬ステータス</th>
                    <th>報酬額</th>
                    <th>顧客情報</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr
                      key={r.id}
                      style={{ cursor: 'default' }}
                      onClick={() => {}}
                    >
                      <td>{new Date(r.referredAt).toLocaleDateString('ja-JP')}</td>
                      <td>{menuName(r.menuId)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <StatusBadge status={r.rewardStatus} />
                      </td>
                      <td>
                        {r.rewardStatus !== 'unconfirmed' && r.rewardAmount
                          ? `¥${r.rewardAmount.toLocaleString()}`
                          : '—'}
                      </td>
                      <td
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-tertiary)',
                          fontStyle: 'italic',
                        }}
                      >
                        非公開
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 注意書き */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
          }}
        >
          <strong>報酬確定について：</strong>
          お客様の本契約・決済完了後、管理者の承認によって報酬が確定します。
          相談申込・相談実施の時点では報酬は確定されません。
        </div>
      </div>
    </PartnerLayout>
  );
}
