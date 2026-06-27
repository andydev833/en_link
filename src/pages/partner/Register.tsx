import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';
import type { Partner } from '../../types';

export default function PartnerRegister() {
  const navigate = useNavigate();
  const { addPartner } = usePartnerStore();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    partnerType: 'individual' as 'individual' | 'business',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    area: '',
    businessCategory: '',
    customerSegment: '',
    notes: '',
    agreed: false,
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '氏名を入力してください';
    if (!form.email.trim()) e.email = 'メールアドレスを入力してください';
    if (!form.phone.trim()) e.phone = '電話番号を入力してください';
    if (!form.area.trim()) e.area = '活動エリアを入力してください';
    if (!form.password.trim()) e.password = 'パスワードを入力してください';
    if (form.password.length > 0 && form.password.length < 6) e.password = '6文字以上のパスワードを設定してください';
    if (form.partnerType === 'business') {
      if (!form.companyName.trim()) e.companyName = '会社名・屋号を入力してください';
      if (!form.businessCategory.trim()) e.businessCategory = '事業カテゴリを入力してください';
    }
    if (!form.agreed) e.agreed = '規約に同意してください';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const partner: Partner = {
      id: `p_${Date.now()}`,
      partnerType: form.partnerType,
      name: form.name,
      companyName: form.companyName || undefined,
      email: form.email,
      phone: form.phone,
      area: form.area,
      businessCategory: form.businessCategory || undefined,
      customerSegment: form.customerSegment || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      passwordHash: form.password,
      memo: form.notes || undefined,
    };

    addPartner(partner);
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

        <form onSubmit={handleSubmit} noValidate>
          {/* 基本情報 */}
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
                className="form-input"
                placeholder="山田 花子"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {form.partnerType === 'business' && (
              <div className="form-group">
                <label className="form-label">会社名・屋号 <span className="required">*</span></label>
                <input
                  className="form-input"
                  placeholder="株式会社〇〇"
                  value={form.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                />
                {errors.companyName && <div className="form-error">{errors.companyName}</div>}
              </div>
            )}
          </div>

          {/* 連絡先 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">連絡先</div>
            <div className="form-group">
              <label className="form-label">メールアドレス <span className="required">*</span></label>
              <input
                className="form-input"
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
                className="form-input"
                placeholder="090-0000-0000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </div>

          {/* 活動情報 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">活動情報</div>
            <div className="form-group">
              <label className="form-label">活動エリア <span className="required">*</span></label>
              <input
                className="form-input"
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
                className="form-select"
                value={form.businessCategory}
                onChange={(e) => update('businessCategory', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="個人（既存顧客）">個人（既存顧客）</option>
                <option value="ジュエリーショップ">ジュエリーショップ</option>
                <option value="結婚相談所">結婚相談所</option>
                <option value="花屋">花屋</option>
                <option value="ホテル">ホテル</option>
                <option value="レストラン">レストラン</option>
                <option value="美容室">美容室</option>
                <option value="ブライダル関連">ブライダル関連</option>
                <option value="保険営業">保険営業</option>
                <option value="士業">士業</option>
                <option value="不動産">不動産</option>
                <option value="その他">その他</option>
              </select>
              {errors.businessCategory && <div className="form-error">{errors.businessCategory}</div>}
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
                className="form-input"
                type="password"
                placeholder="6文字以上"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
              <div className="form-hint">承認後のログインで使用します</div>
            </div>
          </div>

          {/* 規約同意 */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                className="form-checkbox"
                id="agreed"
                checked={form.agreed}
                onChange={(e) => update('agreed', e.target.checked)}
              />
              <label
                htmlFor="agreed"
                style={{ fontSize: '0.875rem', lineHeight: 1.7, cursor: 'pointer' }}
              >
                <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                  紹介パートナー規約
                </a>
                および
                <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
                  個人情報の取扱い
                </a>
                に同意します <span style={{ color: 'var(--color-rejected)', fontSize: '0.75rem' }}>*</span>
              </label>
            </div>
            {errors.agreed && <div className="form-error" style={{ marginTop: '0.5rem' }}>{errors.agreed}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-xl"
            style={{ width: '100%' }}
          >
            登録申請する
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
