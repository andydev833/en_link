import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Camera, Heart, Star, Shield, Clock, MessageCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';

export default function ProposePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref') || '';
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // refコードをlocalStorageに保存
  useEffect(() => {
    if (refCode) {
      localStorage.setItem('enlink_ref', refCode);
    }
  }, [refCode]);

  const handleCTA = () => {
    const ref = refCode || localStorage.getItem('enlink_ref') || '';
    navigate(`/contact${ref ? `?ref=${ref}` : ''}${ref ? '&' : '?'}menu=propose`);
  };

  const faqs = [
    {
      q: '相手にバレてしまいませんか？',
      a: 'スタジオへのお問い合わせ、事前相談はすべてあなたお一人の段階で進めることができます。相手の方に知られることなく、ご準備いただけます。',
    },
    {
      q: '雨の場合はどうなりますか？',
      a: '天候によってはスケジュールを変更することが可能です。事前相談の際に雨天プランもご提案します。屋内での演出も対応しております。',
    },
    {
      q: '撮影場所はどこでも相談できますか？',
      a: '関西エリアを中心に、さまざまなロケーションでの撮影が可能です。ご希望の場所がある場合はお気軽にご相談ください。',
    },
    {
      q: '撮影だけでなく演出も相談できますか？',
      a: 'はい。サプライズの段取りから当日の流れまで、トータルでご提案しています。初めての方でも安心してご相談ください。',
    },
    {
      q: 'どれくらい前に相談すればよいですか？',
      a: 'プロポーズ予定日の2〜3ヶ月前にご相談いただくと、余裕を持ってプランニングできます。もちろん、それ以前でも以後でも対応可能です。',
    },
  ];

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      {/* ヒーロー */}
      <section
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1C1A18 0%, #2d2a25 60%, #1C1A18 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装飾的な背景要素 */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            padding: '4rem 2rem',
            maxWidth: '720px',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '1.5rem',
              padding: '0.375rem 1rem',
              border: '1px solid rgba(201,169,110,0.3)',
              borderRadius: '9999px',
            }}
          >
            Propose Photography
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 300,
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
            }}
          >
            一生の瞬間を、<br />
            <span style={{ color: 'var(--color-accent)' }}>プロの手</span>で残す。
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.9,
              marginBottom: '2.5rem',
            }}
          >
            プロポーズの瞬間を美しく残す撮影サービス。<br />
            場所選びから演出プランまで、まずは気軽にご相談ください。
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent btn-xl"
              onClick={handleCTA}
            >
              <Heart size={18} />
              まずは無料相談する
            </button>
            <a
              href="#about"
              className="btn btn-xl"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              詳細を見る
            </a>
          </div>

          {refCode && (
            <div
              style={{
                marginTop: '2rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              紹介コード: {refCode}
            </div>
          )}
        </div>
      </section>

      {/* サービス価値 */}
      <section id="about" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Why Us</div>
          <h2 className="lp-section-title">
            プロポーズ撮影に、<br />専門スタジオを選ぶ理由
          </h2>
          <p className="lp-section-desc">
            人生でもっとも大切な瞬間のひとつを、プロの技術と細やかな配慮でサポートします。
          </p>

          <div className="lp-card-grid">
            {[
              {
                icon: <Camera size={20} />,
                title: '一生残せる高品質な写真・動画',
                desc: 'プロのカメラマンによる撮影で、その瞬間の空気感や感情まで切り取ります。',
              },
              {
                icon: <MessageCircle size={20} />,
                title: '演出から当日の流れまで相談できる',
                desc: 'サプライズの段取り、場所選び、当日のタイムラインまで、一緒に考えます。',
              },
              {
                icon: <Shield size={20} />,
                title: 'バレない・失敗しない安心感',
                desc: '多くのプロポーズをサポートした経験から、よくある不安への対策もご提案します。',
              },
            ].map((item, i) => (
              <div key={i} className="lp-card">
                <div className="lp-card-icon">{item.icon}</div>
                <div className="lp-card-title">{item.title}</div>
                <div className="lp-card-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* こんな方に */}
      <section className="lp-section" style={{ background: 'var(--color-bg-alt)' }}>
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">For You</div>
          <h2 className="lp-section-title">こんな方におすすめです</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            {[
              'プロポーズの瞬間を写真・動画で残したい',
              '何から準備すればいいか分からない',
              '関西エリアでプロポーズを考えている',
              '写真・演出・当日の流れを相談したい',
              'サプライズが相手にバレないか心配',
              '失敗しない完璧なプロポーズにしたい',
            ].map((text, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.6,
                }}
              >
                <Star size={14} style={{ color: 'var(--color-accent)', marginTop: '3px', flexShrink: 0 }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 流れ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">Flow</div>
          <h2 className="lp-section-title">相談から撮影までの流れ</h2>
          <p className="lp-section-desc">
            まずはお気軽にご相談ください。無料でご要望をお聞きします。
          </p>

          <div className="lp-steps">
            {[
              { title: '相談申込', desc: 'フォームから希望の日時・内容をお知らせください。担当者よりご連絡いたします。' },
              { title: '事前相談（無料）', desc: 'ご要望をくわしくお聞きし、場所・演出・撮影プランをご提案します。' },
              { title: 'プラン決定', desc: 'ご希望に合わせた撮影プランをご提案。内容・料金にご納得いただいてから契約。' },
              { title: '契約・決済', desc: 'プランが決まりましたら、お申し込み手続きと料金のお支払いをお願いします。' },
              { title: '撮影当日', desc: 'プロのカメラマンがプロポーズの瞬間を美しく撮影します。' },
              { title: '納品', desc: '撮影後、編集・加工した写真・動画をお渡しします。一生の思い出に。' },
            ].map((step, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{i + 1}</div>
                <div className="lp-step-content">
                  <div className="lp-step-title">{step.title}</div>
                  <div className="lp-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金 */}
      <section className="lp-section" style={{ background: 'var(--color-text-primary)' }}>
        <div className="lp-section-inner" style={{ textAlign: 'center' }}>
          <div className="lp-section-eyebrow" style={{ color: 'var(--color-accent)' }}>Price</div>
          <h2
            className="lp-section-title"
            style={{ color: 'white' }}
          >
            料金目安
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '3rem', lineHeight: 1.8 }}>
            撮影内容・ロケーション・時間によって異なります。<br />
            まずはご要望をお聞きした上で、個別にご提案いたします。
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              maxWidth: '760px',
              margin: '0 auto 3rem',
            }}
          >
            {[
              { label: 'ベーシックプラン', price: '¥150,000〜', desc: 'スタジオまたは近郊ロケーション・写真のみ' },
              { label: 'スタンダードプラン', price: '¥250,000〜', desc: '演出プランニング込み・写真＋動画' },
              { label: 'プレミアムプラン', price: '¥400,000〜', desc: 'フルサポート・完全サプライズ対応・遠方ロケ' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '2rem 1.5rem',
                  border: '1px solid rgba(201,169,110,0.3)',
                  borderRadius: 'var(--radius-lg)',
                  background: i === 1 ? 'rgba(201,169,110,0.08)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    color: i === 1 ? 'var(--color-accent)' : 'white',
                    marginBottom: '0.75rem',
                  }}
                >
                  {item.price}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '1rem 1.5rem',
              background: 'rgba(201,169,110,0.08)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.6)',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            ※ 上記は目安です。内容に応じて個別にお見積りいたします。<br />
            相談は完全無料です。まずはお気軽にお声がけください。
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-eyebrow">FAQ</div>
          <h2 className="lp-section-title">よくあるご不安・ご質問</h2>

          <div className="lp-faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="lp-faq-item">
                <div
                  className="lp-faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {openFaq === i && (
                  <div className="lp-faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 紹介経由の説明 */}
      {refCode && (
        <section className="lp-section" style={{ background: 'var(--color-bg-alt)', padding: '3rem 1.5rem' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                padding: '1.25rem 1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}
            >
              <Clock size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              このページは紹介リンク経由でアクセスされています。
              紹介経由でお申し込みいただいた場合でも、料金が上乗せされることは一切ありません。
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="lp-cta-section">
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="lp-section-eyebrow" style={{ color: 'var(--color-accent)' }}>Contact</div>
          <h2 className="lp-cta-title">
            まずは無料相談から<br />はじめましょう
          </h2>
          <p className="lp-cta-desc">
            難しいことは何もありません。<br />
            希望の日時と少しのご要望だけでOKです。
          </p>
          <button
            className="btn btn-accent btn-xl"
            onClick={handleCTA}
            style={{ margin: '0 auto', display: 'flex' }}
          >
            <Heart size={18} />
            プロポーズ撮影について相談する
          </button>
        </div>
      </section>

      {/* フッター */}
      <footer
        style={{
          background: '#111',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        © 2026 スタジオうえじ. All rights reserved.
      </footer>
    </div>
  );
}
