import { usePartnerStore } from '../../store/partnerStore';
import { PartnerLayout } from '../../components/layout';
import { CopyButton, ToastContainer } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { XCircle } from 'lucide-react';

export default function PartnerMaterials() {
  const { getCurrentPartner } = usePartnerStore();
  const { toasts, addToast, removeToast } = useToast();
  const partner = getCurrentPartner();
  const baseUrl = window.location.origin;
  const referralUrl = partner?.referralCode
    ? `${baseUrl}/propose?ref=${partner.referralCode}`
    : '[紹介リンク]';

  const templates = [
    {
      label: 'LINE用',
      icon: '💬',
      text: `プロポーズを考えている人向けに、撮影や当日の流れまで相談できるスタジオがあるので共有します。
いきなり申込ではなく、まずは相談からできるので、必要なら見てみてください。
${referralUrl}`,
    },
    {
      label: 'Instagram DM用',
      icon: '📸',
      text: `プロポーズ撮影を検討しているなら、こちらのスタジオがおすすめです。
撮影だけでなく、サプライズ演出や当日の流れまで一緒に考えてくれるのでとても安心できます。
まずは無料相談から。
${referralUrl}`,
    },
    {
      label: 'メール用',
      icon: '📧',
      text: `件名：プロポーズ撮影のご紹介

いつもお世話になっております。

突然のご連絡で恐縮ですが、プロポーズをお考えの方にぜひご紹介したいスタジオがあります。

スタジオうえじでは、プロポーズ撮影だけでなく、サプライズ演出や当日の流れまでトータルでご相談いただけます。まずは無料相談からお気軽にどうぞ。

詳細はこちらからご確認いただけます：
${referralUrl}

ご参考になれば幸いです。`,
    },
    {
      label: 'SNS投稿用',
      icon: '🌐',
      text: `プロポーズ撮影やサプライズ演出を相談できるスタジオです。
関西エリアでプロポーズを検討している方は、こちらから詳細を確認できます。
${referralUrl}

#プロポーズ #プロポーズ撮影 #関西 #大阪 #スタジオうえじ
※このリンク経由で成約した場合、紹介者に紹介報酬が発生する場合があります。`,
    },
    {
      label: '店頭案内用',
      icon: '🏪',
      text: `プロポーズをお考えのお客様へ

プロポーズの撮影や当日のサプライズ演出まで、トータルでサポートしてくれるスタジオをご紹介します。

まずは無料相談から始められます。

こちらのQRコードからアクセスいただくか、URLをお伝えします：
${referralUrl}

ご不明な点がございましたら、スタッフまでお声がけください。`,
    },
  ];

  const ngExamples = [
    '絶対に成功します',
    '必ず相手が喜びます',
    '無料で何でも相談できます',
    'どこでも撮影できます',
    '予算内で何でもできます',
    '確実に予約できます',
  ];

  return (
    <PartnerLayout>
      <div className="partner-content">
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="page-header">
          <h1 className="page-title">紹介素材</h1>
          <p className="page-subtitle">
            コピーして使えるテンプレートを用意しました。そのままお使いください。
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {templates.map((t, i) => (
            <div key={i} className="template-card">
              <div className="template-card-header">
                <div className="template-card-title">
                  {t.icon} {t.label}
                </div>
                <CopyButton
                  text={t.text}
                  label="コピー"
                  onCopied={() => addToast(`${t.label}をコピーしました`, 'success')}
                />
              </div>
              <div className="template-card-body">{t.text}</div>
            </div>
          ))}
        </div>

        {/* NG表現 */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--color-rejected)' }}>
              ⚠️ NG表現・注意事項
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.7 }}>
            以下のような誤解を招く表現は使用しないでください。紹介者規約違反となる場合があります。
          </p>
          <ul className="ng-list">
            {ngExamples.map((ng, i) => (
              <li key={i} className="ng-list-item">
                <XCircle size={14} className="ng-icon" />
                {ng}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PartnerLayout>
  );
}
