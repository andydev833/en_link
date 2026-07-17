import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import type { Partner, IntroductionChannel } from '../../types';

const BUSINESS_CATEGORIES = [
  '個人（既存顧客）',
  'ジュエリーショップ',
  '結婚相談所',
  '花屋',
  'ホテル',
  'レストラン',
  '美容室',
  'ブライダル関連',
  '保険営業',
  '士業',
  '不動産',
  'その他',
];

const INTRODUCTION_CHANNELS: { value: IntroductionChannel; label: string }[] = [
  { value: 'store', label: '店舗での対面紹介' },
  { value: 'sns', label: 'SNS（Instagram・X 等）' },
  { value: 'line', label: 'LINE・メッセージ' },
  { value: 'existing_customer', label: '既存顧客への案内' },
  { value: 'business_partner', label: 'ビジネスパートナー経由' },
  { value: 'other', label: 'その他' },
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const { addPartner } = usePartnerStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    partnerType: 'individual' as 'individual' | 'business',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    area: '',
    businessCategory: '',
    businessType: '',
    customerSegment: '',
    instagramAccount: '',
    introductionChannels: [] as IntroductionChannel[],
    notes: '',
    password: '',
    passwordConfirm: '',
    // 3つの同意
    agreedTerms: false,
    agreedAdPolicy: false,
    agreedAntiSocial: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '氏名を入力してください';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = '正しいメールアドレスを入力してください';
    if (!form.phone.trim()) e.phone = '電話番号を入力してください';
    if (!form.area.trim()) e.area = '活動エリアを入力してください';
    if (!form.password.trim()) e.password = 'パスワードを入力してください';
    if (form.password.length > 0 && form.password.length < 6)
      e.password = '6文字以上のパスワードを設定してください';
    if (form.password !== form.passwordConfirm)
      e.passwordConfirm = 'パスワードが一致しません';
    if (form.partnerType === 'business') {
      if (!form.companyName.trim()) e.companyName = '会社名・屋号を入力してください';
      if (!form.businessCategory.trim()) e.businessCategory = '事業カテゴリを選択してください';
    }
    if (!form.agreedTerms) e.agreedTerms = '紹介パートナー規約への同意が必要です';
    if (!form.agreedAdPolicy) e.agreedAdPolicy = '広告・紹介活動ポリシーへの同意が必要です';
    if (!form.agreedAntiSocial) e.agreedAntiSocial = '反社会的勢力に該当しないことの確認が必要です';
    return e;
  };

  const toggleChannel = (value: IntroductionChannel) => {
    setForm((f) => {
      const channels = f.introductionChannels.includes(value)
        ? f.introductionChannels.filter((c) => c !== value)
        : [...f.introductionChannels, value];
      return { ...f, introductionChannels: channels };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    const partner: Partner = {
      id: `p_${Date.now()}`,
      partnerType: form.partnerType,
      name: form.name,
      companyName: form.companyName || undefined,
      email: form.email,
      phone: form.phone,
      area: form.area,
      businessCategory: form.businessCategory || undefined,
      businessType: form.businessType || undefined,
      customerSegment: form.customerSegment || undefined,
      instagramAccount: form.instagramAccount || undefined,
      introductionChannels: form.introductionChannels.length > 0 ? form.introductionChannels : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      passwordHash: form.password,
      memo: form.notes || undefined,
      agreedTerms: form.agreedTerms,
      agreedAdPolicy: form.agreedAdPolicy,
      agreedAntiSocial: form.agreedAntiSocial,
    };

    await addPartner(partner);
    setSubmitting(false);
    setSubmitted(true);
  };

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'var(--color-approved-bg)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.5rem',
              color: 'var(--color-approved)',
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
              fontWeight: 400,
            }}
          >
            登録申請を受け付けました
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
              marginBottom: '2rem',
            }}
          >
            審査完了後、承認のご連絡をいたします。<br />
            承認後、紹介リンクが発行されます。
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/partner/login')}
            style={{ width: '100%' }}
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
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
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9rem' }}>
          スタジオうえじ <span style={{ color: 'var(--color-accent)' }}>En Link</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/partner/login')}>
          ログイン
        </button>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 400,
              marginBottom: '0.5rem',
            }}
          >
            紹介パートナー登録申請
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            審査後、承認のご連絡をいたします。
          </p>
        </div>

        {hasErrors && (
          <div style={{ padding: '1rem', background: 'var(--color-rejected-bg)', border: '1px solid var(--color-rejected-border)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-rejected)' }}>
            入力内容をご確認ください
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* 紹介者区分 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">紹介者区分</div>
            <div className="form-group">
              <div className="form-radio-group">
                <label className="form-radio-option">
                  <input
                    type="radio"
                    name="partnerType"
                    value="individual"
                    checked={form.partnerType === 'individual'}
                    onChange={() => update('partnerType', 'individual')}
                  />
                  個人
                </label>
                <label className="form-radio-option">
                  <input
                    type="radio"
                    name="partnerType"
                    value="business"
                    checked={form.partnerType === 'business'}
                    onChange={() => update('partnerType', 'business')}
                  />
                  法人・事業者
                </label>
              </div>
            </div>
          </div>

          {/* 氏名・会社名 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">お名前</div>
            <div className="form-group">
              <label className="form-label">氏名 <span className="required">*</span></label>
              <input
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                placeholder="山田 花子"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {form.partnerType === 'business' && (
              <>
                <div className="form-group">
                  <label className="form-label">会社名・屋号 <span className="required">*</span></label>
                  <input
                    className={`form-input ${errors.companyName ? 'form-input-error' : ''}`}
                    placeholder="株式会社〇〇"
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                  />
                  {errors.companyName && <div className="form-error">{errors.companyName}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">業種</label>
                  <input
                    className="form-input"
                    placeholder="例：ブライダル、ジュエリー、ホテル"
                    value={form.businessType}
                    onChange={(e) => update('businessType', e.target.value)}
                  />
                  <div className="form-hint">事業の業種を簡潔に記入してください</div>
                </div>
              </>
            )}
          </div>

          {/* 連絡先 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">連絡先</div>
            <div className="form-group">
              <label className="form-label">メールアドレス <span className="required">*</span></label>
              <input
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                type="email"
                placeholder="example@mail.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">電話番号 <span className="required">*</span></label>
              <input
                className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                placeholder="090-0000-0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Instagramアカウント</label>
              <input
                className="form-input"
                placeholder="@your_account"
                value={form.instagramAccount}
                onChange={(e) => update('instagramAccount', e.target.value)}
              />
              <div className="form-hint">任意。SNS紹介を行う場合にご記入ください</div>
            </div>
          </div>

          {/* 活動情報 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">活動情報</div>
            <div className="form-group">
              <label className="form-label">活動エリア <span className="required">*</span></label>
              <input
                className={`form-input ${errors.area ? 'form-input-error' : ''}`}
                placeholder="例：大阪市、京都市内、関西全域など"
                value={form.area}
                onChange={(e) => update('area', e.target.value)}
              />
              {errors.area && <div className="form-error">{errors.area}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                事業カテゴリ{form.partnerType === 'business' && <span className="required">*</span>}
              </label>
              <select
                className={`form-select ${errors.businessCategory ? 'form-input-error' : ''}`}
                value={form.businessCategory}
                onChange={(e) => update('businessCategory', e.target.value)}
              >
                <option value="">選択してください</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.businessCategory && <div className="form-error">{errors.businessCategory}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">主な紹介方法 <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>（複数選択可）</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {INTRODUCTION_CHANNELS.map((ch) => (
                  <label
                    key={ch.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: '0.35rem 0.75rem',
                      border: `1px solid ${form.introductionChannels.includes(ch.value) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-full)',
                      background: form.introductionChannels.includes(ch.value) ? 'var(--color-accent-bg)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={form.introductionChannels.includes(ch.value)}
                      onChange={() => toggleChannel(ch.value)}
                    />
                    {ch.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">紹介できそうな顧客層</label>
              <input
                className="form-input"
                placeholder="例：婚約指輪検討中の30代カップル、プロポーズ検討中の男性など"
                value={form.customerSegment}
                onChange={(e) => update('customerSegment', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">備考・メッセージ</label>
              <textarea
                className="form-textarea"
                placeholder="紹介への意気込みや、スタジオへのメッセージなどをご自由にどうぞ。"
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </div>
          </div>

          {/* パスワード設定 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">ログイン設定</div>
            <div className="form-group">
              <label className="form-label">パスワード <span className="required">*</span></label>
              <input
                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                type="password"
                placeholder="6文字以上"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">パスワード（確認） <span className="required">*</span></label>
              <input
                className={`form-input ${errors.passwordConfirm ? 'form-input-error' : ''}`}
                type="password"
                placeholder="もう一度入力してください"
                value={form.passwordConfirm}
                onChange={(e) => update('passwordConfirm', e.target.value)}
              />
              {errors.passwordConfirm && <div className="form-error">{errors.passwordConfirm}</div>}
              <div className="form-hint">承認後のログインで使用します</div>
            </div>
          </div>

          {/* 3つの同意 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">確認・同意事項</div>

            {/* 同意①: 規約 */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  style={{ marginTop: 2, flexShrink: 0 }}
                  checked={form.agreedTerms}
                  onChange={(e) => update('agreedTerms', e.target.checked)}
                />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                  <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>紹介パートナー規約</a>
                  および
                  <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>個人情報の取扱い</a>
                  に同意します <span className="required">*</span>
                </span>
              </label>
              {errors.agreedTerms && <div className="form-error" style={{ marginTop: '0.35rem' }}>{errors.agreedTerms}</div>}
            </div>

            {/* 同意②: 広告・紹介活動ポリシー */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  style={{ marginTop: 2, flexShrink: 0 }}
                  checked={form.agreedAdPolicy}
                  onChange={(e) => update('agreedAdPolicy', e.target.checked)}
                />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                  <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>広告・紹介活動に関するポリシー</a>
                  （無断での割引告知・誇大広告の禁止等）に同意します <span className="required">*</span>
                </span>
              </label>
              {errors.agreedAdPolicy && <div className="form-error" style={{ marginTop: '0.35rem' }}>{errors.agreedAdPolicy}</div>}
            </div>

            {/* 同意③: 反社会的勢力 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  style={{ marginTop: 2, flexShrink: 0 }}
                  checked={form.agreedAntiSocial}
                  onChange={(e) => update('agreedAntiSocial', e.target.checked)}
                />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                  自己または所属組織が反社会的勢力に該当せず、今後も該当しないことを誓約します <span className="required">*</span>
                </span>
              </label>
              {errors.agreedAntiSocial && <div className="form-error" style={{ marginTop: '0.35rem' }}>{errors.agreedAntiSocial}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-xl"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? '送信中...' : '登録申請する'}
          </button>

          <p
            style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-tertiary)',
            }}
          >
            すでにアカウントをお持ちの方は{' '}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/partner/login')}
              style={{ display: 'inline', padding: '0', color: 'var(--color-accent)' }}
            >
              ログイン
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
