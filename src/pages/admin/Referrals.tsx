import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, EmptyState, ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { FileText, Search, Download } from 'lucide-react';
import Papa from 'papaparse';

export default function AdminReferrals() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { referrals } = useReferralStore();
  const { partners } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [rewardFilter, setRewardFilter] = useState('all');
  const [keyword, setKeyword] = useState('');

  const getPartnerName = (partnerId?: string) => {
    if (!partnerId) return '直接申込';
    return partners.find((p) => p.id === partnerId)?.name || '—';
  };

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (rewardFilter !== 'all' && r.rewardStatus !== rewardFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        const partnerName = getPartnerName(r.partnerId).toLowerCase();
        return (
          r.customerName.toLowerCase().includes(kw) ||
          partnerName.includes(kw)
        );
      }
      return true;
    });
  }, [referrals, statusFilter, rewardFilter, keyword]);

  const exportCsv = () => {
    const data = filtered.map((r) => ({
      紹介日: new Date(r.referredAt).toLocaleDateString('ja-JP'),
      紹介者: getPartnerName(r.partnerId),
      顧客名: r.customerName,
      ステータス: r.status,
      成約金額: r.contractAmount || 0,
      報酬額: r.rewardAmount || 0,
      報酬ステータス: r.rewardStatus,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    addToast('CSVを出力しました', 'success');
  };

  return (
    <AdminLayout title="紹介案件">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">紹介案件一覧</h1>
        <p className="page-subtitle">{referrals.length}件</p>
      </div>

      {/* フィルター */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            className="form-input"
            placeholder="顧客名・紹介者名で検索"
            style={{ paddingLeft: '2.25rem' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">すべてのステータス</option>
          <option value="inquiry">問い合わせ</option>
          <option value="scheduling">相談調整中</option>
          <option value="scheduled">相談予定</option>
          <option value="consulted">相談実施済み</option>
          <option value="paid">決済完了</option>
          <option value="reward_confirmed">報酬確定</option>
          <option value="reward_paid">支払済み</option>
          <option value="lost">失注</option>
          <option value="excluded">対象外</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={rewardFilter} onChange={(e) => setRewardFilter(e.target.value)}>
          <option value="all">すべての報酬ステータス</option>
          <option value="unconfirmed">未確定</option>
          <option value="confirmed">確定</option>
          <option value="paid">支払済み</option>
          <option value="excluded">対象外</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
          <Download size={14} />
          CSV出力
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={32} />}
            title="案件が見つかりません"
            description="フィルター条件を変更してみてください。"
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>紹介日</th>
                <th>紹介者</th>
                <th>顧客名</th>
                <th>ステータス</th>
                <th>相談希望日</th>
                <th>成約金額</th>
                <th>報酬額</th>
                <th>報酬ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/admin/referrals/${r.id}`)}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    {new Date(r.referredAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {getPartnerName(r.partnerId)}
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {r.consultationPreferredDate1
                      ? new Date(r.consultationPreferredDate1).toLocaleDateString('ja-JP')
                      : '—'}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {r.contractAmount ? `¥${r.contractAmount.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {r.rewardAmount ? `¥${r.rewardAmount.toLocaleString()}` : '—'}
                  </td>
                  <td><StatusBadge status={r.rewardStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
