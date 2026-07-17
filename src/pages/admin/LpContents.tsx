import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout';
import { ToastContainer, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { useLpStore, type LpContent, type ContentType } from '../../store/lpStore';
import { Edit2, ExternalLink, AlertCircle } from 'lucide-react';
import { isGasConfigured } from '../../lib/gasApi';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'テキスト',
  textarea: '長文テキスト',
  image: '画像URL',
  rich_text: 'リッチテキスト',
};

const SECTION_LABELS: Record<string, string> = {
  hero_title: 'FV・メインコピー',
  hero_subtitle: 'FV・サブコピー',
  cta_text: 'CTAボタン文言',
  hero_image: 'FV・画像',
  chapel_title: 'チャペル訴求・タイトル',
  chapel_body: 'チャペル訴求・本文',
  surprise_title: 'サプライズ演出・タイトル',
  surprise_body: 'サプライズ演出・本文',
  price_base: '料金・基本価格',
  price_note: '料金・注意書き',
  thanks_title: '申込完了・タイトル',
  thanks_body: '申込完了・本文',
  partner_template_line: '紹介テンプレート（LINE）',
};

export default function AdminLpContents() {
  const { contents, fetchContents, updateContent } = useLpStore();
  const { toasts, addToast, removeToast } = useToast();
  const [editing, setEditing] = useState<LpContent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const isGas = isGasConfigured();

  useEffect(() => {
    fetchContents('propose');
  }, [fetchContents]);

  const openEdit = (content: LpContent) => {
    setEditing(content);
    setEditValue(content.contentValue);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const ok = await updateContent(editing.contentId, editValue);
    setSaving(false);
    if (ok) {
      addToast('更新しました', 'success');
      setEditing(null);
    } else {
      addToast('更新に失敗しました', 'error');
    }
  };

  return (
    <AdminLayout title="LP コンテンツ管理">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">LPコンテンツ管理</h1>
            <p className="page-subtitle">プロポーズLPの文言・画像を管理画面から編集できます</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!isGas && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-pending)', background: 'var(--color-pending-bg)', border: '1px solid var(--color-pending-border)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertCircle size={14} />
                ローカル編集（GAS未接続）
              </div>
            )}
            <a
              href="/propose"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={14} />
              LPをプレビュー
            </a>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {contents.map((content) => (
          <div key={content.contentId} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{content.fieldLabel}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent-bg)',
                      border: '1px solid var(--color-accent-light)',
                      color: 'var(--color-accent-dark)',
                    }}
                  >
                    {CONTENT_TYPE_LABELS[content.contentType]}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                  {SECTION_LABELS[content.fieldKey] || content.fieldKey}
                </div>

                {content.contentType === 'image' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {content.contentValue && (
                      <img
                        src={content.contentValue}
                        alt={content.fieldLabel}
                        style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      />
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                      {content.contentValue || '未設定'}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-secondary)',
                      background: 'var(--color-bg)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 80,
                      overflow: 'hidden',
                    }}
                  >
                    {content.contentValue || <span style={{ color: 'var(--color-text-tertiary)' }}>未設定</span>}
                  </div>
                )}

                {content.updatedAt && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.35rem' }}>
                    最終更新: {new Date(content.updatedAt).toLocaleString('ja-JP')}
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => openEdit(content)}
              >
                <Edit2 size={14} />
                編集
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 編集モーダル */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`編集: ${editing?.fieldLabel || ''}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存する'}
            </button>
          </>
        }
      >
        {editing?.contentType === 'image' ? (
          <>
            <div className="form-group">
              <label className="form-label">画像URL</label>
              <input
                className="form-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="https://..."
              />
            </div>
            {editValue && (
              <div style={{ marginTop: '0.75rem' }}>
                <img
                  src={editValue}
                  alt="プレビュー"
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                />
              </div>
            )}
          </>
        ) : editing?.contentType === 'textarea' || editing?.contentType === 'rich_text' ? (
          <div className="form-group">
            <label className="form-label">{editing.fieldLabel}</label>
            <textarea
              className="form-textarea"
              rows={8}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <div className="form-hint">改行はそのまま反映されます</div>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">{editing?.fieldLabel}</label>
            <input
              className="form-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
