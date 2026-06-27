import { type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '../../hooks/useToast';

// ============================================================
// StatusBadge
// ============================================================
const STATUS_LABELS: Record<string, string> = {
  pending: '審査中',
  approved: '承認済み',
  rejected: '否認',
  suspended: '停止中',
  inquiry: '問い合わせ',
  scheduling: '相談調整中',
  scheduled: '相談予定',
  consulted: '相談実施済み',
  paid: '決済完了',
  reward_confirmed: '報酬確定',
  reward_paid: '支払済み',
  lost: '失注',
  excluded: '対象外',
  unconfirmed: '未確定',
  confirmed: '確定',
  individual: '個人',
  business: '法人',
  fixed: '固定額',
  percentage: '割合',
  tiered: '段階式',
  ordinary: '普通',
  current: '当座',
  in_person: '対面',
  online: 'オンライン',
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge badge-${status}`}>{label}</span>
  );
}

// ============================================================
// Toast コンテナ
// ============================================================
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  const icons = {
    success: <CheckCircle size={16} />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {icons[t.type]}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Modal
// ============================================================
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${size === 'lg' ? 'modal-lg' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ============================================================
// ConfirmDialog
// ============================================================
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '確認',
  confirmVariant = 'primary',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        {message}
      </p>
    </Modal>
  );
}

// ============================================================
// EmptyState
// ============================================================
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================
export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

// ============================================================
// CopyButton
// ============================================================
export function CopyButton({
  text,
  label = 'コピー',
  onCopied,
}: {
  text: string;
  label?: string;
  onCopied?: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied?.();
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      onCopied?.();
    }
  };

  return (
    <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
      {label}
    </button>
  );
}

// ============================================================
// QRCodeCard
// ============================================================
import { QRCodeCanvas } from 'qrcode.react';

export function QRCodeCard({
  url,
  size = 160,
}: {
  url: string;
  size?: number;
}) {
  const downloadQR = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'referral-qr.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="qr-card">
      <div id="qr-canvas">
        <QRCodeCanvas
          value={url || 'https://example.com'}
          size={size}
          bgColor="#ffffff"
          fgColor="#1C1A18"
          level="H"
          marginSize={2}
        />
      </div>
      <div className="qr-card-label">QRコードをスキャンして共有</div>
      <button className="btn btn-secondary btn-sm" onClick={downloadQR}>
        ダウンロード
      </button>
    </div>
  );
}
