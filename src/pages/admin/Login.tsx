import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../store/settingsStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useSettingsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = adminLogin(email, password);
    if (ok) {
      navigate('/admin/dashboard');
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
              管
            </span>
          </div>
          <div className="login-logo-title">スタジオうえじ</div>
          <div className="login-logo-sub">管理者ログイン</div>
          <div className="login-divider" />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@ueji.jp"
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
        </form>

        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.875rem',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <div style={{ marginBottom: '0.25rem', fontWeight: 500 }}>デモ用アカウント</div>
          <div>admin@ueji.jp / admin1234</div>
        </div>
      </div>
    </div>
  );
}
