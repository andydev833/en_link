import { useNavigate } from 'react-router-dom';
import { useLpStore } from '../../store/lpStore';
import { CheckCircle } from 'lucide-react';

export default function ThanksPage() {
  const navigate = useNavigate();
  const { getContent } = useLpStore();

  const thanksTitle = getContent('thanks_title') || 'ありがとうございます';
  const thanksBody = getContent('thanks_body') || 'ご相談のお申込みを受け付けました。\nスタジオうえじより、2〜3営業日以内にメールまたはお電話でご連絡します。';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: 'var(--font-serif)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#0E0C0A', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#C9A96E', textTransform: 'uppercase' }}>
          Studio Ueji
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <CheckCircle size={56} color="#C9A96E" style={{ marginBottom: '1.5rem' }} />
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.25rem' }} />
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, marginBottom: '1.25rem' }}>
            {thanksTitle}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.9, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>
            {thanksBody}
          </p>

          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4, padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ fontWeight: 500, marginBottom: '1rem', fontSize: '0.875rem' }}>今後の流れ</div>
            {[
              '① スタジオからご連絡（2〜3営業日以内）',
              '② ご相談日時の確定',
              '③ スタジオうえじにてご相談',
              '④ 当日の演出・撮影プランのご提案',
            ].map((step) => (
              <div key={step} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
                {step}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/propose')}
            style={{
              background: 'transparent',
              border: '1px solid #C9A96E',
              color: '#C9A96E',
              padding: '0.75rem 2rem',
              fontSize: '0.875rem',
              borderRadius: 2,
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.05em',
            }}
          >
            LPに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
