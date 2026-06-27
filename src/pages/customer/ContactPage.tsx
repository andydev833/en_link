import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import type { Referral } from '../../types';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref') || localStorage.getItem('enlink_ref') || '';

  const { addReferral } = useReferralStore();
  const { getPartnerByCode } = usePartnerStore();

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerArea: '',
    proposalTiming: '',
    budgetRange: '',
    consultationMethod: 'in_person' as 'in_person' | 'online',
    consultationPreferredDate1: '',
    consultationPreferredDate2: '',
    consultationContent: '',
    agreed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = '氏名を入力してください';
    if (!form.customerEmail.trim()) e.customerEmail = 'メールアドレスを入力してください';
    if (!form.customerPhone.trim()) e.customerPhone = '電話番号を入力してください';
    if (!form.agreed) e.agreed = '個人情報の取扱いに同意してください';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    // 紹介者を解決
    let partnerId: string | undefined;
    if (refCode) {
      const partner = getPartnerByCode(refCode);
      if (partner && partner.status === 'approved') {
        partnerId = partner.id;
      }
    }

    const referral: Referral = {
      id: `r_${Date.now()}`,
      partnerId,
      menuId: 'm1',
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      customerArea: form.customerArea,
      proposalTiming: form.proposalTiming,
      budgetRange: form.budgetRange,
      consultationMethod: form.consultationMethod,
      consultationPreferredDate1: form.consultationPreferredDate1,
      consultationPreferredDate2: form.consultationPreferredDate2,
      consultationContent: form.consultationContent,
      status: 'inquiry',
      rewardStatus: 'unconfirmed',
      referredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReferral(referral);

    // localStorageのrefコードをクリア
    localStorage.removeItem('enlink_ref');

    navigate('/contact/thanks');
  };

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/propose')}
        >
          スタジオうえじ
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          プロポーズ撮影 相談申込
        </div>
      </header>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 400,
              marginBottom: '0.75rem',
            }}
          >
            プロポーズ撮影 無料相談申込
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
            ご要望・ご希望の日時をお知らせください。<br />
            内容を確認のうえ、担当者よりご連絡いたします。
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title" style={{ marginBottom: '1.25rem' }}>お客様情報</div>

            <div className="form-group">
              <label className="form-label">氏名 <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="山田 太郎"
                value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
              />
              {errors.customerName && <div className="form-error">{errors.customerName}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">メールアドレス <span className="required">*</span></label>
              <input
                className="form-input"
                type="email"
                placeholder="example@mail.com"
                value={form.customerEmail}
                onChange={(e) => update('customerEmail', e.target.value)}
              />
              {errors.customerEmail && <div className="form-error">{errors.customerEmail}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">電話番号 <span className="required">*</span></label>
              <input
                className="form-input"
                placeholder="090-0000-0000"
                value={form.customerPhone}
                onChange={(e) => update('customerPhone', e.target.value)}
              />
              {errors.customerPhone && <div className="form-error">{errors.customerPhone}</div>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title" style={{ marginBottom: '1.25rem' }}>相談内容</div>

            <div className="form-group">
              <label className="form-label">希望相談方法</label>
              <div className="form-radio-group">
                <label className="form-radio-option">
                  <input
                    type="radio"
                    name="consultationMethod"
                    value="in_person"
                    checked={form.consultationMethod === 'in_person'}
                    onChange={() => update('consultationMethod', 'in_person')}
                  />
                  対面
                </label>
                <label className="form-radio-option">
                  <input
                    type="radio"
                    name="consultationMethod"
                    value="online"
                    checked={form.consultationMethod === 'online'}
                    onChange={() => update('consultationMethod', 'online')}
                  />
                  オンライン
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">第1希望日</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.consultationPreferredDate1}
                  onChange={(e) => update('consultationPreferredDate1', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">第2希望日</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.consultationPreferredDate2}
                  onChange={(e) => update('consultationPreferredDate2', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">プロポーズ予定時期</label>
              <input
                className="form-input"
                placeholder="例：2026年秋頃、3〜6ヶ月以内"
                value={form.proposalTiming}
                onChange={(e) => update('proposalTiming', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">希望エリア</label>
              <input
                className="form-input"
                placeholder="例：大阪市内、神戸、京都など"
                value={form.customerArea}
                onChange={(e) => update('customerArea', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">検討予算（目安）</label>
              <select
                className="form-select"
                value={form.budgetRange}
                onChange={(e) => update('budgetRange', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="〜10万円">〜10万円</option>
                <option value="10〜20万円">10〜20万円</option>
                <option value="20〜30万円">20〜30万円</option>
                <option value="30〜50万円">30〜50万円</option>
                <option value="50〜80万円">50〜80万円</option>
                <option value="80万円以上">80万円以上</option>
                <option value="未定">未定・相談したい</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">相談内容・ご要望</label>
              <textarea
                className="form-textarea"
                placeholder="どんな撮影にしたいか、サプライズの希望、場所の希望など、自由にお書きください。"
                rows={4}
                value={form.consultationContent}
                onChange={(e) => update('consultationContent', e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                className="form-checkbox"
                id="agreed"
                checked={form.agreed}
                onChange={(e) => update('agreed', e.target.checked)}
              />
              <label htmlFor="agreed" style={{ fontSize: '0.875rem', lineHeight: 1.6, cursor: 'pointer' }}>
                <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                  個人情報の取扱い
                </a>
                について同意します <span style={{ color: 'var(--color-rejected)', fontSize: '0.75rem' }}>*</span>
              </label>
            </div>
            {errors.agreed && <div className="form-error" style={{ marginTop: '0.5rem' }}>{errors.agreed}</div>}
          </div>

          {refCode && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.875rem 1rem',
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              紹介リンク経由でのお申し込みです。紹介コード: <strong>{refCode}</strong>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-xl"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? '送信中...' : '相談を申し込む'}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--color-text-tertiary)',
              marginTop: '1rem',
            }}
          >
            送信後、担当者より2営業日以内にご連絡いたします。
          </p>
        </form>
      </div>
    </div>
  );
}
