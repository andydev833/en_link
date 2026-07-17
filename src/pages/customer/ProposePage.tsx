import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLpStore, type LpEventPayload } from '../../store/lpStore';
import { ChevronDown, CheckCircle, Star, MessageCircle } from 'lucide-react';

// セッション間でrefをlocalStorageに保持
function storeRef(ref: string, utmSource: string, utmMedium: string, utmCampaign: string) {
  if (ref) localStorage.setItem('enlink_ref', ref);
  if (utmSource) localStorage.setItem('enlink_utm_source', utmSource);
  if (utmMedium) localStorage.setItem('enlink_utm_medium', utmMedium);
  if (utmCampaign) localStorage.setItem('enlink_utm_campaign', utmCampaign);
}

// IntersectionObserverでセクション閲覧を計測
function useSectionTracking(trackFn: (payload: LpEventPayload) => void) {
  const observed = useRef(new Set<string>());

  const observe = useCallback(
    (el: HTMLElement | null, sectionKey: string) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !observed.current.has(sectionKey)) {
            observed.current.add(sectionKey);
            trackFn({ eventType: 'section_view', sectionKey });
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
    },
    [trackFn]
  );
  return observe;
}

export default function ProposePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getContent, fetchContents, trackEvent } = useLpStore();
  const observe = useSectionTracking(trackEvent);

  const ref = searchParams.get('ref') || '';
  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';

  useEffect(() => {
    storeRef(ref, utmSource, utmMedium, utmCampaign);
    fetchContents('propose');
    trackEvent({ eventType: 'page_view', referralCode: ref, utmSource, utmMedium, utmCampaign, referrer: document.referrer });
    // ユニーク訪問チェック
    if (!sessionStorage.getItem('enlink_visited')) {
      sessionStorage.setItem('enlink_visited', '1');
      trackEvent({ eventType: 'unique_visit', referralCode: ref, utmSource, utmMedium, utmCampaign });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCta = () => {
    trackEvent({ eventType: 'cta_click', referralCode: ref, utmSource, utmMedium, utmCampaign });
    const params = new URLSearchParams();
    if (ref) params.set('ref', ref);
    if (utmSource) params.set('utm_source', utmSource);
    if (utmMedium) params.set('utm_medium', utmMedium);
    navigate(`/contact?${params.toString()}`);
  };

  const ctaText = getContent('cta_text') || 'まずは無料で相談する';
  const heroTitle = getContent('hero_title') || '一生に一度の瞬間を、\n特別な場所で。';
  const heroSubtitle = getContent('hero_subtitle') || '';
  const heroImage = getContent('hero_image') || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600';
  const chapelTitle = getContent('chapel_title') || '式場チャペルで、\n特別なプロポーズを。';
  const chapelBody = getContent('chapel_body') || '';
  const surpriseTitle = getContent('surprise_title') || 'サプライズに気づかれにくい\n自然な演出を設計します。';
  const surpriseBody = getContent('surprise_body') || '';
  const priceBase = getContent('price_base') || '80,000';
  const priceNote = getContent('price_note') || '';

  return (
    <div style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text-primary)', background: '#0E0C0A' }}>

      {/* ===== HERO ===== */}
      <section
        ref={(el) => observe(el, 'hero')}
        style={{
          position: 'relative',
          height: '100svh',
          minHeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src={heroImage}
          alt="プロポーズ撮影"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,12,10,0.3) 0%, rgba(14,12,10,0.7) 100%)' }} />

        <div style={{ position: 'relative', textAlign: 'center', padding: '0 1.5rem', maxWidth: 680 }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.25em', color: '#C9A96E', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
            Studio Ueji × Propose Planning
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 300,
              color: '#FAF8F5',
              lineHeight: 1.4,
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
            }}
          >
            {heroTitle}
          </h1>
          <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: 'rgba(250,248,245,0.75)', lineHeight: 1.9, marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>
            {heroSubtitle}
          </p>
          <button
            onClick={handleCta}
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #A67C52)',
              color: '#FAF8F5',
              border: 'none',
              padding: '1rem 2.5rem',
              fontSize: '0.9375rem',
              letterSpacing: '0.1em',
              borderRadius: 2,
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {ctaText}
          </button>
        </div>

        {/* スクロールインジケーター */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(250,248,245,0.4)', animation: 'bounce 2s infinite' }}>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* ===== CHAPEL ===== */}
      <section
        ref={(el) => observe(el, 'chapel')}
        style={{ background: '#FAF8F5', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div style={{ width: 40, height: 1, background: '#C9A96E', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, lineHeight: 1.5, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {chapelTitle}
            </h2>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.9, color: 'var(--color-text-secondary)', marginBottom: '2rem', whiteSpace: 'pre-line' }}>
              {chapelBody}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['奈良・大阪の指定式場チャペルをご利用いただけます', '雨天でも屋内チャペルで実施可能', '日程調整はご相談後に決定', '式場チャペルを貸し切って撮影'].map((item) => (
                <li key={item} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  <CheckCircle size={16} color="#C9A96E" style={{ flexShrink: 0, marginTop: 2 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800"
              alt="チャペル"
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 2 }}
            />
          </div>
        </div>
      </section>

      {/* ===== SURPRISE ===== */}
      <section
        ref={(el) => observe(el, 'surprise')}
        style={{ background: '#1A1612', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <img
              src="https://images.unsplash.com/photo-1503455637927-730bce8583c0?w=800"
              alt="サプライズ演出"
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 2 }}
            />
          </div>
          <div>
            <div style={{ width: 40, height: 1, background: '#C9A96E', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#FAF8F5', lineHeight: 1.5, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
              {surpriseTitle}
            </h2>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.9, color: 'rgba(250,248,245,0.65)', marginBottom: '2rem', whiteSpace: 'pre-line' }}>
              {surpriseBody}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                'モデル撮影という体で自然に呼び出せます',
                '花束をご用意できます',
                '指輪を渡すタイミングを一緒に設計します',
                '入場からプロポーズまでの流れを事前に整理します',
                '当日の進行をご一緒に確認します',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: 'rgba(250,248,245,0.65)' }}>
                  <CheckCircle size={16} color="#C9A96E" style={{ flexShrink: 0, marginTop: 2 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section
        ref={(el) => observe(el, 'features')}
        style={{ background: '#FAF8F5', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, marginBottom: '3rem' }}>
            撮影・演出でできること
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '💍', title: '指輪を渡す', desc: '最高の瞬間の タイミングを設計' },
              { icon: '💐', title: '花束の準備', desc: 'サプライズ用の 花束をご用意' },
              { icon: '⛪', title: 'チャペル使用', desc: '奈良・大阪の 指定式場で実施' },
              { icon: '📸', title: '感動の記録', desc: '二人の瞬間を 高品質に撮影' },
              { icon: '🎬', title: '当日の流れ', desc: 'シナリオを 事前に整理' },
              { icon: '☂️', title: '雨天対応', desc: '屋内チャペルで 天候を選ばない' },
            ].map((f) => (
              <div key={f.title} style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section
        ref={(el) => observe(el, 'pricing')}
        style={{ background: '#1A1612', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#FAF8F5', marginBottom: '2.5rem' }}>
            料金
          </h2>
          <div style={{ border: '1px solid rgba(201,169,110,0.3)', padding: '3rem 2rem', borderRadius: 4 }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#C9A96E', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Shooting Fee
            </div>
            <div style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 300, color: '#FAF8F5', marginBottom: '0.5rem' }}>
              ¥{Number(priceBase.replace(/,/g, '')).toLocaleString()}
              <span style={{ fontSize: '1.25rem', color: 'rgba(250,248,245,0.5)' }}>〜</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(250,248,245,0.5)', marginBottom: '2rem' }}>撮影料金のみの目安</div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(250,248,245,0.5)', lineHeight: 1.8, textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 2, whiteSpace: 'pre-line' }}>
              {priceNote}
            </p>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <button
              onClick={handleCta}
              style={{
                background: 'linear-gradient(135deg, #C9A96E, #A67C52)',
                color: '#FAF8F5',
                border: 'none',
                padding: '1rem 2.5rem',
                fontSize: '0.9375rem',
                letterSpacing: '0.1em',
                borderRadius: 2,
                cursor: 'pointer',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {ctaText}
            </button>
          </div>
        </div>
      </section>

      {/* ===== FLOW ===== */}
      <section
        ref={(el) => observe(el, 'flow')}
        style={{ background: '#FAF8F5', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, marginBottom: '3rem' }}>相談の流れ</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
            {[
              { step: '01', title: '無料相談のお申込み', desc: 'このページ下部のフォームから、希望日時と相談内容をご記入ください。' },
              { step: '02', title: 'スタジオからご連絡', desc: '2〜3営業日以内にメールまたはお電話でご連絡します。' },
              { step: '03', title: '対面相談（スタジオうえじ）', desc: 'スタジオにお越しいただき、演出内容・式場・撮影について詳しくご相談します。' },
              { step: '04', title: 'プロポーズ当日', desc: 'スタッフが当日をサポート。サプライズの瞬間を一緒に作ります。' },
            ].map((item) => (
              <div key={item.step} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{
                  fontSize: '2rem', fontWeight: 300, color: '#C9A96E', lineHeight: 1,
                  minWidth: 48, flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '0.35rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VOICES ===== */}
      <section
        ref={(el) => observe(el, 'voices')}
        style={{ background: '#1A1612', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, color: '#FAF8F5', textAlign: 'center', marginBottom: '3rem' }}>
            お客様の声
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { text: '式場チャペルで想像以上の演出ができました。花束を渡すタイミングまで一緒に考えてくれて、当日も完璧でした。', author: '30代 男性', area: '奈良県' },
              { text: '「モデル撮影」というかたちで自然に彼女を連れてこられ、バレずにサプライズができました。', author: '20代 男性', area: '大阪府' },
              { text: '流れを事前にしっかり相談できたので、当日は安心して臨めました。感謝しています。', author: '30代 男性', area: '奈良県' },
            ].map((v, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: 4, border: '1px solid rgba(201,169,110,0.15)' }}>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                  {Array(5).fill(0).map((_, j) => <Star key={j} size={14} fill="#C9A96E" color="#C9A96E" />)}
                </div>
                <MessageCircle size={20} color="#C9A96E" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                <p style={{ fontSize: '0.875rem', color: 'rgba(250,248,245,0.75)', lineHeight: 1.9, marginBottom: '1rem' }}>{v.text}</p>
                <div style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.4)' }}>{v.author}（{v.area}）</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section
        ref={(el) => observe(el, 'faq')}
        style={{ background: '#FAF8F5', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem' }}
      >
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 300, textAlign: 'center', marginBottom: '3rem' }}>
            よくある質問
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { q: '相談は無料ですか？', a: 'はい、初回相談は完全無料です。スタジオうえじ店舗にお越しいただき、プロポーズの流れや式場チャペルの利用可否について詳しくご説明します。' },
              { q: '奈良・大阪以外でも対応できますか？', a: '現在は奈良・大阪を中心に対応しております。詳しくはご相談ください。' },
              { q: '彼女にバレてしまわないか不安です。', a: '「モデル撮影のお手伝い」という形で自然にお呼び出しいただく方法をご提案しています。当日の流れを事前に一緒に整理しますので、ご安心ください。' },
              { q: '雨天の場合はどうなりますか？', a: '指定式場の屋内チャペルを使用するため、雨天でも実施可能です。' },
              { q: '花束の手配もしてもらえますか？', a: 'はい、ご要望に応じて花束のご用意もできます。詳細はご相談の際にお話しください。' },
              { q: '相談から当日まで、どのくらいの期間が必要ですか？', a: '式場チャペルの日程調整が必要なため、余裕をもって1〜2ヶ月前のご相談をおすすめしています。' },
            ].map((faq, i) => (
              <details
                key={i}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  padding: '1.25rem 0',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.9375rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Q. {faq.q}</span>
                  <span style={{ fontSize: '1.25rem', color: '#C9A96E', lineHeight: 1 }}>+</span>
                </summary>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.9, marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid #C9A96E' }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 最終CTA ===== */}
      <section
        ref={(el) => observe(el, 'cta_final')}
        style={{ background: 'linear-gradient(135deg, #1A1612, #0E0C0A)', padding: 'clamp(4rem, 8vw, 7rem) 1.5rem', textAlign: 'center' }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 40, height: 1, background: '#C9A96E', margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 300, color: '#FAF8F5', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            まずはご相談ください。
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(250,248,245,0.6)', lineHeight: 1.9, marginBottom: '2.5rem' }}>
            無料相談は、具体的な演出内容や式場チャペルの利用可否を確認するため、<br />
            原則スタジオうえじ店舗で実施しています。
          </p>
          <button
            onClick={handleCta}
            style={{
              background: 'linear-gradient(135deg, #C9A96E, #A67C52)',
              color: '#FAF8F5',
              border: 'none',
              padding: '1.25rem 3rem',
              fontSize: '1rem',
              letterSpacing: '0.1em',
              borderRadius: 2,
              cursor: 'pointer',
              fontFamily: 'var(--font-serif)',
              display: 'inline-block',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {ctaText}
          </button>
          <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(250,248,245,0.35)' }}>
            ご相談は無料・お見積りも無料です
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer style={{ background: '#0E0C0A', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(250,248,245,0.3)', letterSpacing: '0.1em' }}>
          © Studio Ueji. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
