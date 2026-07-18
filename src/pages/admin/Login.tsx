import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin, isAdminLoggedIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigate to dashboard when login state becomes true
  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdminLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Submitting admin login', { email, password });
    const ok = await adminLogin(email, password);
    setLoading(false);
    console.log('adminLogin returned', ok);
    // Log current auth state
    const authState = useAuthStore.getState();
    console.log('Auth state after login', authState);
    if (ok) {
      // ログイン成功: ダッシュボードへ遷移
      navigate('/admin/dashboard', { replace: true });
    } else {
      // ログイン失敗: エラーメッセージを表示
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
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
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
