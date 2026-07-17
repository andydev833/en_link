import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { AdminLayout } from '../../components/layout';
import { ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { Mail, RotateCcw } from 'lucide-react';

// 通知テンプレートの型
type TemplateKey =
  | 'application_received'   // 申請受付（紹介者宛）
  | 'application_notify'     // 新規申請通知（管理者宛）
  | 'approved'               // 承認通知（紹介者宛）
  | 'rejected'               // 否認通知（紹介者宛）
  | 'inquiry_received'       // 相談申込受付（顧客宛）
  | 'inquiry_notify'         // 相談申込通知（管理者宛）
  | 'reward_confirmed';      // 報酬確定（紹介者宛）

interface NotificationTemplate {
  subject: string;
  body: string;
}

type Templates = Record<TemplateKey, NotificationTemplate>;

const DEFAULT_TEMPLATES: Templates = {
  application_received: {
    subject: '【スタジオうえじ】紹介パートナー登録申請を受け付けました',
    body: `{name} 様

この度は、スタジオうえじ 紹介パートナーにご申請いただきありがとうございます。

現在、スタッフが申請内容を確認しております。
審査完了後、改めてご連絡いたします（通常3〜5営業日）。

今後ともよろしくお願いいたします。

─────────────────
スタジオうえじ En Link 事務局
{studio_email}
─────────────────`,
  },
  application_notify: {
    subject: '【En Link】新規パートナー申請がありました',
    body: `新規パートナー申請が届いています。

■ 申請者情報
名前：{name}
メール：{email}
電話：{phone}
エリア：{area}
区分：{partner_type}

■ 申請日時
{created_at}

管理画面から内容をご確認ください。
{admin_url}`,
  },
  approved: {
    subject: '【スタジオうえじ】紹介パートナー登録が承認されました',
    body: `{name} 様

この度はスタジオうえじ 紹介パートナーにご登録いただき、誠にありがとうございます。
審査が完了し、パートナーとして承認されましたのでご連絡いたします。

■ 紹介コード
{referral_code}

■ 紹介リンク
{referral_url}

上記リンクを通じて相談申込があった場合、報酬の対象となります。
マイページからリンクのコピーやQRコードの取得ができます。

{partner_url}

今後ともよろしくお願いいたします。

─────────────────
スタジオうえじ En Link 事務局
─────────────────`,
  },
  rejected: {
    subject: '【スタジオうえじ】紹介パートナー申請の審査結果について',
    body: `{name} 様

この度はスタジオうえじ 紹介パートナーへのご申請をいただき、誠にありがとうございます。
誠に残念ながら、今回はご希望に沿うことができない結果となりました。

ご不明な点がございましたら、お気軽にお問い合わせください。

─────────────────
スタジオうえじ En Link 事務局
{studio_email}
─────────────────`,
  },
  inquiry_received: {
    subject: '【スタジオうえじ】無料相談のお申込みを受け付けました',
    body: `{customer_name} 様

この度はスタジオうえじへのご相談をお申込みいただき、ありがとうございます。

■ お申込み内容
相談希望日（第1希望）：{preferred_date1}
相談方法：{consultation_method}

担当スタッフより、2〜3営業日以内にご連絡いたします。

どうぞよろしくお願いいたします。

─────────────────
スタジオうえじ
{studio_email}
─────────────────`,
  },
  inquiry_notify: {
    subject: '【En Link】新規相談申込がありました',
    body: `新規の相談申込が届いています。

■ 顧客情報
氏名：{customer_name}
メール：{customer_email}
電話：{customer_phone}

■ 申込内容
第1希望日：{preferred_date1}
第2希望日：{preferred_date2}
相談方法：{consultation_method}
プロポーズ予定：{proposal_timing}

■ 流入情報
紹介コード：{referral_code}
流入元：{utm_source}

■ 申込日時
{created_at}

管理画面から詳細をご確認ください。
{admin_url}`,
  },
  reward_confirmed: {
    subject: '【スタジオうえじ】報酬が確定しました',
    body: `{name} 様

紹介いただいた案件の報酬が確定いたしました。

■ 確定報酬
対象：{customer_name} 様
報酬額：¥{reward_amount}

■ お振込みについて
ご登録の口座へ、{payment_month}中にお振込みいたします。
振込先が未登録の場合は、マイページから登録してください。

{partner_url}

引き続きよろしくお願いいたします。

─────────────────
スタジオうえじ En Link 事務局
─────────────────`,
  },
};

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  application_received: '申請受付（紹介者宛）',
  application_notify: '新規申請通知（管理者宛）',
  approved: '承認通知（紹介者宛）',
  rejected: '否認通知（紹介者宛）',
  inquiry_received: '相談申込受付（顧客宛）',
  inquiry_notify: '相談申込通知（管理者宛）',
  reward_confirmed: '報酬確定通知（紹介者宛）',
};

export default function AdminSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({ ...settings });
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>('application_received');
  const [activeTab, setActiveTab] = useState<'general' | 'templates'>('general');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    addToast('設定を保存しました', 'success');
  };

  const update = (key: string, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updateTemplate = (key: TemplateKey, field: 'subject' | 'body', value: string) => {
    setTemplates((t) => ({ ...t, [key]: { ...t[key], [field]: value } }));
  };

  const resetTemplate = (key: TemplateKey) => {
    setTemplates((t) => ({ ...t, [key]: DEFAULT_TEMPLATES[key] }));
    addToast('デフォルトに戻しました', 'info');
  };

  const saveTemplates = () => {
    // GAS接続時はGASに保存、現在はローカルのみ
    addToast('テンプレートを保存しました', 'success');
  };

  const VARIABLE_HINTS: Partial<Record<TemplateKey, string[]>> = {
    application_received: ['{name}', '{studio_email}'],
    application_notify: ['{name}', '{email}', '{phone}', '{area}', '{partner_type}', '{created_at}', '{admin_url}'],
    approved: ['{name}', '{referral_code}', '{referral_url}', '{partner_url}'],
    rejected: ['{name}', '{studio_email}'],
    inquiry_received: ['{customer_name}', '{preferred_date1}', '{consultation_method}', '{studio_email}'],
    inquiry_notify: ['{customer_name}', '{customer_email}', '{customer_phone}', '{preferred_date1}', '{preferred_date2}', '{consultation_method}', '{proposal_timing}', '{referral_code}', '{utm_source}', '{created_at}', '{admin_url}'],
    reward_confirmed: ['{name}', '{customer_name}', '{reward_amount}', '{payment_month}', '{partner_url}'],
  };

  return (
    <AdminLayout title="基本設定">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">基本設定</h1>
        <p className="page-subtitle">システム全体の設定を管理します</p>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {[
          { key: 'general', label: '一般設定' },
          { key: 'templates', label: 'メールテンプレート' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '0.625rem 1rem',
              fontSize: '0.875rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-accent)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
              fontWeight: activeTab === tab.key ? 500 : 400,
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.key === 'templates' && <Mail size={14} style={{ marginRight: '0.375rem', display: 'inline' }} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 一般設定タブ */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} style={{ maxWidth: 720 }}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">システム設定</div>
            <div className="form-group">
              <label className="form-label">サイト名</label>
              <input
                className="form-input"
                value={form.siteName}
                onChange={(e) => update('siteName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">通知メールアドレス</label>
              <input
                className="form-input"
                type="email"
                value={form.notificationEmail}
                onChange={(e) => update('notificationEmail', e.target.value)}
              />
              <div className="form-hint">新規申請・相談申込時の通知先</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">紹介制度設定</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">紹介有効期限（日数）</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={form.referralExpiryDays}
                  onChange={(e) => update('referralExpiryDays', parseInt(e.target.value))}
                />
                <div className="form-hint">紹介リンクのクリックから申込までの有効日数</div>
              </div>
              <div className="form-group">
                <label className="form-label">デフォルト報酬額（円）</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={form.defaultRewardAmount}
                  onChange={(e) => update('defaultRewardAmount', parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">紹介制度説明文</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.referralProgramDescription}
                onChange={(e) => update('referralProgramDescription', e.target.value)}
              />
              <div className="form-hint">紹介者登録画面などに表示される説明文</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-section-title">SNS表示設定</div>
            <div className="form-group">
              <label className="form-label">SNS紹介時の広告表記文言</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.snsDisclosureText}
                onChange={(e) => update('snsDisclosureText', e.target.value)}
              />
              <div className="form-hint">SNS用テンプレートに自動付記される広告表記文</div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            設定を保存する
          </button>
        </form>
      )}

      {/* メールテンプレートタブ */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', maxWidth: 980 }}>
          {/* テンプレート選択 */}
          <div className="card" style={{ padding: '0.5rem', height: 'fit-content' }}>
            {(Object.keys(TEMPLATE_LABELS) as TemplateKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTemplate(key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.6rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  background: activeTemplate === key ? 'var(--color-accent-bg)' : 'transparent',
                  color: activeTemplate === key ? 'var(--color-accent-dark)' : 'var(--color-text-secondary)',
                  fontWeight: activeTemplate === key ? 500 : 400,
                  transition: 'all 0.15s',
                  lineHeight: 1.4,
                }}
              >
                {TEMPLATE_LABELS[key]}
              </button>
            ))}
          </div>

          {/* テンプレート編集 */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} />
                {TEMPLATE_LABELS[activeTemplate]}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => resetTemplate(activeTemplate)}
                title="デフォルトに戻す"
              >
                <RotateCcw size={14} />
                リセット
              </button>
            </div>

            {/* 変数ヒント */}
            {VARIABLE_HINTS[activeTemplate] && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.35rem' }}>
                  使用可能な変数（クリックでコピー）
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {VARIABLE_HINTS[activeTemplate]!.map((v) => (
                    <button
                      key={v}
                      onClick={() => navigator.clipboard.writeText(v)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        color: 'var(--color-accent-dark)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">件名</label>
              <input
                className="form-input"
                value={templates[activeTemplate].subject}
                onChange={(e) => updateTemplate(activeTemplate, 'subject', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">本文</label>
              <textarea
                className="form-textarea"
                rows={18}
                value={templates[activeTemplate].body}
                onChange={(e) => updateTemplate(activeTemplate, 'body', e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </div>

            <button className="btn btn-primary" onClick={saveTemplates}>
              テンプレートを保存
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
