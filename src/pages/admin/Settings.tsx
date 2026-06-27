import { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { AdminLayout } from '../../components/layout';
import { ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';

export default function AdminSettings() {
  const { settings, updateSettings } = useSettingsStore();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    addToast('設定を保存しました', 'success');
  };

  const update = (key: string, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <AdminLayout title="基本設定">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">基本設定</h1>
        <p className="page-subtitle">システム全体の設定を管理します</p>
      </div>

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
    </AdminLayout>
  );
}
