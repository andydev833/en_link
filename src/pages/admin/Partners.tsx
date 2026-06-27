import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, EmptyState, ToastContainer, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { Users, Search } from 'lucide-react';
import type { PartnerStatus } from '../../types';

export default function AdminPartners() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partners, approvePartner, rejectPartner, suspendPartner, reapprovePartner } = usePartnerStore();
  const { referrals } = useReferralStore();
  const { toasts, addToast, removeToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.partnerType !== typeFilter) return false;
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          p.name.toLowerCase().includes(kw) ||
          p.email.toLowerCase().includes(kw) ||
          (p.companyName?.toLowerCase().includes(kw) ?? false) ||
          (p.area?.toLowerCase().includes(kw) ?? false)
        );
      }
      return true;
    });
  }, [partners, statusFilter, typeFilter, keyword]);

  const getStats = (partnerId: string) => {
    const pReferrals = referrals.filter((r) => r.partnerId === partnerId);
    const contracted = pReferrals.filter((r) =>
      ['paid', 'approved', 'reward_confirmed', 'reward_paid'].includes(r.status)
    );
    const rate = pReferrals.length > 0
      ? Math.round((contracted.length / pReferrals.length) * 100)
      : 0;
    const totalReward = pReferrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    return { total: pReferrals.length, contracted: contracted.length, rate, totalReward };
  };

  const handleAction = (type: string, id: string, name: string) => {
    setConfirmAction({ type, id, name });
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    if (type === 'approve') { approvePartner(id); addToast('承認しました', 'success'); }
    else if (type === 'reject') { rejectPartner(id); addToast('否認しました', 'info'); }
    else if (type === 'suspend') { suspendPartner(id); addToast('停止しました', 'info'); }
    else if (type === 'reapprove') { reapprovePartner(id); addToast('再承認しました', 'success'); }
    setConfirmAction(null);
  };

  const ACTION_LABELS: Record<string, string> = {
    approve: '承認',
    reject: '否認',
    suspend: '停止',
    reapprove: '再承認',
  };
  const ACTION_VARIANTS: Record<string, string> = {
    approve: 'accent',
    reject: 'danger',
    suspend: 'danger',
    reapprove: 'primary',
  };

  return (
    <AdminLayout title="紹介者管理">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">紹介者一覧</h1>
        <p className="page-subtitle">{partners.length}名登録</p>
      </div>

      {/* フィルター */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            className="form-input"
            placeholder="名前・メール・会社名で検索"
            style={{ paddingLeft: '2.25rem' }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">すべてのステータス</option>
          <option value="pending">審査中</option>
          <option value="approved">承認済み</option>
          <option value="rejected">否認</option>
          <option value="suspended">停止中</option>
        </select>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">すべての種別</option>
          <option value="individual">個人</option>
          <option value="business">法人</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={32} />}
            title="紹介者が見つかりません"
            description="フィルター条件を変更してみてください。"
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>登録日</th>
                <th>種別</th>
                <th>氏名</th>
                <th>会社名</th>
                <th>エリア</th>
                <th>ステータス</th>
                <th>紹介</th>
                <th>成約</th>
                <th>成約率</th>
                <th>報酬合計</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stats = getStats(p.id);
                return (
                  <tr key={p.id} onClick={() => navigate(`/admin/partners/${p.id}`)}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)' }}>
                        {p.partnerType === 'individual' ? '個人' : '法人'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {p.companyName || '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {p.area}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ textAlign: 'center' }}>{stats.total}</td>
                    <td style={{ textAlign: 'center' }}>{stats.contracted}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: stats.rate > 0 ? 'var(--color-approved)' : 'var(--color-text-tertiary)' }}>
                        {stats.rate}%
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ¥{stats.totalReward.toLocaleString()}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {p.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-accent btn-sm"
                              onClick={() => handleAction('approve', p.id, p.name)}
                            >
                              承認
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleAction('reject', p.id, p.name)}
                            >
                              否認
                            </button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleAction('suspend', p.id, p.name)}
                          >
                            停止
                          </button>
                        )}
                        {(p.status === 'rejected' || p.status === 'suspended') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAction('reapprove', p.id, p.name)}
                          >
                            再承認
                          </button>
                        )}
                      </div>
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
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        title={`${ACTION_LABELS[confirmAction?.type || '']}の確認`}
        message={`${confirmAction?.name}さんを${ACTION_LABELS[confirmAction?.type || '']}してよろしいですか？`}
        confirmLabel={ACTION_LABELS[confirmAction?.type || ''] || '確認'}
        confirmVariant={ACTION_VARIANTS[confirmAction?.type || ''] || 'primary'}
      />
    </AdminLayout>
  );
}
