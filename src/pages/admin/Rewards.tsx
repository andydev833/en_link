import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, EmptyState, ToastContainer, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { DollarSign, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function AdminRewards() {
  const navigate = useNavigate();
  const { referrals, markRewardPaid } = useReferralStore();
  const { partners, getBankAccount } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();

  const [filter, setFilter] = useState<'all' | 'confirmed' | 'paid'>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // 報酬対象案件（報酬がある案件）
  const rewardReferrals = useMemo(() => {
    return referrals.filter((r) =>
      ['confirmed', 'paid'].includes(r.rewardStatus) && r.rewardAmount
    );
  }, [referrals]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rewardReferrals;
    return rewardReferrals.filter((r) => r.rewardStatus === filter);
  }, [rewardReferrals, filter]);

  const handleMarkPaid = (id: string) => {
    markRewardPaid(id);
    addToast('支払済みに変更しました', 'success');
    setConfirmId(null);
  };

  const exportCsv = () => {
    const data = filtered.map((r) => {
      const partner = partners.find((p) => p.id === r.partnerId);
      const bank = partner ? getBankAccount(partner.id) : null;
      return {
        紹介者名: partner?.name || '—',
        会社名: partner?.companyName || '—',
        成約金額: r.contractAmount || 0,
        報酬額: r.rewardAmount || 0,
        報酬ステータス: r.rewardStatus,
        報酬確定日: r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('ja-JP') : '—',
        支払日: r.paidAt ? new Date(r.paidAt).toLocaleDateString('ja-JP') : '—',
        銀行名: bank?.bankName || '未登録',
        支店名: bank?.branchName || '—',
        口座番号: bank?.accountNumber || '—',
        口座名義: bank?.accountHolder || '—',
      };
    });
    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rewards_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    addToast('CSVを出力しました', 'success');
  };

  const totalConfirmed = rewardReferrals
    .filter((r) => r.rewardStatus === 'confirmed')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
  const totalPaid = rewardReferrals
    .filter((r) => r.rewardStatus === 'paid')
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  const confirmReferral = confirmId ? referrals.find((r) => r.id === confirmId) : null;
  const confirmPartner = confirmReferral?.partnerId
    ? partners.find((p) => p.id === confirmReferral.partnerId)
    : null;

  return (
    <AdminLayout title="報酬管理">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">報酬管理</h1>
      </div>

      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-card-icon"><DollarSign size={18} /></div>
          <div className="stat-card-label">支払待ち報酬</div>
          <div className="stat-card-value">¥{totalConfirmed.toLocaleString()}</div>
          <div className="stat-card-sub">{rewardReferrals.filter((r) => r.rewardStatus === 'confirmed').length}件</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon"><DollarSign size={18} /></div>
          <div className="stat-card-label">支払済み報酬</div>
          <div className="stat-card-value">¥{totalPaid.toLocaleString()}</div>
          <div className="stat-card-sub">{rewardReferrals.filter((r) => r.rewardStatus === 'paid').length}件</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">合計報酬</div>
          <div className="stat-card-value">
            ¥{(totalConfirmed + totalPaid).toLocaleString()}
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { value: 'all', label: 'すべて' },
            { value: 'confirmed', label: '支払待ち' },
            { value: 'paid', label: '支払済み' },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`btn ${filter === opt.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilter(opt.value as typeof filter)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            <Download size={14} />
            CSV出力
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<DollarSign size={32} />}
            title="報酬データがありません"
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>紹介者名</th>
                <th>会社名</th>
                <th>対象案件</th>
                <th>成約金額</th>
                <th>報酬額</th>
                <th>報酬確定日</th>
                <th>振込先</th>
                <th>ステータス</th>
                <th>支払日</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const partner = partners.find((p) => p.id === r.partnerId);
                const bank = partner ? getBankAccount(partner.id) : null;
                return (
                  <tr key={r.id} onClick={() => navigate(`/admin/referrals/${r.id}`)}>
                    <td style={{ fontWeight: 500 }}>{partner?.name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {partner?.companyName || '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{r.customerName}</td>
                    <td>¥{(r.contractAmount || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>¥{(r.rewardAmount || 0).toLocaleString()}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('ja-JP') : '—'}
                    </td>
                    <td>
                      {bank ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-approved)' }}>登録済み</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-pending)' }}>未登録</span>
                      )}
                    </td>
                    <td><StatusBadge status={r.rewardStatus} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      {r.paidAt ? new Date(r.paidAt).toLocaleDateString('ja-JP') : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.rewardStatus === 'confirmed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setConfirmId(r.id)}
                        >
                          支払済みに変更
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && handleMarkPaid(confirmId)}
        title="支払済みへの変更"
        message={`${confirmPartner?.name}さんへの報酬（¥${(confirmReferral?.rewardAmount || 0).toLocaleString()}）を支払済みに変更してよろしいですか？`}
        confirmLabel="支払済みにする"
        confirmVariant="primary"
      />
    </AdminLayout>
  );
}
