import { useNavigate } from 'react-router-dom';
import { CheckCircle, Heart } from 'lucide-react';

export default function ThanksPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '480px',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            background: 'var(--color-approved-bg)',
            border: '2px solid var(--color-approved-border)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            color: 'var(--color-approved)',
          }}
        >
          <CheckCircle size={32} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            fontWeight: 400,
            marginBottom: '1rem',
            color: 'var(--color-text-primary)',
          }}
        >
          申込を受け付けました
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.9,
            marginBottom: '2.5rem',
          }}
        >
          相談申込を受け付けました。<br />
          内容を確認のうえ、担当者より<br />
          2営業日以内にご連絡いたします。
        </p>

        <div
          style={{
            padding: '1.5rem',
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-light)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
          }}
        >
          <Heart size={20} style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            プロポーズを成功させるために、<br />
            精一杯サポートいたします。<br />
            何かご不明な点があれば、<br />
            お気軽にお問い合わせください。
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/propose')}
        >
          トップに戻る
        </button>
      </div>
    </div>
  );
}
