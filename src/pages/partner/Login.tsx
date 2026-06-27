import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../store/partnerStore';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { partnerLogin } = usePartnerStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = partnerLogin(email, password);
    if (result) {
      navigate('/partner/dashboard');
    } else {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div
            style={{
              width: 48,
              height: 48,
              background: 'var(--color-text-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
              E
            </span>
          </div>
          <div className="login-logo-title">スタジオうえじ</div>
          <div className="login-logo-sub">紹介パートナー ログイン</div>
          <div className="login-divider" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              className="form-input"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.625rem 0.875rem',
                background: 'var(--color-rejected-bg)',
                border: '1px solid var(--color-rejected-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--color-rejected)',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            ログイン
          </button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: 0, fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}
            >
              パスワードをお忘れの方
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/partner/register')}
              style={{ padding: 0, fontSize: '0.8rem', color: 'var(--color-accent)' }}
            >
              新規登録申請
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.875rem',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>デモ用アカウント</div>
          <div>承認済み: hanako@example.com / password123</div>
          <div>審査中: ichiro@example.com / password123</div>
        </div>
      </div>
    </div>
  );
}
