import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useReferralStore } from '../../store/referralStore';
import { usePartnerStore } from '../../store/partnerStore';
import { useLpStore } from '../../store/lpStore';

type ConsultationMethod = 'in_person' | 'online';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  consultationMethod: ConsultationMethod;
  firstPreferredDate: string;
  secondPreferredDate: string;
  proposalTiming: string;
  inquiryMessage: string;
  agreePrivacy: boolean;
}

export default function ContactPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createReferral } = useReferralStore();
  const { getPartnerByCode } = usePartnerStore();
  const { trackEvent } = useLpStore();

  const ref = searchParams.get('ref') || localStorage.getItem('enlink_ref') || '';
  const utmSource = searchParams.get('utm_source') || localStorage.getItem('enlink_utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || localStorage.getItem('enlink_utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || localStorage.getItem('enlink_utm_campaign') || '';

  const partner = ref ? getPartnerByCode(ref) : null;

  const [form, setForm] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    consultationMethod: 'in_person',
    firstPreferredDate: '',
    secondPreferredDate: '',
    proposalTiming: '',
    inquiryMessage: '',
    agreePrivacy: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const startedRef = useRef(false);

  // フォーム到達計測
  useEffect(() => {
    trackEvent({ eventType: 'form_view', referralCode: ref, utmSource, utmMedium, utmCampaign });

    // 離脱検知
    const handleBeforeUnload = () => {
      if (startedRef.current) {
        trackEvent({ eventType: 'form_abandon', referralCode: ref });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key: keyof FormData, value: string | boolean) => {
    // 初回入力でform_start計測
    if (!startedRef.current && value) {
      startedRef.current = true;
      trackEvent({ eventType: 'form_start', referralCode: ref });
    }
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.customerName.trim()) newErrors.customerName = 'お名前を入力してください';
    if (!form.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      newErrors.customerEmail = '正しいメールアドレスを入力してください';
    if (!form.customerPhone.trim()) newErrors.customerPhone = '電話番号を入力してください';
    if (!form.firstPreferredDate) newErrors.firstPreferredDate = '第1希望日を入力してください';
    if (!form.agreePrivacy) newErrors.agreePrivacy = '個人情報の取り扱いに同意してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const referralData = {
      menuId: 'm1', // プロポーズ撮影
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      consultationMethod: form.consultationMethod,
      consultationPreferredDate1: form.firstPreferredDate,
      consultationPreferredDate2: form.secondPreferredDate,
      proposalTiming: form.proposalTiming,
      inquiryMessage: form.inquiryMessage,
      partnerId: partner?.id,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer: document.referrer,
      referralCode: ref || undefined,
      status: 'inquiry' as const,
      rewardStatus: 'unconfirmed' as const,
    };

    await createReferral(referralData);

    trackEvent({ eventType: 'form_submit', referralCode: ref, utmSource, utmMedium, utmCampaign });
    startedRef.current = false;

    // ref/utmをクリア（送信後は不要）
    localStorage.removeItem('enlink_ref');
    localStorage.removeItem('enlink_utm_source');
    localStorage.removeItem('enlink_utm_medium');
    localStorage.removeItem('enlink_utm_campaign');

    navigate('/contact/thanks');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: 'var(--font-serif)' }}>
      {/* ヘッダー */}
      <div style={{ background: '#0E0C0A', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#C9A96E', textTransform: 'uppercase' }}>
          Studio Ueji
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.25rem' }} />
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 300, marginBottom: '0.75rem' }}>
            無料相談のお申込み
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.9 }}>
            無料相談は、具体的な演出内容や式場チャペルの利用可否を確認するため、<br />
            原則スタジオうえじ店舗で実施しています。
          </p>
          {partner && (
            <div style={{
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--color-approved)',
              background: 'var(--color-approved-bg)',
              border: '1px solid var(--color-approved-border)',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
            }}>
              ご紹介：{partner.name}さんからのご紹介
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 氏名 */}
          <div className="form-group">
            <label className="form-label">
              お名前 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.customerName ? 'form-input-error' : ''}`}
              placeholder="山田 太郎"
              value={form.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
            />
            {errors.customerName && <div className="form-error">{errors.customerName}</div>}
          </div>

          {/* メール */}
          <div className="form-group">
            <label className="form-label">
              メールアドレス <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.customerEmail ? 'form-input-error' : ''}`}
              type="email"
              placeholder="sample@example.com"
              value={form.customerEmail}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
            />
            {errors.customerEmail && <div className="form-error">{errors.customerEmail}</div>}
          </div>

          {/* 電話番号 */}
          <div className="form-group">
            <label className="form-label">
              電話番号 <span className="required">*</span>
            </label>
            <input
              className={`form-input ${errors.customerPhone ? 'form-input-error' : ''}`}
              type="tel"
              placeholder="090-0000-0000"
              value={form.customerPhone}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
            />
            {errors.customerPhone && <div className="form-error">{errors.customerPhone}</div>}
          </div>

          {/* 希望相談方法 */}
          <div className="form-group">
            <label className="form-label">希望相談方法</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              無料相談は原則、スタジオうえじ店舗での対面実施となります。
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { value: 'in_person', label: '対面（スタジオ）' },
                { value: 'online', label: 'オンライン' },
              ].map((opt) => (
                <label key={opt.value} className="form-radio-option">
                  <input
                    type="radio"
                    name="consultationMethod"
                    value={opt.value}
                    checked={form.consultationMethod === opt.value}
                    onChange={() => handleChange('consultationMethod', opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 第1・第2希望日 */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                第1希望日 <span className="required">*</span>
              </label>
              <input
                className={`form-input ${errors.firstPreferredDate ? 'form-input-error' : ''}`}
                type="date"
                value={form.firstPreferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('firstPreferredDate', e.target.value)}
              />
              {errors.firstPreferredDate && <div className="form-error">{errors.firstPreferredDate}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">第2希望日</label>
              <input
                className="form-input"
                type="date"
                value={form.secondPreferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange('secondPreferredDate', e.target.value)}
              />
            </div>
          </div>

          {/* プロポーズ予定時期 */}
          <div className="form-group">
            <label className="form-label">プロポーズ予定時期</label>
            <select
              className="form-select"
              value={form.proposalTiming}
              onChange={(e) => handleChange('proposalTiming', e.target.value)}
            >
              <option value="">選択してください</option>
              <option value="1ヶ月以内">1ヶ月以内</option>
              <option value="2〜3ヶ月以内">2〜3ヶ月以内</option>
              <option value="3〜6ヶ月以内">3〜6ヶ月以内</option>
              <option value="6ヶ月以上先">6ヶ月以上先</option>
              <option value="未定">未定</option>
            </select>
          </div>

          {/* メッセージ */}
          <div className="form-group">
            <label className="form-label">ご要望・ご質問など</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="演出内容・ご要望・ご質問などお気軽にどうぞ"
              value={form.inquiryMessage}
              onChange={(e) => handleChange('inquiryMessage', e.target.value)}
            />
          </div>

          {/* 個人情報同意 */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="form-checkbox"
                style={{ marginTop: 2 }}
                checked={form.agreePrivacy}
                onChange={(e) => handleChange('agreePrivacy', e.target.checked)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                <a href="#" style={{ color: 'var(--color-accent-dark)' }}>個人情報の取り扱い</a>に同意する
                <span className="required"> *</span>
              </span>
            </label>
            {errors.agreePrivacy && <div className="form-error">{errors.agreePrivacy}</div>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? '#999' : 'linear-gradient(135deg, #C9A96E, #A67C52)',
              color: '#FAF8F5',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '0.9375rem',
              letterSpacing: '0.1em',
              borderRadius: 2,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-serif)',
              marginTop: '0.5rem',
            }}
          >
            {submitting ? '送信中...' : '相談を申し込む'}
          </button>
        </form>
      </div>
    </div>
  );
}
