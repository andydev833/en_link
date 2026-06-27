import { useState } from 'react';
import { usePartnerStore } from '../../store/partnerStore';
import { PartnerLayout } from '../../components/layout';
import { ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import type { PartnerBankAccount } from '../../types';

export default function PartnerPayment() {
  const { getCurrentPartner, getBankAccount, saveBankAccount } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();
  const partner = getCurrentPartner();
  if (!partner) return null;

  const existing = getBankAccount(partner.id);

  const [form, setForm] = useState({
    bankName: existing?.bankName || '',
    branchName: existing?.branchName || '',
    accountType: existing?.accountType || 'ordinary',
    accountNumber: existing?.accountNumber || '',
    accountHolder: existing?.accountHolder || '',
    invoiceRegistrationNumber: existing?.invoiceRegistrationNumber || '',
    needsInvoice: existing?.needsInvoice || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.bankName.trim()) e.bankName = '銀行名を入力してください';
    if (!form.branchName.trim()) e.branchName = '支店名を入力してください';
    if (!form.accountNumber.trim()) e.accountNumber = '口座番号を入力してください';
    if (!form.accountHolder.trim()) e.accountHolder = '口座名義を入力してください';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const account: PartnerBankAccount = {
      id: existing?.id || `ba_${Date.now()}`,
      partnerId: partner.id,
      bankName: form.bankName,
      branchName: form.branchName,
      accountType: form.accountType as 'ordinary' | 'current',
      accountNumber: form.accountNumber,
      accountHolder: form.accountHolder,
      invoiceRegistrationNumber: form.invoiceRegistrationNumber || undefined,
      needsInvoice: form.needsInvoice,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveBankAccount(account);
    addToast('振込先情報を保存しました', 'success');
  };

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  return (
    <PartnerLayout>
      <div className="partner-content">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="page-header">
          <h1 className="page-title">振込先登録</h1>
          <p className="page-subtitle">
            報酬のお支払いに使用する口座情報を登録してください。
          </p>
        </div>

        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-light)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '2rem',
            lineHeight: 1.7,
          }}
        >
          報酬確定後、支払い前までに振込先の登録が必要です。
          登録がない場合、お支払いが遅れる場合がございます。
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">銀行口座情報</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">銀行名 <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="〇〇銀行"
                  value={form.bankName}
                  onChange={(e) => update('bankName', e.target.value)}
                />
                {errors.bankName && <div className="form-error">{errors.bankName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">支店名 <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="〇〇支店"
                  value={form.branchName}
                  onChange={(e) => update('branchName', e.target.value)}
                />
                {errors.branchName && <div className="form-error">{errors.branchName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">口座種別 <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={form.accountType}
                  onChange={(e) => update('accountType', e.target.value)}
                >
                  <option value="ordinary">普通</option>
                  <option value="current">当座</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">口座番号 <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="1234567"
                  value={form.accountNumber}
                  onChange={(e) => update('accountNumber', e.target.value)}
                />
                {errors.accountNumber && <div className="form-error">{errors.accountNumber}</div>}
              </div>

              <div className="form-group form-grid-full">
                <label className="form-label">口座名義（カナ） <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="ヤマダ ハナコ"
                  value={form.accountHolder}
                  onChange={(e) => update('accountHolder', e.target.value)}
                />
                {errors.accountHolder && <div className="form-error">{errors.accountHolder}</div>}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">インボイス対応（任意）</div>

            <div className="form-group">
              <label className="form-label">インボイス登録番号</label>
              <input
                className="form-input"
                placeholder="T1234567890123"
                value={form.invoiceRegistrationNumber}
                onChange={(e) => update('invoiceRegistrationNumber', e.target.value)}
              />
              <div className="form-hint">適格請求書発行事業者の場合のみご記入ください</div>
            </div>

            <div className="form-group">
              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  id="needsInvoice"
                  checked={form.needsInvoice}
                  onChange={(e) => update('needsInvoice', e.target.checked)}
                />
                <label htmlFor="needsInvoice" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                  支払調書・請求書の対応が必要
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {existing ? '振込先情報を更新する' : '振込先情報を登録する'}
          </button>
        </form>
      </div>
    </PartnerLayout>
  );
}
