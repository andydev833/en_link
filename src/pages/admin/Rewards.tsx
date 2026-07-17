import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import { AdminLayout } from '../../components/layout';
import { StatusBadge, EmptyState, ToastContainer, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { DollarSign, Download, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Papa from 'papaparse';

type ViewMode = 'list' | 'monthly';

// 月次集計用のグルーピング
function groupByMonth(referrals: ReturnType<typeof useReferralStore.getState>['referrals']) {
  const groups: Record<string, typeof referrals> = {};
  for (const r of referrals) {
    const monthKey = r.approvedAt
      ? r.approvedAt.slice(0, 7)
      : (r.paidAt ? r.paidAt.slice(0, 7) : r.createdAt.slice(0, 7));
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(r);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function AdminRewards() {
  const navigate = useNavigate();
  const { referrals, markRewardPaid } = useReferralStore();
  const { partners, getBankAccount } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();

  const [filter, setFilter] = useState<'all' | 'confirmed' | 'paid'>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [paymentDates, setPaymentDates] = useState<Record<string, string>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

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
        メールアドレス: partner?.email || '—',
        電話番号: partner?.phone || '—',
        成約金額: r.contractAmount || 0,
        報酬額: r.rewardAmount || 0,
        報酬ステータス: r.rewardStatus === 'confirmed' ? '支払待ち' : '支払済み',
        報酬確定日: r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('ja-JP') : '—',
        支払日: r.paidAt ? new Date(r.paidAt).toLocaleDateString('ja-JP') : '—',
        銀行名: bank?.bankName || '未登録',
        金融機関コード: bank?.bankCode || '—',
        支店名: bank?.branchName || '—',
        支店コード: bank?.branchCode || '—',
        口座種別: bank?.accountType === 'ordinary' ? '普通' : bank?.accountType === 'current' ? '当座' : '—',
        口座番号: bank?.accountNumber || '—',
        口座名義カナ: bank?.accountHolderKana || bank?.accountHolder || '—',
        インボイス番号: bank?.invoiceRegistrationNumber || '—',
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

  // 月次グループ
  const monthlyGroups = useMemo(() => groupByMonth(rewardReferrals), [rewardReferrals]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  return (
    <AdminLayout title="報酬管理">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">報酬管理</h1>
            <p className="page-subtitle">紹介パートナーへの報酬を管理します</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              一覧表示
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('monthly')}
            >
              <Calendar size={14} />
              月次集計
            </button>
          </div>
        </div>
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
          <div className="stat-card-label">累計報酬</div>
          <div className="stat-card-value">¥{(totalConfirmed + totalPaid).toLocaleString()}</div>
        </div>
      </div>

      {/* ===== 月次集計ビュー ===== */}
      {viewMode === 'monthly' && (
        <div>
          {monthlyGroups.length === 0 ? (
            <div className="card">
              <EmptyState icon={<DollarSign size={32} />} title="報酬データがありません" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {monthlyGroups.map(([monthKey, monthReferrals]) => {
                const [year, month] = monthKey.split('-');
                const monthLabel = `${year}年${parseInt(month)}月`;
                const monthConfirmed = monthReferrals.filter((r) => r.rewardStatus === 'confirmed');
                const monthPaid = monthReferrals.filter((r) => r.rewardStatus === 'paid');
                const monthTotal = monthReferrals.reduce((s, r) => s + (r.rewardAmount || 0), 0);
                const isExpanded = !!expandedMonths[monthKey];

                return (
                  <div key={monthKey} className="card" style={{ overflow: 'hidden' }}>
                    {/* 月次ヘッダー */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                      }}
                      onClick={() => toggleMonth(monthKey)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{monthLabel}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                          {monthReferrals.length}件
                        </span>
                        {monthConfirmed.length > 0 && (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-pending-bg)', border: '1px solid var(--color-pending-border)', color: 'var(--color-pending)' }}>
                            支払待ち {monthConfirmed.length}件
                          </span>
                        )}
                        {monthPaid.length > 0 && (
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-approved-bg)', border: '1px solid var(--color-approved-border)', color: 'var(--color-approved)' }}>
                            支払済み {monthPaid.length}件
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: '1.125rem' }}>
                          ¥{monthTotal.toLocaleString()}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* 展開時: 支払予定日設定 + 明細 */}
                    {isExpanded && (
                      <div>
                        {/* 支払予定日設定 */}
                        <div style={{ padding: '0.875rem 1.25rem', background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={14} />
                            支払予定日：
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ width: 'auto', maxWidth: 200, padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                            value={paymentDates[monthKey] || ''}
                            onChange={(e) => setPaymentDates((d) => ({ ...d, [monthKey]: e.target.value }))}
                          />
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => exportCsv()}
                          >
                            <Download size={14} />
                            この月のCSV出力
                          </button>
                          {monthConfirmed.length > 0 && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                monthConfirmed.forEach((r) => markRewardPaid(r.id));
                                addToast(`${monthConfirmed.length}件を支払済みにしました`, 'success');
                              }}
                            >
                              {monthConfirmed.length}件を一括支払済み
                            </button>
                          )}
                        </div>
                        {/* 明細テーブル */}
                        <table className="table">
                          <thead>
                            <tr>
                              <th>紹介者名</th>
                              <th>対象案件</th>
                              <th>成約金額</th>
                              <th>報酬額</th>
                              <th>振込先</th>
                              <th>ステータス</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthReferrals.map((r) => {
                              const partner = partners.find((p) => p.id === r.partnerId);
                              const bank = partner ? getBankAccount(partner.id) : null;
                              return (
                                <tr key={r.id} onClick={() => navigate(`/admin/referrals/${r.id}`)}>
                                  <td style={{ fontWeight: 500 }}>{partner?.name || '—'}</td>
                                  <td style={{ fontSize: '0.8rem' }}>{r.customerName}</td>
                                  <td>¥{(r.contractAmount || 0).toLocaleString()}</td>
                                  <td style={{ fontWeight: 600 }}>¥{(r.rewardAmount || 0).toLocaleString()}</td>
                                  <td>
                                    {bank ? (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-approved)' }}>登録済み</span>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-pending)' }}>未登録</span>
                                    )}
                                  </td>
                                  <td><StatusBadge status={r.rewardStatus} /></td>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== 一覧ビュー ===== */}
      {viewMode === 'list' && (
        <>
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
              <EmptyState icon={<DollarSign size={32} />} title="報酬データがありません" />
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
        </>
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
